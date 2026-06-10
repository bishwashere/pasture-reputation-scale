"use client";

import { useState } from "react";
import { useAccount } from "wagmi";
import { useRouter } from "next/navigation";

const PLATFORMS = ["Pasture", "OpenAI", "Anthropic", "Custom", "Other"];

export function AgentSubmissionForm() {
  const { address } = useAccount();
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    platform: "Custom",
    category: "",
    version: "1.0.0",
    codeRepoUrl: "",
    modelEndpointUrl: "",
    endpointUrl: "",
    docsUrl: "",
    apiKey: "",
    capabilities: "",
    tools: "",
    config: "{}",
    changelog: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!address) {
      setStatus("Connect your wallet first.");
      return;
    }
    setLoading(true);
    setStatus(null);

    let config: Record<string, unknown> = {};
    try {
      config = JSON.parse(form.config || "{}");
    } catch {
      setStatus("Config must be valid JSON.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          walletAddress: address,
          name: form.name,
          description: form.description,
          platform: form.platform,
          category: form.category,
          version: form.version,
          codeRepoUrl: form.codeRepoUrl,
          modelEndpointUrl: form.modelEndpointUrl,
          endpointUrl: form.endpointUrl,
          docsUrl: form.docsUrl,
          apiKey: form.apiKey,
          capabilities: form.capabilities.split(",").map((c) => c.trim()).filter(Boolean),
          tools: form.tools.split(",").map((t) => t.trim()).filter(Boolean),
          config,
          changelog: form.changelog,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Submission failed");

      router.push(`/agents/${data.agent.id}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Identity</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Agent name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Version</label>
            <input required value={form.version} onChange={(e) => update("version", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Description</label>
          <textarea required rows={3} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Platform</label>
            <select value={form.platform} onChange={(e) => update("platform", e.target.value)} className={inputClass}>
              {PLATFORMS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Category</label>
            <input required value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Bundle</h2>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Code repository URL</label>
          <input value={form.codeRepoUrl} onChange={(e) => update("codeRepoUrl", e.target.value)} className={inputClass} placeholder="https://github.com/..." />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Model endpoint URL</label>
            <input value={form.modelEndpointUrl} onChange={(e) => update("modelEndpointUrl", e.target.value)} className={inputClass} placeholder="https://api..." />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Agent endpoint URL (fallback)</label>
            <input value={form.endpointUrl} onChange={(e) => update("endpointUrl", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">API key</label>
          <input type="password" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} className={inputClass} placeholder="Encrypted at rest — never stored in plain text" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Tools (comma-separated)</label>
            <input value={form.tools} onChange={(e) => update("tools", e.target.value)} className={inputClass} placeholder="web_search, code_exec, file_read" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-zinc-300">Capabilities (comma-separated)</label>
            <input required value={form.capabilities} onChange={(e) => update("capabilities", e.target.value)} className={inputClass} />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Config (JSON)</label>
          <textarea value={form.config} onChange={(e) => update("config", e.target.value)} rows={3} className={`${inputClass} font-mono text-xs`} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Documentation URL</label>
          <input value={form.docsUrl} onChange={(e) => update("docsUrl", e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-zinc-300">Changelog</label>
          <input value={form.changelog} onChange={(e) => update("changelog", e.target.value)} className={inputClass} />
        </div>
      </section>

      <p className="text-xs text-amber-400/90">
        Bundle hash is computed from repo, endpoints, tools, and config. Material changes reset reputation.
      </p>

      <button type="submit" disabled={loading} className="rounded-lg bg-[#0052FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0047e0] disabled:opacity-50">
        {loading ? "Submitting bundle…" : "Submit Agent Bundle"}
      </button>
      {status ? <p className="text-sm text-rose-400">{status}</p> : null}
    </form>
  );
}
