import { prisma } from "@/lib/prisma";
import {
  buildPortableReputation,
  computePublicReputation,
} from "@/lib/reputation/scores";
import { applyReputationDecay, getLaneConfig } from "@/lib/reputation/constants";
import { parseDomainTags } from "@/lib/reputation/domains";
import { assertLaneAttemptAvailable } from "@/lib/lanes/limits";

import { EvaluationLane, EvaluationStatus, FeedbackLevel } from "@prisma/client";

export async function upsertUserByWallet(walletAddress: string) {
  const normalized = walletAddress.toLowerCase();
  return prisma.user.upsert({
    where: { walletAddress: normalized },
    create: { walletAddress: normalized },
    update: {},
  });
}

export async function getAgentReputation(agent: {
  id: string;
  agentDid: string;
  performanceScore: number;
  confidenceScore: number;
  consistencyScore: number;
  reputationScore: number;
  lastCertifiedAt: Date | null;
  bundleHash: string;
  domainScores: unknown;
  certificationTier: number;
  domainTags: unknown;
}) {
  const publicScore = computePublicReputation(
    agent.performanceScore,
    agent.confidenceScore,
    agent.consistencyScore,
    agent.lastCertifiedAt,
  );
  const portable = buildPortableReputation({
    agentDid: agent.agentDid,
    agentId: agent.id,
    performanceScore: agent.performanceScore,
    consistencyScore: agent.consistencyScore,
    confidenceScore: agent.confidenceScore,
    publicScore,
    domainScores: (agent.domainScores as Record<string, number>) ?? {},
    certificationTier: agent.certificationTier,
    lastCertifiedAt: agent.lastCertifiedAt,
    bundleHash: agent.bundleHash,
  });
  return {
    performanceScore: agent.performanceScore,
    confidenceScore: agent.confidenceScore,
    consistencyScore: agent.consistencyScore,
    publicScore,
    storedScore: agent.reputationScore,
    domainScores: (agent.domainScores as Record<string, number>) ?? {},
    domainTags: parseDomainTags(agent.domainTags),
    portable,
  };
}

export async function getDecayedReputation(agent: {
  reputationScore: number;
  lastCertifiedAt: Date | null;
}) {
  return applyReputationDecay(agent.reputationScore, agent.lastCertifiedAt);
}

export async function createEvaluation(input: {
  agentId: string;
  lane: EvaluationLane;
  ownerId: string;
  commitmentAccepted?: boolean;
  paymentTxHash?: string;
}) {
  const agent = await prisma.agent.findUnique({ where: { id: input.agentId } });
  if (!agent) throw new Error("Agent not found");
  if (agent.ownerId !== input.ownerId) throw new Error("Unauthorized");

  const laneInfo = await assertLaneAttemptAvailable(input.agentId, input.lane);
  const laneConfig = getLaneConfig(input.lane);

  if (laneConfig.requiresCommitment && !input.commitmentAccepted) {
    throw new Error("Certification requires explicit commitment");
  }

  return prisma.evaluation.create({
    data: {
      agentId: input.agentId,
      lane: input.lane,
      costCents: laneInfo.costCents,
      paymentTxHash: input.paymentTxHash,
      commitmentAccepted: input.commitmentAccepted ?? false,
      committedAt: input.commitmentAccepted ? new Date() : undefined,
      feedbackLevel:
        input.lane === EvaluationLane.CERTIFICATION
          ? FeedbackLevel.MINIMAL
          : FeedbackLevel.FULL,
    },
  });
}

export async function abandonEvaluation(evaluationId: string, ownerId: string) {
  const evaluation = await prisma.evaluation.findUnique({
    where: { id: evaluationId },
    include: { agent: true },
  });
  if (!evaluation) throw new Error("Evaluation not found");
  if (evaluation.agent.ownerId !== ownerId) throw new Error("Unauthorized");
  if (
    evaluation.status !== EvaluationStatus.QUEUED &&
    evaluation.status !== EvaluationStatus.RUNNING
  ) {
    throw new Error("Evaluation cannot be abandoned");
  }

  return prisma.evaluation.update({
    where: { id: evaluationId },
    data: {
      status: EvaluationStatus.ABANDONED,
      isPublicFailure: evaluation.lane === EvaluationLane.CERTIFICATION,
      completedAt: new Date(),
      failureReason: "Abandoned by creator",
    },
  });
}

export { assertLaneAttemptAvailable, getLaneUsage } from "@/lib/lanes/limits";