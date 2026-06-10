import { formatScore } from "@/lib/utils";
import { Shield, TrendingDown, AlertTriangle } from "lucide-react";

export function ReputationBadge({
  score,
  tier,
  decayed,
}: {
  score: number;
  tier?: number;
  decayed?: boolean;
}) {
  const color =
    score >= 75 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-rose-400";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1">
      <Shield className={`h-4 w-4 ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{formatScore(score)}</span>
      {tier !== undefined && tier > 0 ? (
        <span className="text-xs text-zinc-400">Tier {tier}</span>
      ) : null}
      {decayed ? (
        <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
          <TrendingDown className="h-3 w-3" />
          decayed
        </span>
      ) : null}
    </div>
  );
}

export function LaneCard({
  lane,
  title,
  description,
  attemptsUsed,
  maxAttempts,
  selected,
  onSelect,
}: {
  lane: "PRACTICE" | "CERTIFICATION";
  title: string;
  description: string;
  attemptsUsed: number;
  maxAttempts: number;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const isCert = lane === "CERTIFICATION";
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-xl border p-5 text-left transition ${
        selected
          ? "border-[#0052FF] bg-[#0052FF]/10"
          : "border-zinc-800 bg-zinc-900 hover:border-zinc-600"
      }`}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-white">{title}</h3>
        <span className="text-xs text-zinc-400">
          {attemptsUsed}/{maxAttempts} used
        </span>
      </div>
      <p className="text-sm text-zinc-400">{description}</p>
      {isCert ? (
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-amber-400">
          <AlertTriangle className="h-3 w-3" />
          Failures are public and affect reputation
        </p>
      ) : null}
    </button>
  );
}

export function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    QUEUED: "bg-zinc-800 text-zinc-300",
    RUNNING: "bg-blue-900/50 text-blue-300",
    PASSED: "bg-emerald-900/50 text-emerald-300",
    FAILED: "bg-rose-900/50 text-rose-300",
    ACTIVE: "bg-emerald-900/50 text-emerald-300",
    DRAFT: "bg-zinc-800 text-zinc-300",
    SUSPENDED: "bg-rose-900/50 text-rose-300",
  };
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${styles[status] ?? "bg-zinc-800 text-zinc-300"}`}
    >
      {status}
    </span>
  );
}
