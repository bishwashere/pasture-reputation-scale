import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentReputation } from "@/lib/services/agents";

export const dynamic = "force-dynamic";

export async function GET() {
  const agents = await prisma.agent.findMany({
    where: { status: "ACTIVE" },
    include: { creator: true },
    orderBy: [{ reputationScore: "desc" }, { performanceScore: "desc" }],
    take: 50,
  });

  const leaderboard = await Promise.all(
    agents.map(async (agent) => {
      const rep = await getAgentReputation(agent);
      return {
        id: agent.id,
        name: agent.name,
        platform: agent.platform,
        category: agent.category,
        bundleHash: agent.bundleHash,
        creator: agent.creator?.displayName ?? null,
        performanceScore: rep.performanceScore,
        confidenceScore: rep.confidenceScore,
        reputationScore: rep.publicScore,
        certificationTier: agent.certificationTier,
        lastCertifiedAt: agent.lastCertifiedAt,
      };
    }),
  );

  leaderboard.sort((a, b) => b.reputationScore - a.reputationScore);

  return NextResponse.json({ leaderboard });
}
