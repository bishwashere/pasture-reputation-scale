export type RunMetrics = {
  successRate: number;
  latencyMs: number;
  costUsd: number;
  errorTypes: string[];
  performanceScore: number;
  passed: boolean;
};

export type BaselineProfile = {
  runCount: number;
  successRate: number;
  avgLatencyMs: number;
  avgCostUsd: number;
  errorTypeCounts: Record<string, number>;
  avgPerformanceScore: number;
  lastUpdatedAt: string;
};

export type BaselineDeviation = {
  successRateDelta: number;
  latencyDeltaPct: number;
  costDeltaPct: number;
  performanceDelta: number;
  newErrorTypes: string[];
  overallDeviation: number;
};

export function emptyBaseline(): BaselineProfile {
  return {
    runCount: 0,
    successRate: 0,
    avgLatencyMs: 0,
    avgCostUsd: 0,
    errorTypeCounts: {},
    avgPerformanceScore: 0,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function parseBaselineProfile(raw: unknown): BaselineProfile {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return emptyBaseline();
  const profile = raw as Partial<BaselineProfile>;
  return {
    runCount: profile.runCount ?? 0,
    successRate: profile.successRate ?? 0,
    avgLatencyMs: profile.avgLatencyMs ?? 0,
    avgCostUsd: profile.avgCostUsd ?? 0,
    errorTypeCounts: profile.errorTypeCounts ?? {},
    avgPerformanceScore: profile.avgPerformanceScore ?? 0,
    lastUpdatedAt: profile.lastUpdatedAt ?? new Date().toISOString(),
  };
}

export function updateBaselineProfile(
  current: BaselineProfile,
  metrics: RunMetrics,
): BaselineProfile {
  const n = current.runCount;
  const nextCount = n + 1;
  const successValue = metrics.passed ? 1 : 0;

  const errorTypeCounts = { ...current.errorTypeCounts };
  for (const errorType of metrics.errorTypes) {
    errorTypeCounts[errorType] = (errorTypeCounts[errorType] ?? 0) + 1;
  }

  return {
    runCount: nextCount,
    successRate: (current.successRate * n + successValue) / nextCount,
    avgLatencyMs: (current.avgLatencyMs * n + metrics.latencyMs) / nextCount,
    avgCostUsd: (current.avgCostUsd * n + metrics.costUsd) / nextCount,
    errorTypeCounts,
    avgPerformanceScore:
      (current.avgPerformanceScore * n + metrics.performanceScore) / nextCount,
    lastUpdatedAt: new Date().toISOString(),
  };
}

export function computeBaselineDeviation(
  baseline: BaselineProfile,
  metrics: RunMetrics,
): BaselineDeviation {
  if (baseline.runCount === 0) {
    return {
      successRateDelta: 0,
      latencyDeltaPct: 0,
      costDeltaPct: 0,
      performanceDelta: 0,
      newErrorTypes: metrics.errorTypes,
      overallDeviation: 0,
    };
  }

  const successRateDelta = (metrics.passed ? 1 : 0) - baseline.successRate;
  const latencyDeltaPct =
    baseline.avgLatencyMs > 0
      ? ((metrics.latencyMs - baseline.avgLatencyMs) / baseline.avgLatencyMs) * 100
      : 0;
  const costDeltaPct =
    baseline.avgCostUsd > 0
      ? ((metrics.costUsd - baseline.avgCostUsd) / baseline.avgCostUsd) * 100
      : 0;
  const performanceDelta = metrics.performanceScore - baseline.avgPerformanceScore;

  const newErrorTypes = metrics.errorTypes.filter(
    (errorType) => !(errorType in baseline.errorTypeCounts),
  );

  const overallDeviation =
    Math.abs(successRateDelta) * 30 +
    Math.min(Math.abs(latencyDeltaPct), 100) * 0.2 +
    Math.min(Math.abs(costDeltaPct), 100) * 0.1 +
    Math.abs(performanceDelta) * 0.4 +
    newErrorTypes.length * 5;

  return {
    successRateDelta,
    latencyDeltaPct,
    costDeltaPct,
    performanceDelta,
    newErrorTypes,
    overallDeviation: Math.round(overallDeviation * 10) / 10,
  };
}

export function computeConsistencyScore(
  baseline: BaselineProfile,
  recentDeviations: BaselineDeviation[],
): number {
  if (baseline.runCount < 2 || recentDeviations.length === 0) return 50;

  const avgDeviation =
    recentDeviations.reduce((sum, d) => sum + d.overallDeviation, 0) /
    recentDeviations.length;

  const score = Math.max(0, 100 - avgDeviation);
  return Math.round(score * 10) / 10;
}

export function extractRunMetrics(input: {
  passed: boolean;
  performanceScore: number;
  latencyMs: number;
  costUsd: number;
  errorTypes?: string[];
}): RunMetrics {
  return {
    successRate: input.passed ? 1 : 0,
    latencyMs: input.latencyMs,
    costUsd: input.costUsd,
    errorTypes: input.errorTypes ?? (input.passed ? [] : ["evaluation_failure"]),
    performanceScore: input.performanceScore,
    passed: input.passed,
  };
}
