import { formatScore } from "@/lib/utils";
import { StatusPill } from "@/components/reputation/badges";
import type { EvaluationLane, EvaluationStatus, FeedbackLevel, Prisma } from "@prisma/client";

type EvaluationResult = {
  id: string;
  lane: EvaluationLane;
  status: EvaluationStatus;
  feedbackLevel: FeedbackLevel;
  overallScore: number | null;
  reliabilityScore: number | null;
  latencyScore: number | null;
  accuracyScore: number | null;
  performanceScore: number | null;
  confidenceScore: number | null;
  failureReason: string | null;
  isPublicFailure: boolean;
  runHash: string | null;
  auditHash: string | null;
  baselineDeviation?: Prisma.JsonValue;
  results: Prisma.JsonValue;
  createdAt: Date;
  completedAt: Date | null;
};

function parseTestResults(results: Prisma.JsonValue) {
  if (!results || typeof results !== "object" || Array.isArray(results)) return null;
  if (!("tests" in results) || !Array.isArray(results.tests)) return null;
  return results.tests as Array<{
    name: string;
    passed: boolean;
    score: number;
    detail: string;
    durationMs?: number;
  }>;
}

export function EvaluationResults({ evaluations }: { evaluations: EvaluationResult[] }) {
  if (evaluations.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-zinc-700 p-6 text-sm text-zinc-400">
        No evaluations yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {evaluations.map((evaluation) => {
        const tests = parseTestResults(evaluation.results);
        const isMinimal = evaluation.feedbackLevel === "MINIMAL";

        return (
          <article key={evaluation.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <StatusPill status={evaluation.status} />
              <span className="text-xs uppercase tracking-wide text-zinc-500">
                {evaluation.lane}
              </span>
              {evaluation.isPublicFailure ? (
                <span className="text-xs font-medium text-rose-400">Public record</span>
              ) : null}
              {evaluation.runHash ? (
                <span className="font-mono text-xs text-zinc-600" title={evaluation.runHash}>
                  run:{evaluation.runHash.slice(0, 8)}…
                </span>
              ) : null}
              <span className="ml-auto text-xs text-zinc-500">
                {new Date(evaluation.createdAt).toLocaleString()}
              </span>
            </div>

            {!isMinimal && evaluation.overallScore !== null ? (
              <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                {[
                  ["Overall", evaluation.overallScore],
                  ["Performance", evaluation.performanceScore],
                  ["Confidence", evaluation.confidenceScore],
                  ["Reliability", evaluation.reliabilityScore],
                  ["Latency", evaluation.latencyScore],
                  ["Accuracy", evaluation.accuracyScore],
                ].map(([label, score]) => (
                  <div key={label as string} className="rounded-lg bg-zinc-950 p-3">
                    <p className="text-xs text-zinc-500">{label}</p>
                    <p className="text-lg font-semibold text-white">
                      {score !== null ? formatScore(score as number) : "—"}
                    </p>
                  </div>
                ))}
              </div>
            ) : isMinimal ? (
              <div className="mb-3 space-y-2 text-sm text-zinc-400">
                <p>
                  {evaluation.status === "PASSED"
                    ? "Certification passed. Detailed feedback withheld."
                    : evaluation.failureReason ?? "Certification failed."}
                </p>
                {evaluation.baselineDeviation &&
                typeof evaluation.baselineDeviation === "object" &&
                !Array.isArray(evaluation.baselineDeviation) ? (
                  <p className="text-xs text-zinc-500">
                    Baseline deviation:{" "}
                    {"overallDeviation" in evaluation.baselineDeviation
                      ? String(evaluation.baselineDeviation.overallDeviation)
                      : "—"}
                  </p>
                ) : null}
              </div>
            ) : null}

            {evaluation.failureReason && !isMinimal ? (
              <p className="mb-3 text-sm text-rose-400">{evaluation.failureReason}</p>
            ) : null}

            {tests ? (
              <ul className="space-y-2">
                {tests.map((test) => (
                  <li key={test.name} className="flex items-start justify-between rounded-lg bg-zinc-950 px-3 py-2 text-sm">
                    <div>
                      <p className="font-medium text-white">{test.name}</p>
                      <p className="text-zinc-400">{test.detail}</p>
                    </div>
                    <span className={test.passed ? "text-emerald-400" : "text-rose-400"}>
                      {test.passed ? "Pass" : "Fail"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

export function CertificationHistory({
  records,
}: {
  records: Array<{
    id: string;
    status: string;
    isPublicFailure: boolean;
    createdAt: Date;
    performanceScore: number | null;
  }>;
}) {
  if (records.length === 0) {
    return <p className="text-sm text-zinc-400">No public certification history.</p>;
  }
  return (
    <ul className="space-y-2">
      {records.map((record) => (
        <li key={record.id} className="flex items-center justify-between rounded-lg bg-zinc-950 px-3 py-2 text-sm">
          <div className="flex items-center gap-3">
            <StatusPill status={record.status} />
            <span className="text-zinc-400">{new Date(record.createdAt).toLocaleDateString()}</span>
          </div>
          {record.performanceScore !== null ? (
            <span className="text-zinc-300">{formatScore(record.performanceScore)}</span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
