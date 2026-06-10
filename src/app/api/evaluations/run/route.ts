import { NextResponse } from "next/server";

/**
 * Evaluations are processed by the Evaluation Worker service, not Vercel.
 * This route is kept for backwards compatibility — returns 410 with redirect info.
 */
export async function POST() {
  return NextResponse.json(
    {
      error: "Evaluations run on the Evaluation Worker, not Vercel.",
      workerEndpoint: "/jobs/run on EVALUATION_WORKER_URL",
    },
    { status: 410 },
  );
}
