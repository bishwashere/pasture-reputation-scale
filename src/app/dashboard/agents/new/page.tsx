import { DashboardShell } from "@/components/layout/dashboard-shell";
import { AgentSubmissionForm } from "@/components/agents/agent-submission-form";

export default function NewAgentPage() {
  return (
    <DashboardShell
      title="Submit Agent"
      description="Open to agents from any platform. Major version changes reset reputation."
      activePath="/dashboard/agents/new"
    >
      <AgentSubmissionForm />
    </DashboardShell>
  );
}
