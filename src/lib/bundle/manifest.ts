import { createHash } from "crypto";
import type { BundleInput } from "@/lib/bundle/hash";
import type { DomainTag } from "@/lib/reputation/domains";

export type VersionManifest = {
  version: string;
  bundleHash: string;
  versionHash: string;
  domainTags: DomainTag[];
  capabilities: unknown;
  tools: unknown;
  createdAt: string;
};

export function buildVersionManifest(input: {
  bundle: BundleInput;
  bundleHash: string;
  versionHash: string;
  domainTags: DomainTag[];
}): VersionManifest {
  return {
    version: input.bundle.version.trim(),
    bundleHash: input.bundleHash,
    versionHash: input.versionHash,
    domainTags: input.domainTags,
    capabilities: input.bundle.capabilities,
    tools: input.bundle.tools,
    createdAt: new Date().toISOString(),
  };
}

export function manifestContentHash(manifest: VersionManifest): string {
  return createHash("sha256").update(JSON.stringify(manifest)).digest("hex");
}
