import { applyReputationDecay, REPUTATION_DECAY_HALF_LIFE_DAYS } from "@/lib/reputation/constants";
import type { BaselineDeviation } from "@/lib/reputation/baseline";
import type { DomainTag } from "@/lib/reputation/domains";
import { signPayload, hashObject } from "@/lib/crypto/signing";

export function computePerformanceScore(scores: {
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

export function computeConfidenceScore(input: {
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

export function applyDeviationAdjustedDecay(
  score: number,
  lastCertifiedAt: Date | null,
  deviation?: BaselineDeviation | null,
  now = new Date(),
) {
  let adjusted = applyReputationDecay(score, lastCertifiedAt, now);
  if (!deviation || deviation.overallDeviation <= 0) return adjusted;

  const penaltyFactor = Math.max(0.5, 1 - deviation.overallDeviation / 200);
  adjusted = Math.round(adjusted * penaltyFactor * 10) / 10;
  return adjusted;
}

export function computePublicReputation(
  performanceScore: number,
  confidenceScore: number,
  consistencyScore: number,
  lastCertifiedAt: Date | null,
  deviation?: BaselineDeviation | null,
) {
  const raw =
    performanceScore * 0.55 + confidenceScore * 0.2 + consistencyScore * 0.25;
  return applyDeviationAdjustedDecay(raw, lastCertifiedAt, deviation);
}

export function updateDomainScores(
  current: Record<string, number>,
  domainTags: DomainTag[],
  performanceScore: number,
  consistencyScore: number,
): Record<string, number> {
  const next = { ...current };
  const domainScore = Math.round((performanceScore * 0.7 + consistencyScore * 0.3) * 10) / 10;
  for (const tag of domainTags) {
    const prev = next[tag];
    next[tag] = prev === undefined ? domainScore : Math.round(((prev + domainScore) / 2) * 10) / 10;
  }
  return next;
}

export function certificationTierFromScore(score: number) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 60) return 1;
  return 0;
}

export type PortableReputationObject = {
  schema: "reputation-protocol/v1";
  agentDid: string;
  agentId: string;
  performanceScore: number;
  consistencyScore: number;
  confidenceScore: number;
  publicScore: number;
  domainScores: Record<string, number>;
  certificationTier: number;
  lastCertifiedAt: string | null;
  bundleHash: string;
  issuedAt: string;
};

export function buildPortableReputation(input: {
  agentDid: string;
  agentId: string;
  performanceScore: number;
  consistencyScore: number;
  confidenceScore: number;
  publicScore: number;
  domainScores: Record<string, number>;
  certificationTier: number;
  lastCertifiedAt: Date | null;
  bundleHash: string;
}) {
  const payload: PortableReputationObject = {
    schema: "reputation-protocol/v1",
    agentDid: input.agentDid,
    agentId: input.agentId,
    performanceScore: input.performanceScore,
    consistencyScore: input.consistencyScore,
    confidenceScore: input.confidenceScore,
    publicScore: input.publicScore,
    domainScores: input.domainScores,
    certificationTier: input.certificationTier,
    lastCertifiedAt: input.lastCertifiedAt?.toISOString() ?? null,
    bundleHash: input.bundleHash,
    issuedAt: new Date().toISOString(),
  };

  const signature = signPayload(payload);
  const certHash = hashObject({ payload, signature });

  return { payload, signature, certHash };
}

export type ReputationCertificate = {
  schema: "reputation-protocol/cert/v1";
  agentDid: string;
  evaluationId: string;
  lane: "CERTIFICATION";
  passed: boolean;
  performanceScore: number;
  consistencyScore: number;
  baselineDeviation: BaselineDeviation | null;
  issuedAt: string;
};

export function buildReputationCertificate(input: {
  agentDid: string;
  evaluationId: string;
  passed: boolean;
  performanceScore: number;
  consistencyScore: number;
  baselineDeviation: BaselineDeviation | null;
}) {
  const payload: ReputationCertificate = {
    schema: "reputation-protocol/cert/v1",
    agentDid: input.agentDid,
    evaluationId: input.evaluationId,
    lane: "CERTIFICATION",
    passed: input.passed,
    performanceScore: input.performanceScore,
    consistencyScore: input.consistencyScore,
    baselineDeviation: input.baselineDeviation,
    issuedAt: new Date().toISOString(),
  };

  const signature = signPayload(payload);
  const certHash = hashObject({ payload, signature });

  return { payload, signature, certHash };
}

export { REPUTATION_DECAY_HALF_LIFE_DAYS };
