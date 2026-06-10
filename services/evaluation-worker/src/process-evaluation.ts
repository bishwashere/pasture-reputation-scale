import {
  EvaluationLane,
  EvaluationStatus,
  FeedbackLevel,
  Prisma,
} from "@prisma/client";
import { prisma } from "./prisma.js";
import { decryptSecret } from "./crypto.js";
import { runIsolatedEvaluation } from "./docker-runner.js";
import { BehaviorLogger } from "./behavior.js";

const REPUTATION_DECAY_HALF_LIFE_DAYS = 90;

function getLaneConfig(lane: EvaluationLane) {
  return lane === EvaluationLane.CERTIFICATION
    ? { requiresCommitment: true, feedbackLevel: FeedbackLevel.MINIMAL as const }
    : { requiresCommitment: false, feedbackLevel: FeedbackLevel.FULL as const };
}

function computePerformanceScore(scores: {
  overall: number;
  reliability: number;
  latency: number;
  accuracy: number;
}) {
  const weighted =
    scores.overall * 0.35 +
    scores.reliability * 0.3 +
    scores.accuracy * 0.25 +
    scores.latency * 0.1;
  return Math.round(Math.min(100, Math.max(0, weighted)) * 10) / 10;
}

function computeConfidenceScore(input: {
  certificationCount: number;
  practiceCount: number;
  passedCertifications: number;
  bundleAgeDays: number;
}) {
  const certWeight = Math.min(input.certificationCount, 2) * 25;
  const passRate =
    input.certificationCount > 0
      ? (input.passedCertifications / input.certificationCount) * 30
      : 0;
  const practiceWeight = Math.min(input.practiceCount, 10) * 2;
  const ageWeight = Math.min(input.bundleAgeDays / 30, 1) * 15;
  return Math.round(Math.min(100, certWeight + passRate + practiceWeight + ageWeight) * 10) / 10;
}

function applyReputationDecay(score: number, lastCertifiedAt: Date | null) {
  if (!lastCertifiedAt || score === 0) return score;
  const daysSince = (Date.now() - lastCertifiedAt.getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, daysSince / REPUTATION_DECAY_HALF_LIFE_DAYS);
  return Math.round(score * decayFactor * 10) / 10;
}

function computePublicReputation(
  performanceScore: number,
  confidenceScore: number,
  lastCertifiedAt: Date | null,
) {
  return applyReputationDecay(performanceScore * 0.7 + confidenceScore * 0.3, lastCertifiedAt);
}

function certificationTierFromScore(score: number) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 60) return 1;
  return 0;
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

export async function processEvaluationJob(evaluationId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { agent: true },
  });

  if (!evaluation) throw new Error("Evaluation not found");
  if (evaluation.status !== EvaluationStatus.QUEUED) return evaluation;

  const laneConfig = getLaneConfig(evaluation.lane);
  if (laneConfig.requiresCommitment && !evaluation.commitmentAccepted) {
    throw new Error("Certification requires commitment");
  }

  await prisma.evaluation.update({
    where: { id: evaluationId },
    data: { status: EvaluationStatus.RUNNING, startedAt: new Date() },
  });

  const endpoint =
    evaluation.agent.modelEndpointUrl ?? evaluation.agent.endpointUrl ?? "";
  const apiKey = evaluation.agent.encryptedApiKey
    ? decryptSecret(evaluation.agent.encryptedApiKey)
    : undefined;

  let result;
  let logger: BehaviorLogger;

  try {
    ({ result, logger } = await runIsolatedEvaluation({
      evaluationId,
      endpointUrl: endpoint,
      apiKey,
      tools: evaluation.agent.tools as unknown[],
      config: evaluation.agent.config as Record<string, unknown>,
      lane: evaluation.lane,
    }));
  } catch (error) {
    await prisma.evaluation.update({
      where: { id: evaluationId },
      data: {
        status: EvaluationStatus.FAILED,
        failureReason: error instanceof Error ? error.message : "Worker execution failed",
        completedAt: new Date(),
        isPublicFailure: evaluation.lane === EvaluationLane.CERTIFICATION,
      },
    });
    throw error;
  }

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

  const updatedEvaluation = await prisma.evaluation.update({
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

  return updatedEvaluation;
}
