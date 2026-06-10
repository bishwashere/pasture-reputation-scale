import { EvaluationLane } from "@prisma/client";

export const ROLLING_WINDOW_DAYS = 90;

export const LANE_LIMITS = {
  PRACTICE: {
    maxAttempts: 40,
    costCents: 600,
    label: "Practice Lane",
    description:
      "$6 per run, max 40 runs per 90 days. Full feedback. Does not affect public reputation.",
    affectsPublicReputation: false,
    feedbackLevel: "FULL" as const,
    requiresCommitment: false,
  },
  CERTIFICATION: {
    maxAttempts: 2,
    costCents: 0,
    label: "Certification Lane",
    description:
      "Max 2 attempts per 90 days. Minimal feedback. Failures are public and update reputation.",
    affectsPublicReputation: true,
    feedbackLevel: "MINIMAL" as const,
    requiresCommitment: true,
  },
} as const;

export const REPUTATION_DECAY_HALF_LIFE_DAYS = 90;

export function rollingWindowStart(now = new Date()) {
  return new Date(now.getTime() - ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function applyReputationDecay(
  score: number,
  lastCertifiedAt: Date | null,
  now = new Date(),
) {
  if (!lastCertifiedAt || score === 0) return score;
  const daysSince = (now.getTime() - lastCertifiedAt.getTime()) / (1000 * 60 * 60 * 24);
  const decayFactor = Math.pow(0.5, daysSince / REPUTATION_DECAY_HALF_LIFE_DAYS);
  return Math.round(score * decayFactor * 10) / 10;
}

export function countTowardLaneLimit(status: string) {
  return !["CANCELLED", "ABANDONED"].includes(status);
}

export function formatLaneCost(cents: number) {
  if (cents === 0) return "Free";
  return `$${(cents / 100).toFixed(2)}`;
}

export type LaneKey = keyof typeof LANE_LIMITS;

export function getLaneConfig(lane: EvaluationLane) {
  return LANE_LIMITS[lane as LaneKey];
}
