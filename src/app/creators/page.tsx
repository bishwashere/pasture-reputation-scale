import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEth } from "@/lib/utils";
import { ReputationBadge } from "@/components/reputation/badges";

export const dynamic = "force-dynamic";

export default async function CreatorsPage() {
  const creators = await prisma.creator.findMany({
    include: {
      user: true,
      _count: { select: { agents: true, stakesReceived: true } },
    },
    orderBy: { trustScore: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Creators</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Trust signals backed by on-chain stake and agent track records.
          </p>
        </div>
        <Link
          href="/creators/register"
          className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0047e0]"
        >
          Register as Creator
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {creators.map((creator) => (
          <Link
            key={creator.id}
            href={`/creators/${creator.id}`}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-600"
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-white">{creator.displayName}</h2>
                <p className="mt-1 text-sm text-zinc-400 line-clamp-2">
                  {creator.bio ?? "No bio yet"}
                </p>
              </div>
              <ReputationBadge score={creator.trustScore} />
            </div>
            <div className="mt-4 flex gap-4 text-xs text-zinc-500">
              <span>{creator._count.agents} agents</span>
              <span>{creator._count.stakesReceived} stakes</span>
              <span>{formatEth(creator.totalStaked)} staked</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
