import type { DomainTag } from "@/lib/reputation/domains";
import { signPayload } from "@/lib/crypto/signing";

export type BehaviorSummary = {
  schema: "reputation-protocol/behavior/v1";
  evaluationId: string;
  agentDid: string;
  domainTags: DomainTag[];
  logCount: number;
  auditHash: string;
  runHash: string;
  issuedAt: string;
};

export function buildSignedBehaviorSummary(input: {
  evaluationId: string;
  agentDid: string;
  domainTags: DomainTag[];
  logCount: number;
  auditHash: string;
  runHash: string;
}) {
  const summary: BehaviorSummary = {
    schema: "reputation-protocol/behavior/v1",
    evaluationId: input.evaluationId,
    agentDid: input.agentDid,
    domainTags: input.domainTags,
    logCount: input.logCount,
    auditHash: input.auditHash,
    runHash: input.runHash,
    issuedAt: new Date().toISOString(),
  };

  return { summary, signature: signPayload(summary) };
}
