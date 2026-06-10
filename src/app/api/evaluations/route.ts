import { NextResponse } from "next/server";
import { evaluationRequestSchema } from "@/lib/validations";
import { createEvaluation, upsertUserByWallet } from "@/lib/services/agents";
import { dispatchEvaluationJob } from "@/lib/worker/client";
import { EvaluationLane } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = evaluationRequestSchema.parse(body);
    const user = await upsertUserByWallet(data.walletAddress);

    const evaluation = await createEvaluation({
      agentId: data.agentId,
      lane: data.lane as EvaluationLane,
      ownerId: user.id,
      commitmentAccepted: data.commitmentAccepted,
      paymentTxHash: data.paymentTxHash ?? `mock-pay-${Date.now()}`,
    });

    const dispatch = await dispatchEvaluationJob(evaluation.id);

    return NextResponse.json({
      evaluationId: evaluation.id,
      status: dispatch.mode === "inline" ? dispatch.status : "QUEUED",
      costCents: evaluation.costCents,
      dispatch,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Evaluation request failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
