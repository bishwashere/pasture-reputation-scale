import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { agentBundleSchema } from "@/lib/validations";
import { upsertUserByWallet } from "@/lib/services/agents";
import { computeBundleHash, validateBundleInput } from "@/lib/bundle/hash";
import { buildVersionManifest } from "@/lib/bundle/manifest";
import { generateAgentDid } from "@/lib/crypto/identity";
import { encryptSecret } from "@/lib/crypto/secrets";
import { Prisma } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = agentBundleSchema.parse(body);
    const user = await upsertUserByWallet(data.walletAddress);

    const bundleInput = {
      name: data.name,
      version: data.version,
      codeRepoUrl: data.codeRepoUrl,
      modelEndpointUrl: data.modelEndpointUrl,
      endpointUrl: data.endpointUrl,
      capabilities: data.capabilities,
      tools: data.tools,
      config: data.config,
    };

    const validationErrors = validateBundleInput(bundleInput);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join("; ") }, { status: 400 });
    }

    const bundleHash = computeBundleHash(bundleInput);
    const versionHash = bundleHash.slice(0, 16);
    const versionManifest = buildVersionManifest({
      bundle: bundleInput,
      bundleHash,
      versionHash,
      domainTags: data.domainTags,
    });
    const creator = await prisma.creator.findUnique({ where: { userId: user.id } });
    const creatorDid = creator?.agentIdentityDid ?? `did:rep:anonymous:${user.id}`;
    const agentDid = generateAgentDid(creatorDid, bundleHash);

    const agent = await prisma.agent.create({
      data: {
        ownerId: user.id,
        creatorId: creator?.id,
        name: data.name,
        description: data.description,
        platform: data.platform,
        category: data.category,
        version: data.version,
        codeRepoUrl: data.codeRepoUrl || null,
        modelEndpointUrl: data.modelEndpointUrl || null,
        endpointUrl: data.endpointUrl || null,
        docsUrl: data.docsUrl || null,
        encryptedApiKey: data.apiKey ? encryptSecret(data.apiKey) : null,
        capabilities: data.capabilities,
        tools: data.tools,
        config: data.config as Prisma.InputJsonValue,
        bundleHash,
        versionHash,
        versionManifest: versionManifest as Prisma.InputJsonValue,
        agentDid,
        domainTags: data.domainTags,
        versions: {
          create: {
            version: data.version,
            bundleHash,
            versionHash,
            changelog: data.changelog,
            reputationReset: false,
          },
        },
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Agent submission failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get("wallet")?.toLowerCase();

  const agents = await prisma.agent.findMany({
    where: wallet ? { owner: { walletAddress: wallet } } : undefined,
    include: {
      owner: true,
      creator: true,
      evaluations: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { reputationScore: "desc" },
  });

  return NextResponse.json({ agents });
}
