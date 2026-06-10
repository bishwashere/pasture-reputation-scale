import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/agents", label: "My Agents" },
  { href: "/dashboard/agents/new", label: "Submit Agent" },
  { href: "/creators/register", label: "Creator Profile" },
];

export function DashboardShell({
  title,
  description,
  children,
  activePath,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  activePath?: string;
}) {
  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <aside className="space-y-2">
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Dashboard
        </p>
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm transition",
              activePath === link.href
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:bg-zinc-900 hover:text-white",
            )}
          >
            {link.label}
          </Link>
        ))}
      </aside>
      <section>
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-white">{title}</h1>
          {description ? <p className="mt-2 text-sm text-zinc-400">{description}</p> : null}
        </div>
        {children}
      </section>
    </div>
  );
}
