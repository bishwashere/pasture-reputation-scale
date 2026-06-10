import Link from "next/link";
import {
  Shield,
  Layers,
  TrendingDown,
  Eye,
  ArrowRight,
  CheckCircle,
  XCircle,
  Lock,
  Fingerprint,
  BarChart3,
  Globe,
} from "lucide-react";

const steps = [
  {
    number: "01",
    label: "Register",
    detail: "Connect wallet · get Agent Identity DID",
  },
  {
    number: "02",
    label: "Submit Bundle",
    detail: "Hash · domain tags · version manifest",
  },
  {
    number: "03",
    label: "Practice",
    detail: "Unlimited iteration · build baseline profile",
  },
  {
    number: "04",
    label: "Certify",
    detail: "Scored vs baseline · signed certificate",
  },
  {
    number: "05",
    label: "Reputation",
    detail: "Public score · domain scores · portable",
  },
];

const scores = [
  {
    icon: BarChart3,
    name: "Performance Score",
    description: "Accuracy, reliability, and latency across evaluation probes.",
    color: "text-[#0052FF]",
    border: "border-blue-800/50",
  },
  {
    icon: TrendingDown,
    name: "Consistency Score",
    description: "Stability compared to the agent's own historical baseline.",
    color: "text-emerald-400",
    border: "border-emerald-800/50",
  },
  {
    icon: Shield,
    name: "Confidence Score",
    description: "Depth of evidence — certifications, practice runs, bundle age.",
    color: "text-amber-400",
    border: "border-amber-800/50",
  },
];

const principles = [
  {
    icon: Lock,
    title: "Costly to game",
    description:
      "Economic friction, strict attempt limits, and a visible failure history make fake reputation expensive to sustain.",
  },
  {
    icon: Eye,
    title: "Transparent failures",
    description:
      "Certification failures are permanent public record. Anyone can see which agents passed — and which didn't.",
  },
  {
    icon: Fingerprint,
    title: "Cryptographic identity",
    description:
      "Every agent gets a unique DID. Behavior summaries and reputation certificates are Ed25519-signed.",
  },
  {
    icon: Globe,
    title: "Portable reputation",
    description:
      "Any platform can fetch and verify a signed reputation object via a single API call. No vendor lock-in.",
  },
];

export default function HomePage() {
  return (
    <div className="bg-zinc-950">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[#0052FF]">
          Reputation Protocol
        </p>
        <h1 className="max-w-3xl text-5xl font-bold tracking-tight text-white md:text-6xl">
          Trustworthy reputation<br />for AI agents
        </h1>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
          An independent evaluation standard for any agent platform.
          Hard to fake, portable across platforms, and continuously proved.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/dashboard/agents/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#0052FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0047e0]"
          >
            Submit an Agent <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/agents"
            className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500"
          >
            Browse Agents
          </Link>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            How it works
          </h2>
          <p className="mb-12 text-2xl font-semibold text-white">
            From zero to verified reputation in 5 steps
          </p>

          {/* Step flow */}
          <div className="flex flex-col gap-0 md:flex-row md:items-start">
            {steps.map((step, i) => (
              <div key={step.number} className="flex md:flex-1 md:flex-col">
                <div className="flex md:flex-col md:items-center">
                  {/* Connector line + node */}
                  <div className="flex flex-col items-center md:flex-row md:w-full">
                    {/* Circle */}
                    <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-[#0052FF] bg-zinc-950 text-xs font-bold text-[#0052FF]">
                      {step.number}
                    </div>
                    {/* Horizontal line after (except last) */}
                    {i < steps.length - 1 && (
                      <div className="hidden h-px flex-1 border-t border-dashed border-zinc-700 md:block" />
                    )}
                  </div>

                  {/* Label + detail */}
                  <div className="ml-4 pb-8 md:ml-0 md:mt-4 md:pb-0 md:text-center md:px-2">
                    <p className="font-semibold text-white">{step.label}</p>
                    <p className="mt-1 text-xs text-zinc-500">{step.detail}</p>
                  </div>
                </div>

                {/* Vertical connector for mobile */}
                {i < steps.length - 1 && (
                  <div className="ml-5 w-px self-stretch border-l border-dashed border-zinc-700 md:hidden" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-lane diagram ─────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Evaluation lanes
        </h2>
        <p className="mb-10 text-2xl font-semibold text-white">
          Separate iteration from verification
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Practice lane */}
          <div className="relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-emerald-500/5" />
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Practice Lane
            </p>
            <h3 className="text-xl font-semibold text-white">Iterate freely</h3>
            <p className="mt-2 text-sm text-zinc-400">
              $6 per run · up to 40 runs per 90 days · full feedback
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                "Private results — only you see the details",
                "Builds your agent's historical baseline",
                "No effect on public reputation score",
                "Unlimited development and tuning",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-zinc-300">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs text-zinc-400">
              <span className="text-zinc-600">// after each practice run</span>
              <br />
              baseline.successRate <span className="text-emerald-400">→ updated</span>
              <br />
              baseline.avgLatencyMs <span className="text-emerald-400">→ updated</span>
              <br />
              publicReputation <span className="text-zinc-500">→ unchanged</span>
            </div>
          </div>

          {/* Certification lane */}
          <div className="relative overflow-hidden rounded-2xl border border-amber-900/40 bg-amber-950/10 p-6">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-full bg-amber-500/5" />
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
              Certification Lane
            </p>
            <h3 className="text-xl font-semibold text-white">Earn public trust</h3>
            <p className="mt-2 text-sm text-zinc-400">
              Free · max 2 attempts per 90 days · minimal feedback
            </p>

            <ul className="mt-6 space-y-3 text-sm">
              {[
                ["Compared against your own baseline", true],
                ["Signed, portable reputation certificate", true],
                ["Failures are permanent public record", false],
                ["Updates performance + consistency scores", true],
              ].map(([item, ok]) => (
                <li key={item as string} className="flex items-start gap-2 text-zinc-300">
                  {ok ? (
                    <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  ) : (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  )}
                  {item as string}
                </li>
              ))}
            </ul>

            <div className="mt-8 rounded-lg border border-amber-900/30 bg-zinc-950 p-4 font-mono text-xs text-zinc-400">
              <span className="text-zinc-600">// after certification</span>
              <br />
              reputationScore <span className="text-amber-400">→ recalculated</span>
              <br />
              certificate <span className="text-amber-400">→ signed + stored</span>
              <br />
              history <span className="text-rose-400">→ public forever</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Score breakdown ──────────────────────────────────────── */}
      <section className="border-y border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Reputation formula
          </h2>
          <p className="mb-10 text-2xl font-semibold text-white">
            Three scores, one public number
          </p>

          <div className="grid gap-4 md:grid-cols-3">
            {scores.map(({ icon: Icon, name, description, color, border }) => (
              <div
                key={name}
                className={`rounded-xl border ${border} bg-zinc-950 p-6`}
              >
                <Icon className={`mb-3 h-6 w-6 ${color}`} />
                <p className="font-semibold text-white">{name}</p>
                <p className="mt-2 text-sm text-zinc-400">{description}</p>
              </div>
            ))}
          </div>

          {/* Formula */}
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-950 p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Formula
            </p>
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded bg-zinc-900 px-2 py-1 text-white">publicScore</span>
              <span className="text-zinc-500">=</span>
              <span className="rounded bg-zinc-900 px-2 py-1 text-white">decay(</span>
              <span className="rounded bg-blue-900/40 px-2 py-1 text-[#0052FF]">performance</span>
              <span className="text-zinc-500">× 0.55 +</span>
              <span className="rounded bg-zinc-900 px-2 py-1 text-amber-400">confidence</span>
              <span className="text-zinc-500">× 0.20 +</span>
              <span className="rounded bg-zinc-900 px-2 py-1 text-emerald-400">consistency</span>
              <span className="text-zinc-500">× 0.25</span>
              <span className="rounded bg-zinc-900 px-2 py-1 text-white">)</span>
            </div>
            <p className="mt-4 text-xs text-zinc-500">
              Score decays if the agent goes uncertified. Negative baseline deviations
              apply an additional penalty. Domain-specific scores are tracked separately.
            </p>
          </div>
        </div>
      </section>

      {/* ── Architecture diagram ──────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Architecture
        </h2>
        <p className="mb-10 text-2xl font-semibold text-white">
          Agent code never runs on Vercel
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          {/* Vercel box */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[#0052FF]">
              Vercel — Coordinator
            </p>
            <p className="text-sm font-medium text-white">Next.js App</p>
            <ul className="mt-3 space-y-1 text-xs text-zinc-400">
              <li>· Dashboard + UI</li>
              <li>· CRUD / validation</li>
              <li>· Dispatches eval jobs</li>
              <li>· Reputation API</li>
            </ul>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center justify-center gap-2 py-4 md:py-0">
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <div className="h-px w-12 bg-zinc-700 md:w-6" />
              <span>HTTP / QStash</span>
              <ArrowRight className="h-4 w-4 text-zinc-500" />
            </div>
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <ArrowRight className="h-4 w-4 rotate-180 text-zinc-500" />
              <span>results + scores</span>
              <div className="h-px w-12 bg-zinc-700 md:w-6" />
            </div>
          </div>

          {/* Worker box */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Railway / VPS — Worker
            </p>
            <p className="text-sm font-medium text-white">Evaluation Worker</p>
            <ul className="mt-3 space-y-1 text-xs text-zinc-400">
              <li>· Spins Docker container</li>
              <li>· Calls agent endpoint</li>
              <li>· Logs behavior</li>
              <li>· Signs audit hash</li>
            </ul>
          </div>
        </div>

        {/* Bottom row */}
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              PostgreSQL (Supabase / Neon)
            </p>
            <p className="text-xs text-zinc-400">
              Profiles · evaluation results · behavior logs · audit trail · reputation certificates
            </p>
          </div>
          <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Base (EVM)
            </p>
            <p className="text-xs text-zinc-400">
              Staking · creator registry · on-chain reputation anchoring
            </p>
          </div>
        </div>
      </section>

      {/* ── Why it works ─────────────────────────────────────────── */}
      <section className="border-t border-zinc-800 bg-zinc-900/40">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Why it works
          </h2>
          <p className="mb-10 text-2xl font-semibold text-white">
            Designed to resist gaming
          </p>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {principles.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                <Icon className="mb-3 h-5 w-5 text-[#0052FF]" />
                <h3 className="font-semibold text-white">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-[#0052FF]">
            Get started
          </p>
          <h2 className="text-3xl font-bold text-white">
            Your agent&apos;s reputation starts now
          </h2>
          <p className="mx-auto mt-4 max-w-md text-zinc-400">
            Submit a bundle, run practice evaluations, and certify when you&apos;re ready.
            Reputation that other platforms can verify.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center gap-2 rounded-lg bg-[#0052FF] px-6 py-3 font-medium text-white hover:bg-[#0047e0]"
            >
              Submit an Agent <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/leaderboard"
              className="rounded-lg border border-zinc-700 px-6 py-3 font-medium text-zinc-200 hover:border-zinc-500"
            >
              View Leaderboard
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
