import Link from "next/link";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { ReputationBadge, StatusPill } from "@/components/reputation/badges";
import { getAgentReputation } from "@/lib/services/agents";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MyAgentsPage() {
  const agents = await prisma.agent.findMany({
    include: { evaluations: { orderBy: { createdAt: "desc" }, take: 1 } },
    orderBy: { updatedAt: "desc" },
  });

  const agentsWithRep = await Promise.all(
    agents.map(async (agent) => ({
      ...agent,
      reputation: await getAgentReputation(agent),
    })),
  );

  return (
    <DashboardShell
      title="My Agent Bundles"
      description="Manage bundles, run practice iterations, and schedule certification."
      activePath="/dashboard/agents"
    >
      {agentsWithRep.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-zinc-400">No agent bundles yet.</p>
          <Link href="/dashboard/agents/new" className="mt-4 inline-block text-sm text-[#0052FF] hover:underline">
            Submit your first bundle →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {agentsWithRep.map((agent) => (
            <Link key={agent.id} href={`/agents/${agent.id}`} className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="font-semibold text-white">{agent.name}</h2>
                    <StatusPill status={agent.status} />
                  </div>
                  <p className="mt-1 text-sm text-zinc-400">{agent.platform} · v{agent.version}</p>
                  <p className="mt-1 font-mono text-xs text-zinc-600">{agent.bundleHash.slice(0, 16)}…</p>
                </div>
                <ReputationBadge score={agent.reputation.publicScore} tier={agent.certificationTier} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
