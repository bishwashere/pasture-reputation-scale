import { prisma } from "@/lib/prisma";
import { getAgentReputation } from "@/lib/services/agents";
import { ReputationBadge } from "@/components/reputation/badges";
import Link from "next/link";
import { formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const agents = await prisma.agent.findMany({
    where: { status: { in: ["ACTIVE", "DRAFT"] } },
    include: { creator: true },
    take: 50,
  });

  const ranked = await Promise.all(
    agents.map(async (agent) => ({
      ...agent,
      reputation: await getAgentReputation(agent),
    })),
  );

  ranked.sort((a, b) => b.reputation.publicScore - a.reputation.publicScore);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Public Leaderboard</h1>
        <p className="mt-2 text-sm text-zinc-400">
          90-day rolling reputation — performance + confidence, with decay.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-zinc-400">
            <tr>
              <th className="px-4 py-3">#</th>
              <th className="px-4 py-3">Agent</th>
              <th className="px-4 py-3">Creator</th>
              <th className="px-4 py-3">Performance</th>
              <th className="px-4 py-3">Confidence</th>
              <th className="px-4 py-3">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {ranked.map((agent, index) => (
              <tr key={agent.id} className="border-t border-zinc-800 bg-zinc-950/50">
                <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                <td className="px-4 py-3">
                  <Link href={`/agents/${agent.id}`} className="font-medium text-white hover:text-[#0052FF]">
                    {agent.name}
                  </Link>
                  <p className="text-xs text-zinc-500">{agent.platform}</p>
                </td>
                <td className="px-4 py-3 text-zinc-400">{agent.creator?.displayName ?? "—"}</td>
                <td className="px-4 py-3">{formatScore(agent.reputation.performanceScore)}</td>
                <td className="px-4 py-3">{formatScore(agent.reputation.confidenceScore)}</td>
                <td className="px-4 py-3">
                  <ReputationBadge score={agent.reputation.publicScore} tier={agent.certificationTier} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
