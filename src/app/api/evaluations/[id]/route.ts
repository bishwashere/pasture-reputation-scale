import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { abandonEvaluation, upsertUserByWallet } from "@/lib/services/agents";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const walletAddress = body.walletAddress as string;
    if (!walletAddress) {
      return NextResponse.json({ error: "walletAddress required" }, { status: 400 });
    }
    const user = await upsertUserByWallet(walletAddress);
    const evaluation = await abandonEvaluation(id, user.id);
    return NextResponse.json({ evaluation });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Abandon failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const audit = await prisma.behaviorAudit.findUnique({
    where: { evaluationId: id },
    include: {
      evaluation: {
        select: {
          runHash: true,
          auditHash: true,
          lane: true,
          status: true,
        },
      },
    },
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit not found" }, { status: 404 });
  }

  const logs = await prisma.behaviorLog.findMany({
    where: { evaluationId: id },
    orderBy: { sequence: "asc" },
  });

  return NextResponse.json({ audit, logs });
}
