import { Client } from "@upstash/qstash";
import { processEvaluationInline } from "@/lib/evaluations/inline-runner";

const WORKER_URL = process.env.EVALUATION_WORKER_URL ?? "http://localhost:8080";
const WORKER_SECRET = process.env.WORKER_SECRET ?? "dev-worker-secret";

/**
 * EVALUATION_MODE controls where agents are executed:
 *   "inline"  (default) — runs inside Next.js/Vercel. No Docker isolation.
 *                         Good for demos / trusted endpoints.
 *   "worker"            — dispatches to the Evaluation Worker (Docker host).
 *                         Required for untrusted agents.
 */
function getEvaluationMode(): "inline" | "worker" {
  return process.env.EVALUATION_MODE === "worker" ? "worker" : "inline";
}

let qstashClient: Client | null = null;

function getQStash() {
  if (!process.env.QSTASH_TOKEN) return null;
  if (!qstashClient) qstashClient = new Client({ token: process.env.QSTASH_TOKEN });
  return qstashClient;
}

/**
 * Dispatch an evaluation. Inline by default (runs on Vercel); worker mode
 * sends the job to the Docker-capable Evaluation Worker service.
 */
export async function dispatchEvaluationJob(evaluationId: string) {
  if (getEvaluationMode() === "inline") {
    const evaluation = await processEvaluationInline(evaluationId);
    return { mode: "inline" as const, status: evaluation.status };
  }

  const targetUrl = `${WORKER_URL.replace(/\/$/, "")}/jobs/run`;
  const headers = { Authorization: `Bearer ${WORKER_SECRET}` };

  const qstash = getQStash();
  if (qstash) {
    const response = await qstash.publishJSON({
      url: targetUrl,
      body: { evaluationId },
      headers,
      retries: 3,
    });
    return { mode: "worker" as const, queued: true, messageId: response.messageId };
  }

  // No QStash: fire-and-forget dispatch to the worker.
  fetch(targetUrl, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ evaluationId }),
  }).catch((err) => console.error("[coordinator] worker dispatch failed:", err));

  return { mode: "worker" as const, queued: true };
}

export function getEvaluationModeLabel() {
  return getEvaluationMode();
}
