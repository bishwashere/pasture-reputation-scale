"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { LANE_LIMITS, formatLaneCost } from "@/lib/reputation/constants";
import { LaneCard } from "@/components/reputation/badges";

type LaneUsage = {
  practice: { used: number; max: number; costCents: number };
  certification: { used: number; max: number };
};

export function RunEvaluationButton({ agentId }: { agentId: string }) {
  const { address } = useAccount();
  const [lane, setLane] = useState<"PRACTICE" | "CERTIFICATION">("PRACTICE");
  const [usage, setUsage] = useState<LaneUsage | null>(null);
  const [commitmentAccepted, setCommitmentAccepted] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`/api/evaluations?agentId=${agentId}`)
      .then((r) => r.json())
      .then((data) => setUsage(data.usage))
      .catch(() => null);
  }, [agentId]);

  async function handleRun() {
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    if (lane === "CERTIFICATION" && !commitmentAccepted) {
      setStatus("You must accept the certification commitment.");
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      const response = await fetch("/api/evaluations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId,
          lane,
          walletAddress: address,
          commitmentAccepted: lane === "CERTIFICATION" ? true : undefined,
          paymentTxHash: lane === "PRACTICE" ? `mock-${Date.now()}` : undefined,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to queue evaluation");
      setStatus("Job queued on Evaluation Worker. Refresh in a few seconds for results.");
      window.location.reload();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Evaluation failed");
    } finally {
      setLoading(false);
    }
  }

  const practiceUsed = usage?.practice.used ?? 0;
  const certUsed = usage?.certification.used ?? 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <LaneCard
          lane="PRACTICE"
          title={LANE_LIMITS.PRACTICE.label}
          description={`${formatLaneCost(LANE_LIMITS.PRACTICE.costCents)}/run · ${LANE_LIMITS.PRACTICE.description}`}
          attemptsUsed={practiceUsed}
          maxAttempts={LANE_LIMITS.PRACTICE.maxAttempts}
          selected={lane === "PRACTICE"}
          onSelect={() => setLane("PRACTICE")}
        />
        <LaneCard
          lane="CERTIFICATION"
          title={LANE_LIMITS.CERTIFICATION.label}
          description={LANE_LIMITS.CERTIFICATION.description}
          attemptsUsed={certUsed}
          maxAttempts={LANE_LIMITS.CERTIFICATION.maxAttempts}
          selected={lane === "CERTIFICATION"}
          onSelect={() => setLane("CERTIFICATION")}
        />
      </div>

      {lane === "CERTIFICATION" ? (
        <label className="flex items-start gap-3 rounded-lg border border-amber-900/50 bg-amber-950/20 p-4 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={commitmentAccepted}
            onChange={(e) => setCommitmentAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>
            I commit to this certification attempt. Failures will be public. I have only{" "}
            {LANE_LIMITS.CERTIFICATION.maxAttempts - certUsed} attempt(s) remaining in the
            90-day window.
          </span>
        </label>
      ) : (
        <p className="text-sm text-zinc-400">
          Practice run cost: {formatLaneCost(LANE_LIMITS.PRACTICE.costCents)} (mock payment in dev)
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleRun}
          disabled={loading}
          className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0047e0] disabled:opacity-50"
        >
          {loading ? "Running…" : `Run ${lane === "PRACTICE" ? "Practice" : "Certification"}`}
        </button>
      </div>
      {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
    </div>
  );
}
