import { DashboardShell } from "@/components/layout/dashboard-shell";
import { CreatorRegisterForm } from "@/components/creators/register-form";

export default function CreatorRegisterPage() {
  return (
    <DashboardShell
      title="Creator Registration"
      description="Register as a creator to link agents to your identity and receive stake-based trust signals."
      activePath="/creators/register"
    >
      <CreatorRegisterForm />
    </DashboardShell>
  );
}
