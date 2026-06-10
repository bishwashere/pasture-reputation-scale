import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function truncateAddress(address: string, chars = 4) {
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatScore(score: number) {
  return score.toFixed(1);
}

export function formatEth(wei: string) {
  const value = Number(BigInt(wei)) / 1e18;
  if (value === 0) return "0 ETH";
  if (value < 0.001) return "<0.001 ETH";
  return `${value.toFixed(4)} ETH`;
}
