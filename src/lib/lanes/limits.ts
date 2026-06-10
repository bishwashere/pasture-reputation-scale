import { prisma } from "@/lib/prisma";
import { EvaluationLane, EvaluationStatus } from "@prisma/client";
import {
  countTowardLaneLimit,
  getLaneConfig,
  rollingWindowStart,
} from "@/lib/reputation/constants";

export async function countLaneAttempts(agentId: string, lane: EvaluationLane) {
  const since = rollingWindowStart();
  const evaluations = await prisma.evaluation.findMany({
    where: {
      agentId,
      lane,
      createdAt: { gte: since },
    },
    select: { status: true },
  });
  return evaluations.filter((e) => countTowardLaneLimit(e.status)).length;
}

export async function assertLaneAttemptAvailable(agentId: string, lane: EvaluationLane) {
  const config = getLaneConfig(lane);
  const used = await countLaneAttempts(agentId, lane);
  if (used >= config.maxAttempts) {
    throw new Error(
      `${config.label}: limit reached (${used}/${config.maxAttempts} in rolling 90-day window)`,
    );
  }
  return { used, remaining: config.maxAttempts - used, costCents: config.costCents };
}

export async function getLaneUsage(agentId: string) {
  const [practiceUsed, certUsed] = await Promise.all([
    countLaneAttempts(agentId, EvaluationLane.PRACTICE),
    countLaneAttempts(agentId, EvaluationLane.CERTIFICATION),
  ]);
  return {
    practice: {
      used: practiceUsed,
      max: getLaneConfig(EvaluationLane.PRACTICE).maxAttempts,
      costCents: getLaneConfig(EvaluationLane.PRACTICE).costCents,
    },
    certification: {
      used: certUsed,
      max: getLaneConfig(EvaluationLane.CERTIFICATION).maxAttempts,
    },
  };
}

export async function getPublicCertificationHistory(agentId: string) {
  return prisma.evaluation.findMany({
    where: {
      agentId,
      lane: EvaluationLane.CERTIFICATION,
      status: { in: [EvaluationStatus.PASSED, EvaluationStatus.FAILED, EvaluationStatus.ABANDONED] },
    },
    select: {
      id: true,
      status: true,
      isPublicFailure: true,
      createdAt: true,
      completedAt: true,
      performanceScore: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
