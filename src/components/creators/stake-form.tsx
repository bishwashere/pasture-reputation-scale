"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import {
  STAKE_MANAGER_ADDRESS,
  stakeManagerAbi,
  isChainConfigured,
} from "@/lib/chain/contracts";

export function StakeForm({
  creatorId,
  creatorWallet,
}: {
  creatorId: string;
  creatorWallet: string;
}) {
  const { address } = useAccount();
  const [amount, setAmount] = useState("0.001");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { writeContractAsync, data: txHash } = useWriteContract();
  const { isSuccess: txConfirmed } = useWaitForTransactionReceipt({ hash: txHash });

  async function handleStake(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    setLoading(true);
    setStatus(null);

    try {
      let stakeTxHash: string;

      if (isChainConfigured && STAKE_MANAGER_ADDRESS) {
        stakeTxHash = await writeContractAsync({
          address: STAKE_MANAGER_ADDRESS,
          abi: stakeManagerAbi,
          functionName: "stake",
          args: [creatorWallet as `0x${string}`],
          value: parseEther(amount),
        });
      } else {
        stakeTxHash = `mock-${Date.now()}`;
      }

      const response = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          creatorId,
          amount: parseEther(amount).toString(),
          txHash: stakeTxHash,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Stake failed");
      }

      setStatus("Stake recorded. Trust signal updated.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Stake failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleStake} className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900 p-5">
      <h3 className="font-medium text-white">Stake on this creator</h3>
      <p className="text-xs text-zinc-400">
        Economic stake creates costly-to-fake trust signals for creators.
      </p>
      <input
        type="number"
        step="0.001"
        min="0.001"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0047e0] disabled:opacity-50"
      >
        {loading ? "Staking…" : "Stake ETH"}
      </button>
      {txConfirmed ? <p className="text-sm text-emerald-400">On-chain stake confirmed.</p> : null}
      {status ? <p className="text-sm text-zinc-400">{status}</p> : null}
    </form>
  );
}
