import { redirect } from "next/navigation";
import { getSupportAgent } from "@/lib/support";
import { SupportShell } from "@/components/support/SupportShell";

export const dynamic = "force-dynamic";

export default async function SupportPanelLayout({ children }: { children: React.ReactNode }) {
  const agent = await getSupportAgent();
  if (!agent) {
    redirect("/support/login");
  }

  return <SupportShell agentName={agent.name}>{children}</SupportShell>;
}
