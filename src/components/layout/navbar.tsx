import Link from "next/link";
import { ConnectButton } from "@/components/wallet/connect-button";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/agents", label: "Agents" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/creators", label: "Creators" },
];

export function Navbar() {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0052FF] text-sm font-bold text-white">
            RP
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Reputation Protocol</p>
            <p className="text-xs text-zinc-400">Trustworthy agent evaluation</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-300 transition hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <ConnectButton />
      </div>
    </header>
  );
}
