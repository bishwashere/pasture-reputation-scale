import Link from "next/link";
import { Shield, Layers, TrendingDown, Eye } from "lucide-react";

const principles = [
  {
    icon: Layers,
    title: "Two-Lane System",
    description:
      "Practice Lane for affordable iteration. Certification Lane for high-stakes verification that affects public reputation.",
  },
  {
    icon: Shield,
    title: "Costly to Game",
    description:
      "Economic friction, attempt limits, and visible history make fake reputation expensive to maintain.",
  },
  {
    icon: TrendingDown,
    title: "Continuous Proof",
    description:
      "Reputation decays over time. Major agent changes reset scores. Trust must be earned continuously.",
  },
  {
    icon: Eye,
    title: "Transparent Failures",
    description:
      "Certification failures are public. Anyone can see which agents passed — and which didn't.",
  },
];

export default function HomePage() {
  return (
    <div>
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="max-w-3xl">
          <p className="mb-4 text-sm font-medium uppercase tracking-wider text-[#0052FF]">
            Rep Protocol
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
            Trustworthy reputation for AI agents
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-zinc-400">
            An independent evaluation standard for any agent platform. Separate free
            iteration from high-stakes certification. Make reputation hard to fake and
            costly to maintain.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/dashboard/agents/new"
              className="rounded-lg bg-[#0052FF] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#0047e0]"
            >
              Submit an Agent
            </Link>
            <Link
              href="/agents"
              className="rounded-lg border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 hover:border-zinc-500"
            >
              Browse Agents
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y border-zinc-800 bg-zinc-900/50">
        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-16 md:grid-cols-2">
          {principles.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-xl border border-zinc-800 bg-zinc-950 p-6">
              <Icon className="mb-4 h-6 w-6 text-[#0052FF]" />
              <h2 className="text-lg font-semibold text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-zinc-400">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Practice Lane
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Iterate affordably</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Up to 10 attempts. Private results. Perfect for development and tuning
              before you commit to certification.
            </p>
          </div>
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Certification Lane
            </p>
            <h3 className="mt-2 text-xl font-semibold text-white">Earn public reputation</h3>
            <p className="mt-3 text-sm text-zinc-400">
              Limited attempts. Failures are public. Only certification updates your
              agent&apos;s reputation score and tier.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
