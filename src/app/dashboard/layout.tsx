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

  const role = user.role?.toUpperCase();
  const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN" || role === "SUPERADMIN";

  if (!user.business) {
    if (isAdmin) {
      redirect("/admin");
    }
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
