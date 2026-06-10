import { applyReputationDecay, REPUTATION_DECAY_HALF_LIFE_DAYS } from "@/lib/reputation/constants";

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

export function computePublicReputation(
  performanceScore: number,
  confidenceScore: number,
  lastCertifiedAt: Date | null,
) {
  const raw = performanceScore * 0.7 + confidenceScore * 0.3;
  return applyReputationDecay(raw, lastCertifiedAt);
}

export function certificationTierFromScore(score: number) {
  if (score >= 90) return 3;
  if (score >= 75) return 2;
  if (score >= 60) return 1;
  return 0;
}

export { REPUTATION_DECAY_HALF_LIFE_DAYS };
