/**
 * Agent Runner — runs inside an isolated Docker container per evaluation.
 * Reads JOB_PAYLOAD env, probes the creator's LLM endpoint, prints JSON to stdout.
 */
const payload = JSON.parse(process.env.JOB_PAYLOAD ?? "{}");

const logs = [];
function log(actionType, payload, costUsd) {
  logs.push({ actionType, payload, costUsd });
}

async function main() {
  log("SYSTEM", { phase: "agent_runner_start", evaluationId: payload.evaluationId });

  const prompt = "Reputation Protocol evaluation probe — respond with a brief summary.";
  log("LLM_REQUEST", { endpoint: payload.endpointUrl, prompt });

  const start = Date.now();
  const headers = { "Content-Type": "application/json" };
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

  const tests = [
    {
      name: "Endpoint reachable",
      passed: response.ok,
      score: response.ok ? 100 : 0,
      detail: response.ok ? `HTTP ${response.status} in ${durationMs}ms` : `HTTP ${response.status}`,
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

  const overall = tests.reduce((s, t) => s + t.score, 0) / tests.length;
  const passed = tests.every((t) => t.passed) && overall >= 60;

  log("SYSTEM", { phase: "agent_runner_complete" });

  const output = {
    result: {
      tests,
      overall: Math.round(overall),
      reliability: Math.round((tests.filter((t) => t.passed).length / tests.length) * 100),
      latency: tests[1]?.score ?? 0,
      accuracy: tests[2]?.score ?? 0,
      passed,
      failureReason: passed ? undefined : "Evaluation probes failed",
    },
    logs,
  };

  console.log(JSON.stringify(output));
}

main().catch((err) => {
  console.log(
    JSON.stringify({
      result: {
        tests: [{ name: "Runner error", passed: false, score: 0, detail: err.message }],
        overall: 0,
        reliability: 0,
        latency: 0,
        accuracy: 0,
        passed: false,
        failureReason: err.message,
      },
      logs: [{ actionType: "SYSTEM", payload: { phase: "agent_runner_error", message: err.message } }],
    }),
  );
  process.exit(1);
});
