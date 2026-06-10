import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stakeSchema } from "@/lib/validations";
import { upsertUserByWallet } from "@/lib/services/agents";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = stakeSchema.parse(body);
    const user = await upsertUserByWallet(data.walletAddress);

    const creator = await prisma.creator.findUnique({ where: { id: data.creatorId } });
    if (!creator) {
      return NextResponse.json({ error: "Creator not found" }, { status: 404 });
    }

    const stake = await prisma.stake.create({
      data: {
        stakerId: user.id,
        creatorId: creator.id,
        amount: data.amount,
        txHash: data.txHash,
      },
    });

    const totalStaked = (
      BigInt(creator.totalStaked) + BigInt(data.amount)
    ).toString();

    const uniqueStakers = await prisma.stake.groupBy({
      by: ["stakerId"],
      where: { creatorId: creator.id },
    });

    await prisma.creator.update({
      where: { id: creator.id },
      data: {
        totalStaked,
        trustScore: Math.min(100, uniqueStakers.length * 15 + Number(totalStaked) / 1e16),
      },
    });

    return NextResponse.json({ stake });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Stake failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
