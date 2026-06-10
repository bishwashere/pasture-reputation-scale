import { createHash } from "crypto";

export type BundleInput = {
  name: string;
  version: string;
  codeRepoUrl?: string | null;
  modelEndpointUrl?: string | null;
  endpointUrl?: string | null;
  capabilities: unknown;
  tools: unknown;
  config: unknown;
};

export function computeBundleHash(input: BundleInput) {
  const canonical = JSON.stringify({
    name: input.name.trim(),
    version: input.version.trim(),
    codeRepoUrl: input.codeRepoUrl?.trim() ?? "",
    modelEndpointUrl: input.modelEndpointUrl?.trim() ?? "",
    endpointUrl: input.endpointUrl?.trim() ?? "",
    capabilities: input.capabilities,
    tools: input.tools,
    config: input.config,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

export function validateBundleInput(input: BundleInput) {
  const errors: string[] = [];
  if (!input.name.trim()) errors.push("Name is required");
  if (!input.version.trim()) errors.push("Version is required");
  const hasEndpoint = Boolean(input.modelEndpointUrl?.trim() || input.endpointUrl?.trim());
  if (!hasEndpoint) errors.push("Model endpoint or agent endpoint is required");
  return errors;
}

export function bundleChanged(existingHash: string, input: BundleInput) {
  return existingHash !== computeBundleHash(input);
}
