import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAgentReputation } from "@/lib/services/agents";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({ where: { id } });
  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  const reputation = await getAgentReputation(agent);

  return NextResponse.json({
    schema: "reputation-protocol/export/v1",
    agentDid: agent.agentDid,
    reputation: reputation.portable.payload,
    signature: reputation.portable.signature,
    certHash: reputation.portable.certHash,
    domainTags: reputation.domainTags,
    domainScores: reputation.domainScores,
  });
}
