import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatEth, truncateAddress } from "@/lib/utils";
import { ReputationBadge } from "@/components/reputation/badges";
import { StakeForm } from "@/components/creators/stake-form";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CreatorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const creator = await prisma.creator.findUnique({
    where: { id },
    include: {
      user: true,
      agents: { orderBy: { reputationScore: "desc" } },
      stakesReceived: {
        include: { staker: true },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!creator) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-white">{creator.displayName}</h1>
                <p className="mt-1 font-mono text-sm text-zinc-500">
                  {truncateAddress(creator.user.walletAddress)}
                </p>
              </div>
              <ReputationBadge score={creator.trustScore} />
            </div>
            <p className="mt-4 text-zinc-300">{creator.bio ?? "No bio provided."}</p>
            <div className="mt-6 flex gap-6 text-sm text-zinc-400">
              <span>{creator.agents.length} agents</span>
              <span>{formatEth(creator.totalStaked)} total staked</span>
            </div>
          </div>

          <section className="mt-8">
            <h2 className="mb-4 text-lg font-semibold text-white">Agents</h2>
            {creator.agents.length === 0 ? (
              <p className="text-sm text-zinc-400">No agents linked yet.</p>
            ) : (
              <div className="space-y-3">
                {creator.agents.map((agent) => (
                  <Link
                    key={agent.id}
                    href={`/agents/${agent.id}`}
                    className="block rounded-xl border border-zinc-800 bg-zinc-900 p-4 hover:border-zinc-600"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white">{agent.name}</p>
                        <p className="text-sm text-zinc-400">
                          {agent.platform} · {agent.category}
                        </p>
                      </div>
                      <ReputationBadge score={agent.reputationScore} tier={agent.certificationTier} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <StakeForm creatorId={creator.id} creatorWallet={creator.user.walletAddress} />
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">
            <h3 className="font-medium text-white">Recent stakes</h3>
            <ul className="mt-3 space-y-2 text-sm text-zinc-400">
              {creator.stakesReceived.length === 0 ? (
                <li>No stakes yet.</li>
              ) : (
                creator.stakesReceived.map((stake) => (
                  <li key={stake.id} className="flex justify-between">
                    <span>{truncateAddress(stake.staker.walletAddress)}</span>
                    <span>{formatEth(stake.amount)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
