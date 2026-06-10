export type SampleTestResult = {
  name: string;
  passed: boolean;
  score: number;
  detail: string;
  durationMs?: number;
};

export type EvaluationRunResult = {
  tests: SampleTestResult[];
  overall: number;
  reliability: number;
  latency: number;
  accuracy: number;
  passed: boolean;
  failureReason?: string;
};

export type JobPayload = {
  evaluationId: string;
  endpointUrl: string;
  apiKey?: string;
  tools?: unknown[];
  config?: Record<string, unknown>;
  lane: string;
};

export type JobOutput = {
  result: EvaluationRunResult;
  logs: Array<{
    actionType: string;
    payload: Record<string, unknown>;
    costUsd?: number;
  }>;
};

function buildResultFromProbe(probe: {
  ok: boolean;
  status: number;
  durationMs: number;
  body: string;
}): EvaluationRunResult {
  const tests: SampleTestResult[] = [
    {
      name: "Endpoint reachable",
      passed: probe.ok,
      score: probe.ok ? 100 : 0,
      detail: probe.ok ? `HTTP ${probe.status} in ${probe.durationMs}ms` : `HTTP ${probe.status}`,
      durationMs: probe.durationMs,
    },
    {
      name: "Latency budget",
      passed: probe.durationMs <= 3000,
      score:
        probe.durationMs <= 500 ? 100 : probe.durationMs <= 1500 ? 80 : probe.durationMs <= 3000 ? 55 : 25,
      detail: `${probe.durationMs}ms`,
      durationMs: probe.durationMs,
    },
    {
      name: "Response quality",
      passed: probe.body.trim().length > 10,
      score: probe.body.trim().length > 10 ? 85 : 20,
      detail: probe.body.trim().length > 10 ? "Non-empty response" : "Too short",
    },
  ];

  const overall = tests.reduce((s, t) => s + t.score, 0) / tests.length;
  const passed = tests.every((t) => t.passed) && overall >= 60;

  return {
    tests,
    overall: Math.round(overall),
    reliability: Math.round((tests.filter((t) => t.passed).length / tests.length) * 100),
    latency: tests[1]?.score ?? 0,
    accuracy: tests[2]?.score ?? 0,
    passed,
    failureReason: passed ? undefined : "Evaluation probes failed",
  };
}

/** Runs inside the agent-runner Docker container (isolated network) */
export async function runAgentProbe(payload: JobPayload): Promise<JobOutput> {
  const logs: JobOutput["logs"] = [];
  const log = (actionType: string, logPayload: Record<string, unknown>, costUsd?: number) => {
    logs.push({ actionType, payload: logPayload, costUsd });
  };

  log("SYSTEM", { phase: "container_start", evaluationId: payload.evaluationId });

  const prompt = "Reputation Protocol evaluation probe — respond with a brief summary.";
  log("LLM_REQUEST", { endpoint: payload.endpointUrl, prompt });

  const start = Date.now();
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (payload.apiKey) headers.Authorization = `Bearer ${payload.apiKey}`;

  const response = await fetch(payload.endpointUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      prompt,
      evaluation: true,
      tools: payload.tools ?? [],
      config: payload.config ?? {},
    }),
    signal: AbortSignal.timeout(12000),
  });

  const durationMs = Date.now() - start;
  const body = await response.text();

  log("LLM_RESPONSE", { status: response.status, durationMs, preview: body.slice(0, 300) }, 0.003);

  if (payload.tools?.length) {
    log("TOOL_CALL", { tools: payload.tools });
    log("TOOL_RESULT", { status: "logged" });
  }

  log("SYSTEM", { phase: "container_complete" });

  return {
    result: buildResultFromProbe({ ok: response.ok, status: response.status, durationMs, body }),
    logs,
  };
}

export { buildResultFromProbe };
