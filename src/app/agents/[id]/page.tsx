import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAgentReputation } from "@/lib/services/agents";
import { getPublicCertificationHistory } from "@/lib/lanes/limits";
import { REPUTATION_DECAY_HALF_LIFE_DAYS } from "@/lib/reputation/constants";
import { ReputationBadge, StatusPill } from "@/components/reputation/badges";
import { CertificationHistory, EvaluationResults } from "@/components/agents/evaluation-results";
import { RunEvaluationButton } from "@/components/agents/run-evaluation-button";
import { formatScore } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const agent = await prisma.agent.findUnique({
    where: { id },
    include: {
      owner: true,
      creator: true,
      versions: { orderBy: { createdAt: "desc" } },
      evaluations: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!agent) notFound();

  const reputation = await getAgentReputation(agent);
  const certHistory = await getPublicCertificationHistory(agent.id);

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">{agent.name}</h1>
              <StatusPill status={agent.status} />
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {agent.platform} · {agent.category} · v{agent.version}
            </p>
            <p className="mt-1 font-mono text-xs text-zinc-600">did:{agent.agentDid.replace(/^did:/, "")}</p>
            <p className="font-mono text-xs text-zinc-600">bundle:{agent.bundleHash.slice(0, 12)}…</p>
          </div>
          <ReputationBadge score={reputation.publicScore} tier={agent.certificationTier} decayed={reputation.publicScore < agent.reputationScore} />
        </div>

        <p className="mt-6 text-zinc-300">{agent.description}</p>

        <div className="mt-6 grid gap-4 md:grid-cols-3 lg:grid-cols-6">
          {[
            ["Performance", reputation.performanceScore],
            ["Consistency", reputation.consistencyScore],
            ["Confidence", reputation.confidenceScore],
            ["Public reputation", reputation.publicScore],
            ["Decay half-life", REPUTATION_DECAY_HALF_LIFE_DAYS],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg bg-zinc-950 p-4">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="text-xl font-semibold text-white">
                {typeof value === "number" && label !== "Decay half-life"
                  ? formatScore(value)
                  : value}
                {label === "Decay half-life" ? "d" : ""}
              </p>
            </div>
          ))}
        </div>

        {Object.keys(reputation.domainScores).length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(reputation.domainScores).map(([domain, score]) => (
              <span key={domain} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-300">
                {domain}: {formatScore(score)}
              </span>
            ))}
          </div>
        ) : null}

        <p className="mt-4 text-xs text-zinc-500">
          Portable reputation:{" "}
          <a href={`/api/agents/${agent.id}/reputation`} className="text-[#0052FF] hover:underline">
            /api/agents/{agent.id}/reputation
          </a>
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Run Evaluation</h2>
          <RunEvaluationButton agentId={agent.id} />
        </section>
        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Public Certification History</h2>
          <CertificationHistory records={certHistory} />
        </section>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold text-white">Evaluation Results</h2>
        <EvaluationResults evaluations={agent.evaluations} />
      </section>
    </div>
  );
}
