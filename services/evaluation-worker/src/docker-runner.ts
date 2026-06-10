import { execFile } from "child_process";
import { promisify } from "util";
import type { JobOutput, JobPayload } from "./evaluation-runner.js";
import { runAgentProbe } from "./evaluation-runner.js";
import { BehaviorLogger } from "./behavior.js";
import type { BehaviorActionType } from "@prisma/client";

const execFileAsync = promisify(execFile);

const DOCKER_ENABLED = process.env.DOCKER_ENABLED === "true";
const AGENT_RUNNER_IMAGE =
  process.env.AGENT_RUNNER_IMAGE ?? "rep-protocol/agent-runner:latest";

/**
 * Spins up an isolated Docker container per evaluation job.
 * Falls back to in-process probe only when DOCKER_ENABLED=false (local dev without socket).
 */
export async function runIsolatedEvaluation(
  payload: JobPayload,
): Promise<{ result: JobOutput["result"]; logger: BehaviorLogger }> {
  const logger = new BehaviorLogger();
  logger.log({
    actionType: "SYSTEM",
    payload: { phase: "worker_received", evaluationId: payload.evaluationId, docker: DOCKER_ENABLED },
  });

  let output: JobOutput;

  if (DOCKER_ENABLED) {
    output = await runDockerContainer(payload);
    logger.log({
      actionType: "SYSTEM",
      payload: { phase: "docker_container_finished", image: AGENT_RUNNER_IMAGE },
    });
  } else {
    logger.log({
      actionType: "SYSTEM",
      payload: { phase: "inline_probe", reason: "DOCKER_ENABLED=false" },
    });
    output = await runAgentProbe(payload);
  }

  logger.merge(
    output.logs.map((entry) => ({
      actionType: entry.actionType as BehaviorActionType,
      payload: entry.payload,
      costUsd: entry.costUsd,
    })),
  );

  return { result: output.result, logger };
}

async function runDockerContainer(payload: JobPayload): Promise<JobOutput> {
  const payloadJson = JSON.stringify(payload);
  const network = process.env.DOCKER_NETWORK ?? "rep-protocol-net";

  const { stdout, stderr } = await execFileAsync(
    "docker",
    [
      "run",
      "--rm",
      "--network",
      network,
      "--read-only",
      "--tmpfs",
      "/tmp:rw,noexec,nosuid,size=64m",
      "--memory",
      "512m",
      "--cpus",
      "1",
      "-e",
      `JOB_PAYLOAD=${payloadJson}`,
      AGENT_RUNNER_IMAGE,
    ],
    { timeout: 120_000, maxBuffer: 10 * 1024 * 1024 },
  );

  if (stderr) console.warn("[docker]", stderr.slice(0, 500));

  const lines = stdout.trim().split("\n");
  const lastLine = lines[lines.length - 1];
  return JSON.parse(lastLine) as JobOutput;
}
