import { BehaviorActionType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { hashPayload } from "@/lib/crypto/secrets";

export type BehaviorEntry = {
  actionType: BehaviorActionType;
  payload: Record<string, unknown>;
  costUsd?: number;
};

export class BehaviorLogger {
  private sequence = 0;
  private entries: BehaviorEntry[] = [];

  log(entry: BehaviorEntry) {
    this.sequence += 1;
    this.entries.push(entry);
    return this.sequence;
  }

  getEntries() {
    return this.entries;
  }

  async persist(evaluationId: string) {
    if (this.entries.length === 0) return { logCount: 0, auditHash: "", runHash: "" };

    await prisma.behaviorLog.createMany({
      data: this.entries.map((entry, index) => ({
        evaluationId,
        sequence: index + 1,
        actionType: entry.actionType,
        payload: entry.payload as Prisma.InputJsonValue,
        costUsd: entry.costUsd,
      })),
    });

    const auditHash = hashPayload(this.entries);
    const runHash = hashPayload({ evaluationId, auditHash, logCount: this.entries.length });

    await prisma.behaviorAudit.create({
      data: {
        evaluationId,
        runHash,
        auditHash,
        logCount: this.entries.length,
      },
    });

    return { logCount: this.entries.length, auditHash, runHash };
  }
}
