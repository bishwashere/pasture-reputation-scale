import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creatorRegistrationSchema } from "@/lib/validations";
import { upsertUserByWallet } from "@/lib/services/agents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = creatorRegistrationSchema.parse(body);
    const user = await upsertUserByWallet(data.walletAddress);

    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: data.displayName,
        bio: data.bio,
        registrationTxHash: data.txHash,
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        registrationTxHash: data.txHash ?? undefined,
      },
    });

    return NextResponse.json({ creator });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const creators = await prisma.creator.findMany({
    include: {
      user: true,
      _count: { select: { agents: true, stakesReceived: true } },
    },
    orderBy: { trustScore: "desc" },
  });
  return NextResponse.json({ creators });
}
