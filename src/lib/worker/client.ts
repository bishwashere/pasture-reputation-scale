import { Client } from "@upstash/qstash";

const WORKER_URL = process.env.EVALUATION_WORKER_URL ?? "http://localhost:8080";
const WORKER_SECRET = process.env.WORKER_SECRET ?? "dev-worker-secret";

let qstashClient: Client | null = null;

function getQStash() {
  if (!process.env.QSTASH_TOKEN) return null;
  if (!qstashClient) qstashClient = new Client({ token: process.env.QSTASH_TOKEN });
  return qstashClient;
}

/**
 * Dispatch an evaluation job to the Evaluation Worker.
 * Next.js (Vercel) never runs agent code — it only coordinates.
 */
export async function dispatchEvaluationJob(evaluationId: string) {
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
    return { queued: true, messageId: response.messageId };
  }

  // Dev: async dispatch to local worker (non-blocking)
  fetch(targetUrl, {
    method: "POST",
    headers: { ...headers, "Content-Type": "application/json" },
    body: JSON.stringify({ evaluationId }),
  }).catch((err) => console.error("[coordinator] worker dispatch failed:", err));

  return { queued: true, inline: false, dev: true };
}

export function isWorkerConfigured() {
  return Boolean(process.env.EVALUATION_WORKER_URL);
}
