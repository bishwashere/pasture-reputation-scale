import { prisma } from "@/lib/prisma";
import { getAgentReputation } from "@/lib/services/agents";
import { ReputationBadge, StatusPill } from "@/components/reputation/badges";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgentsDirectoryPage() {
  const agents = await prisma.agent.findMany({
    include: { creator: true },
    orderBy: { reputationScore: "desc" },
  });

  const agentsWithRep = await Promise.all(
    agents.map(async (agent) => ({
      ...agent,
      reputation: await getAgentReputation(agent),
    })),
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Agent Directory</h1>
          <p className="mt-2 text-sm text-zinc-400">Open registry with bundle-specific reputation scores.</p>
        </div>
        <Link href="/leaderboard" className="text-sm text-[#0052FF] hover:underline">
          View leaderboard →
        </Link>
      </div>

      <div className="space-y-4">
        {agentsWithRep.map((agent) => (
          <Link key={agent.id} href={`/agents/${agent.id}`} className="block rounded-xl border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-600">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-white">{agent.name}</h2>
                  <StatusPill status={agent.status} />
                </div>
                <p className="mt-1 text-sm text-zinc-400">
                  {agent.platform} · {agent.creator?.displayName ?? "Independent"}
                </p>
              </div>
              <div className="text-right">
                <ReputationBadge score={agent.reputation.publicScore} tier={agent.certificationTier} />
                <p className="mt-1 text-xs text-zinc-500">
                  perf {agent.reputation.performanceScore} · conf {agent.reputation.confidenceScore}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
