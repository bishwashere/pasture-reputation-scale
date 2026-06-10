import {
  EvaluationLane,
  EvaluationStatus,
  FeedbackLevel,
  Prisma,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto/secrets";
import { BehaviorLogger } from "@/lib/evaluations/behavior";
import {
  certificationTierFromScore,
  computeConfidenceScore,
  computePerformanceScore,
  computePublicReputation,
} from "@/lib/reputation/scores";
import { getLaneConfig } from "@/lib/reputation/constants";

type SampleTestResult = {
  name: string;
  passed: boolean;
  score: number;
  detail: string;
  durationMs?: number;
};

type EvaluationRunResult = {
  tests: SampleTestResult[];
  overall: number;
  reliability: number;
  latency: number;
  accuracy: number;
  passed: boolean;
  failureReason?: string;
};

/**
 * Inline evaluation — runs directly inside the Next.js (Vercel) runtime.
 *
 * NOTE: This path does NOT provide Docker isolation. It is intended for
 * early testing and demos where the agent endpoints are trusted. For
 * untrusted agents, set EVALUATION_MODE=worker and run the Evaluation
 * Worker (services/evaluation-worker) on a Docker-capable host.
 */
async function probeEndpoint(
  endpointUrl: string,
  apiKey: string | undefined,
  tools: unknown[],
  config: Record<string, unknown>,
  logger: BehaviorLogger,
): Promise<EvaluationRunResult> {
  logger.log({
    actionType: "SYSTEM",
    payload: { phase: "inline_start", mode: "inline", isolated: false },
  });

  if (!endpointUrl) {
    logger.log({
      actionType: "SYSTEM",
      payload: { phase: "inline_error", reason: "missing_endpoint" },
    });
    return {
      tests: [
        { name: "Endpoint configured", passed: false, score: 0, detail: "No endpoint URL" },
      ],
      overall: 0,
      reliability: 0,
      latency: 0,
      accuracy: 0,
      passed: false,
      failureReason: "Missing endpoint URL",
    };
  }

  const prompt = "Reputation Protocol evaluation probe — respond with a brief summary.";
  logger.log({ actionType: "LLM_REQUEST", payload: { endpoint: endpointUrl, prompt } });

  const start = Date.now();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;

  let ok = false;
  let statusCode = 0;
  let body = "";
  let durationMs = 0;

  try {
    const response = await fetch(endpointUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, evaluation: true, tools, config }),
      signal: AbortSignal.timeout(12000),
    });
    durationMs = Date.now() - start;
    ok = response.ok;
    statusCode = response.status;
    body = await response.text();
  } catch (error) {
    durationMs = Date.now() - start;
    body = error instanceof Error ? error.message : "request failed";
  }

  logger.log({
    actionType: "LLM_RESPONSE",
    payload: { status: statusCode, durationMs, preview: body.slice(0, 300) },
    costUsd: 0.003,
  });

  if (tools.length) {
    logger.log({ actionType: "TOOL_CALL", payload: { tools } });
    logger.log({ actionType: "TOOL_RESULT", payload: { status: "logged" } });
  }

  const tests: SampleTestResult[] = [
    {
      name: "Endpoint reachable",
      passed: ok,
      score: ok ? 100 : 0,
      detail: ok ? `HTTP ${statusCode} in ${durationMs}ms` : `HTTP ${statusCode || "error"}`,
      durationMs,
    },
    {
      name: "Latency budget",
      passed: durationMs <= 3000,
      score: durationMs <= 500 ? 100 : durationMs <= 1500 ? 80 : durationMs <= 3000 ? 55 : 25,
      detail: `${durationMs}ms`,
      durationMs,
    },
    {
      name: "Response quality",
      passed: body.trim().length > 10,
      score: body.trim().length > 10 ? 85 : 20,
      detail: body.trim().length > 10 ? "Non-empty response" : "Too short",
    },
  ];

  const overall = tests.reduce((sum, t) => sum + t.score, 0) / tests.length;
  const passed = tests.every((t) => t.passed) && overall >= 60;

  logger.log({ actionType: "SYSTEM", payload: { phase: "inline_complete", passed } });

  return {
    tests,
    overall: Math.round(overall),
    reliability: Math.round((tests.filter((t) => t.passed).length / tests.length) * 100),
    latency: tests[1]?.score ?? 0,
    accuracy: tests[2]?.score ?? 0,
    passed,
    failureReason: passed ? undefined : "One or more evaluation probes failed",
  };
}

async function refreshAgentConfidence(agentId: string) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: agentId } });
  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

  const [practiceCount, certStats] = await Promise.all([
    prisma.evaluation.count({
      where: {
        agentId,
        lane: EvaluationLane.PRACTICE,
        status: EvaluationStatus.PASSED,
        createdAt: { gte: since },
      },
    }),
    prisma.evaluation.groupBy({
      by: ["status"],
      where: { agentId, lane: EvaluationLane.CERTIFICATION, createdAt: { gte: since } },
      _count: true,
    }),
  ]);

  const certificationCount = certStats.reduce((sum, s) => sum + s._count, 0);
  const passedCertifications =
    certStats.find((s) => s.status === EvaluationStatus.PASSED)?._count ?? 0;

  return computeConfidenceScore({
    certificationCount,
    practiceCount,
    passedCertifications,
    bundleAgeDays: (Date.now() - agent.createdAt.getTime()) / (1000 * 60 * 60 * 24),
  });
}

export async function processEvaluationInline(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { agent: true },
  });

  if (!evaluation) throw new Error("Evaluation not found");
  if (evaluation.status !== EvaluationStatus.QUEUED) return evaluation;

  const laneConfig = getLaneConfig(evaluation.lane);
  if (laneConfig.requiresCommitment && !evaluation.commitmentAccepted) {
    throw new Error("Certification requires commitment before execution");
  }

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { status: EvaluationStatus.RUNNING, startedAt: new Date() },
  });

  const endpoint = evaluation.agent.modelEndpointUrl ?? evaluation.agent.endpointUrl ?? "";
  const apiKey = evaluation.agent.encryptedApiKey
    ? decryptSecret(evaluation.agent.encryptedApiKey)
    : undefined;

  const logger = new BehaviorLogger();
  const result = await probeEndpoint(
    endpoint,
    apiKey,
    (evaluation.agent.tools as unknown[]) ?? [],
    (evaluation.agent.config as Record<string, unknown>) ?? {},
    logger,
  );

  const audit = await logger.persist(evaluationId);
  const performanceScore = computePerformanceScore({
    overall: result.overall,
    reliability: result.reliability,
    latency: result.latency,
    accuracy: result.accuracy,
  });

  const status = result.passed ? EvaluationStatus.PASSED : EvaluationStatus.FAILED;
  const isPublicFailure =
    evaluation.lane === EvaluationLane.CERTIFICATION && status === EvaluationStatus.FAILED;

  const resultsPayload: Prisma.InputJsonValue =
    laneConfig.feedbackLevel === FeedbackLevel.MINIMAL
      ? { passed: result.passed, summary: result.failureReason ?? "Certification complete" }
      : (result as unknown as Prisma.InputJsonValue);

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status,
      feedbackLevel: laneConfig.feedbackLevel,
      overallScore: result.overall,
      reliabilityScore: result.reliability,
      latencyScore: result.latency,
      accuracyScore: result.accuracy,
      performanceScore,
      results: resultsPayload,
      failureReason: result.failureReason,
      isPublicFailure,
      runHash: audit.runHash,
      auditHash: audit.auditHash,
      completedAt: new Date(),
    },
  });

  const confidenceScore = await refreshAgentConfidence(evaluation.agentId);

  const agentUpdate: {
    performanceScore?: number;
    confidenceScore: number;
    reputationScore?: number;
    certificationTier?: number;
    lastCertifiedAt?: Date;
    status?: "ACTIVE";
    reputationDecayAt?: Date;
  } = { confidenceScore };

  if (evaluation.lane === EvaluationLane.CERTIFICATION && result.passed) {
    agentUpdate.performanceScore = performanceScore;
    const publicScore = computePublicReputation(performanceScore, confidenceScore, new Date());
    agentUpdate.reputationScore = publicScore;
    agentUpdate.certificationTier = certificationTierFromScore(publicScore);
    agentUpdate.lastCertifiedAt = new Date();
    agentUpdate.reputationDecayAt = new Date();
    agentUpdate.status = "ACTIVE";
  } else if (evaluation.lane === EvaluationLane.CERTIFICATION && !result.passed) {
    agentUpdate.performanceScore = 0;
    agentUpdate.reputationScore = 0;
    agentUpdate.certificationTier = 0;
  }

  await prisma.agent.update({ where: { id: evaluation.agentId }, data: agentUpdate });
  await prisma.evaluation.update({ where: { id: evaluationId }, data: { confidenceScore } });

  return prisma.evaluation.findUniqueOrThrow({ where: { id: evaluationId } });
}
