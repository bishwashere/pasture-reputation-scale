"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import {
  CREATOR_REGISTRY_ADDRESS,
  creatorRegistryAbi,
  isChainConfigured,
} from "@/lib/chain/contracts";

export function CreatorRegisterForm() {
  const { address } = useAccount();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      let registrationTxHash: string | undefined;

      if (isChainConfigured && CREATOR_REGISTRY_ADDRESS) {
        registrationTxHash = await writeContractAsync({
          address: CREATOR_REGISTRY_ADDRESS,
          abi: creatorRegistryAbi,
          functionName: "registerCreator",
          args: [displayName, bio || ""],
        });
      }

      const response = await fetch("/api/creators/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          displayName,
          bio,
          txHash: registrationTxHash,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Registration failed");
      }

      setStatus(
        isChainConfigured
          ? "Creator registered. Waiting for on-chain confirmation…"
          : "Creator registered (mock mode — no contract configured).",
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Display name</label>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="Your creator name"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-zinc-300">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
          placeholder="What kind of agents do you build?"
        />
      </div>
      {!isChainConfigured ? (
        <p className="text-xs text-zinc-500">
          Mock mode: contracts not configured. Registration is stored off-chain.
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0047e0] disabled:opacity-50"
      >
        {loading ? "Registering…" : "Register as Creator"}
      </button>
      {txConfirmed ? (
        <p className="text-sm text-emerald-400">On-chain registration confirmed.</p>
      ) : null}
      {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
    </form>
  );
}
