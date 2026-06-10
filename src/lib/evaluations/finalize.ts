import { EvaluationLane, EvaluationStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  computeBaselineDeviation,
  computeConsistencyScore,
  extractRunMetrics,
  parseBaselineProfile,
  updateBaselineProfile,
  type BaselineDeviation,
} from "@/lib/reputation/baseline";
import { parseDomainTags } from "@/lib/reputation/domains";
import {
  buildPortableReputation,
  buildReputationCertificate,
  certificationTierFromScore,
  computePerformanceScore,
  computePublicReputation,
  updateDomainScores,
} from "@/lib/reputation/scores";
import { buildSignedBehaviorSummary } from "@/lib/evaluations/behavior-summary";

type EvaluationResult = {
  overall: number;
  reliability: number;
  latency: number;
  accuracy: number;
  passed: boolean;
  failureReason?: string;
};

export async function finalizeEvaluationRun(input: {
  evaluationId: string;
  agentId: string;
  lane: EvaluationLane;
  result: EvaluationResult;
  audit: { logCount: number; auditHash: string; runHash: string };
  costUsd?: number;
  latencyMs?: number;
}) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: input.agentId } });
  const domainTags = parseDomainTags(agent.domainTags);
  const baseline = parseBaselineProfile(agent.baselineProfile);

  const performanceScore = computePerformanceScore({
    overall: input.result.overall,
    reliability: input.result.reliability,
    latency: input.result.latency,
    accuracy: input.result.accuracy,
  });

  const runMetrics = extractRunMetrics({
    passed: input.result.passed,
    performanceScore,
    latencyMs: input.latencyMs ?? input.result.latency,
    costUsd: input.costUsd ?? 0.003,
    errorTypes: input.result.passed ? [] : ["evaluation_failure"],
  });

  let baselineDeviation: BaselineDeviation | null = null;
  let updatedBaseline = baseline;

  if (input.lane === EvaluationLane.PRACTICE) {
    updatedBaseline = updateBaselineProfile(baseline, runMetrics);
  } else if (input.lane === EvaluationLane.CERTIFICATION) {
    baselineDeviation = computeBaselineDeviation(baseline, runMetrics);
  }

  const recentEvaluations = await prisma.evaluation.findMany({
    where: {
      agentId: input.agentId,
      lane: EvaluationLane.CERTIFICATION,
      status: { in: [EvaluationStatus.PASSED, EvaluationStatus.FAILED] },
    },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { baselineDeviation: true },
  });

  const recentDeviations = recentEvaluations
    .map((row) => row.baselineDeviation as BaselineDeviation | null)
    .filter((value): value is BaselineDeviation => value !== null);

  if (baselineDeviation) recentDeviations.unshift(baselineDeviation);

  const consistencyScore = computeConsistencyScore(updatedBaseline, recentDeviations);

  const { summary, signature } = buildSignedBehaviorSummary({
    evaluationId: input.evaluationId,
    agentDid: agent.agentDid,
    domainTags,
    logCount: input.audit.logCount,
    auditHash: input.audit.auditHash,
    runHash: input.audit.runHash,
  });

  await prisma.behaviorAudit.updateMany({
    where: { evaluationId: input.evaluationId },
    data: {
      domainContext: domainTags,
      signedSummary: signature,
    },
  });

  let reputationCertificate: Prisma.InputJsonValue | undefined;
  let reputationCertHash: string | undefined;

  if (input.lane === EvaluationLane.CERTIFICATION) {
    const cert = buildReputationCertificate({
      agentDid: agent.agentDid,
      evaluationId: input.evaluationId,
      passed: input.result.passed,
      performanceScore,
      consistencyScore,
      baselineDeviation,
    });
    reputationCertificate = { ...cert.payload, signature: cert.signature } as Prisma.InputJsonValue;
    reputationCertHash = cert.certHash;
  }

  return {
    performanceScore,
    runMetrics,
    baselineDeviation,
    updatedBaseline,
    consistencyScore,
    behaviorSummary: { ...summary, signature },
    reputationCertificate,
    reputationCertHash,
    domainTags,
  };
}

export async function refreshAgentScoresAfterEvaluation(input: {
  agentId: string;
  lane: EvaluationLane;
  passed: boolean;
  performanceScore: number;
  confidenceScore: number;
  consistencyScore: number;
  updatedBaseline: ReturnType<typeof parseBaselineProfile>;
  baselineDeviation: BaselineDeviation | null;
  domainTags: ReturnType<typeof parseDomainTags>;
  reputationCertificate?: Prisma.InputJsonValue;
  reputationCertHash?: string;
}) {
  const agent = await prisma.agent.findUniqueOrThrow({ where: { id: input.agentId } });
  const domainScores = updateDomainScores(
    (agent.domainScores as Record<string, number>) ?? {},
    input.domainTags,
    input.performanceScore,
    input.consistencyScore,
  );

  const agentUpdate: {
    confidenceScore: number;
    consistencyScore: number;
    baselineProfile: Prisma.InputJsonValue;
    domainScores: Prisma.InputJsonValue;
    performanceScore?: number;
    reputationScore?: number;
    certificationTier?: number;
    lastCertifiedAt?: Date;
    status?: "ACTIVE";
    reputationDecayAt?: Date;
    reputationCertHash?: string;
  } = {
    confidenceScore: input.confidenceScore,
    consistencyScore: input.consistencyScore,
    baselineProfile: input.updatedBaseline as Prisma.InputJsonValue,
    domainScores: domainScores as Prisma.InputJsonValue,
  };

  if (input.lane === EvaluationLane.CERTIFICATION && input.passed) {
    const publicScore = computePublicReputation(
      input.performanceScore,
      input.confidenceScore,
      input.consistencyScore,
      new Date(),
      input.baselineDeviation,
    );
    agentUpdate.performanceScore = input.performanceScore;
    agentUpdate.reputationScore = publicScore;
    agentUpdate.certificationTier = certificationTierFromScore(publicScore);
    agentUpdate.lastCertifiedAt = new Date();
    agentUpdate.reputationDecayAt = new Date();
    agentUpdate.status = "ACTIVE";
    if (input.reputationCertHash) agentUpdate.reputationCertHash = input.reputationCertHash;
  } else if (input.lane === EvaluationLane.CERTIFICATION && !input.passed) {
    agentUpdate.performanceScore = 0;
    agentUpdate.reputationScore = 0;
    agentUpdate.certificationTier = 0;
  }

  await prisma.agent.update({ where: { id: input.agentId }, data: agentUpdate });

  const updatedAgent = await prisma.agent.findUniqueOrThrow({ where: { id: input.agentId } });
  const portable = buildPortableReputation({
    agentDid: updatedAgent.agentDid,
    agentId: updatedAgent.id,
    performanceScore: updatedAgent.performanceScore,
    consistencyScore: updatedAgent.consistencyScore,
    confidenceScore: updatedAgent.confidenceScore,
    publicScore: updatedAgent.reputationScore,
    domainScores: (updatedAgent.domainScores as Record<string, number>) ?? {},
    certificationTier: updatedAgent.certificationTier,
    lastCertifiedAt: updatedAgent.lastCertifiedAt,
    bundleHash: updatedAgent.bundleHash,
  });

  return { portable, reputationCertificate: input.reputationCertificate };
}
