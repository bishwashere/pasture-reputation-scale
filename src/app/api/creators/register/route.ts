import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { creatorRegistrationSchema } from "@/lib/validations";
import { upsertUserByWallet } from "@/lib/services/agents";
import { generateAgentIdentityKeypair } from "@/lib/crypto/identity";
import { encryptSecret } from "@/lib/crypto/secrets";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = creatorRegistrationSchema.parse(body);
    const user = await upsertUserByWallet(data.walletAddress);

    const existing = await prisma.creator.findUnique({ where: { userId: user.id } });
    const needsIdentity = !existing?.agentIdentityDid;
    const identity = needsIdentity ? generateAgentIdentityKeypair() : null;

    const creator = await prisma.creator.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        displayName: data.displayName,
        bio: data.bio,
        registrationTxHash: data.txHash,
        agentIdentityDid: identity!.did,
        agentIdentityPublicKey: identity!.publicKeyPem,
        encryptedIdentityKey: encryptSecret(identity!.privateKeyPem),
      },
      update: {
        displayName: data.displayName,
        bio: data.bio,
        registrationTxHash: data.txHash ?? undefined,
        ...(needsIdentity && identity
          ? {
              agentIdentityDid: identity.did,
              agentIdentityPublicKey: identity.publicKeyPem,
              encryptedIdentityKey: encryptSecret(identity.privateKeyPem),
            }
          : {}),
      },
    });

    return NextResponse.json({
      creator: {
        ...creator,
        encryptedIdentityKey: undefined,
      },
    });
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
