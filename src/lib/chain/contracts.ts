import { baseSepolia } from "viem/chains";

export const SUPPORTED_CHAIN = baseSepolia;

export const CREATOR_REGISTRY_ADDRESS = process.env
  .NEXT_PUBLIC_CREATOR_REGISTRY_ADDRESS as `0x${string}` | undefined;

export const STAKE_MANAGER_ADDRESS = process.env
  .NEXT_PUBLIC_STAKE_MANAGER_ADDRESS as `0x${string}` | undefined;

export const isChainConfigured =
  Boolean(CREATOR_REGISTRY_ADDRESS) && Boolean(STAKE_MANAGER_ADDRESS);

export const creatorRegistryAbi = [
  {
    type: "function",
    name: "registerCreator",
    inputs: [
      { name: "name", type: "string" },
      { name: "bio", type: "string" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "isRegistered",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "CreatorRegistered",
    inputs: [
      { name: "creator", type: "address", indexed: true },
      { name: "name", type: "string", indexed: false },
    ],
  },
] as const;

export const stakeManagerAbi = [
  {
    type: "function",
    name: "stake",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "getTotalStaked",
    inputs: [{ name: "creator", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "Staked",
    inputs: [
      { name: "staker", type: "address", indexed: true },
      { name: "creator", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
] as const;
