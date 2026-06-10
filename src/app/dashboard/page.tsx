import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { LANE_LIMITS, REPUTATION_DECAY_HALF_LIFE_DAYS, formatLaneCost } from "@/lib/reputation/constants";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [agentCount, creatorCount, evaluationCount, publicFailures] = await Promise.all([
    prisma.agent.count(),
    prisma.creator.count(),
    prisma.evaluation.count(),
    prisma.evaluation.count({ where: { isPublicFailure: true } }),
  ]);

  return (
    <DashboardShell
      title="Overview"
      description="Pasture Reputation Protocol — manage agents, run evaluations, and track trust signals."
      activePath="/dashboard"
    >
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          ["Agents", agentCount],
          ["Creators", creatorCount],
          ["Evaluations", evaluationCount],
          ["Public Failures", publicFailures],
        ].map(([label, value]) => (
          <div key={label as string} className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <p className="text-sm text-zinc-400">{label}</p>
            <p className="mt-1 text-3xl font-semibold text-white">{value as number}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">Two-Lane Evaluation</h2>
          <ul className="mt-4 space-y-3 text-sm text-zinc-400">
            <li>
              <strong className="text-white">Practice:</strong>{" "}
              {LANE_LIMITS.PRACTICE.maxAttempts} runs / 90 days @{" "}
              {formatLaneCost(LANE_LIMITS.PRACTICE.costCents)} each
            </li>
            <li>
              <strong className="text-white">Certification:</strong>{" "}
              {LANE_LIMITS.CERTIFICATION.maxAttempts} attempts / 90 days, public history
            </li>
            <li>
              <strong className="text-white">Decay:</strong> reputation halves every{" "}
              {REPUTATION_DECAY_HALF_LIFE_DAYS} days without re-certification
            </li>
          </ul>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
          <h2 className="font-semibold text-white">Quick actions</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/dashboard/agents/new" className="text-sm text-[#0052FF] hover:underline">
              Submit a new agent →
            </Link>
            <Link href="/dashboard/agents" className="text-sm text-[#0052FF] hover:underline">
              View my agents →
            </Link>
            <Link href="/creators/register" className="text-sm text-[#0052FF] hover:underline">
              Register as creator →
            </Link>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
