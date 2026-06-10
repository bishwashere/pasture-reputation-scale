import { z } from "zod";

export const agentBundleSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  name: z.string().min(2).max(80),
  description: z.string().min(20).max(2000),
  platform: z.string().min(2).max(60),
  category: z.string().min(2).max(60),
  version: z.string().min(1).max(20),
  codeRepoUrl: z.string().url().optional().or(z.literal("")),
  modelEndpointUrl: z.string().url().optional().or(z.literal("")),
  endpointUrl: z.string().url().optional().or(z.literal("")),
  docsUrl: z.string().url().optional().or(z.literal("")),
  apiKey: z.string().max(500).optional().or(z.literal("")),
  capabilities: z.array(z.string().min(1)).min(1).max(20),
  tools: z.array(z.string().min(1)).max(30).default([]),
  config: z.record(z.string(), z.unknown()).default({}),
  changelog: z.string().max(500).optional(),
});

export const creatorRegistrationSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  displayName: z.string().min(2).max(60),
  bio: z.string().max(500).optional(),
  txHash: z.string().optional(),
});

export const stakeSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  creatorId: z.string().min(1),
  amount: z.string().min(1),
  txHash: z.string().min(1),
});

export const evaluationRequestSchema = z.object({
  agentId: z.string().min(1),
  lane: z.enum(["PRACTICE", "CERTIFICATION"]),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  commitmentAccepted: z.boolean().optional(),
  paymentTxHash: z.string().optional(),
});

export type AgentBundleInput = z.infer<typeof agentBundleSchema>;
