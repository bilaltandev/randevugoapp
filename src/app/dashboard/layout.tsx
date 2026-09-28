import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.business) {
    redirect("/register");
  }

  const subscriptionStatus = user.business.subscription?.status || "trial";

  return (
    <DashboardShell
      business={user.business}
      user={user}
      subscriptionStatus={subscriptionStatus}
    >
      {children}
    </DashboardShell>
  );
}
