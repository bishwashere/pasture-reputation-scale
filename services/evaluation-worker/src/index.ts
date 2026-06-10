import express from "express";
import { processEvaluationJob } from "./process-evaluation.js";

const app = express();
app.use(express.json({ limit: "2mb" }));

const PORT = Number(process.env.PORT ?? 8080);
const WORKER_SECRET = process.env.WORKER_SECRET ?? "dev-worker-secret";

function authorize(req: express.Request, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${WORKER_SECRET}`) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "rep-protocol-evaluation-worker",
    dockerEnabled: process.env.DOCKER_ENABLED === "true",
  });
});

/** Receives evaluation jobs from Next.js (coordinator) or QStash */
app.post("/jobs/run", authorize, async (req, res) => {
  const evaluationId = req.body?.evaluationId as string | undefined;
  if (!evaluationId) {
    res.status(400).json({ error: "evaluationId required" });
    return;
  }

  try {
    const evaluation = await processEvaluationJob(evaluationId);
    res.json({ ok: true, evaluationId, status: evaluation.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Job failed";
    console.error("[worker] job failed:", message);
    res.status(500).json({ error: message });
  }
});

app.listen(PORT, () => {
  console.log(`Evaluation worker listening on :${PORT}`);
});
