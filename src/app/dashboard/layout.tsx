import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardShell } from "@/components/DashboardShell";
import { subscriptionAccess } from "@/lib/subscriptionAccess";

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

  // Support agents have their own panel and no business of their own.
  if (role === "SUPPORT") {
    redirect("/support");
  }

  if (!user.business) {
    if (isAdmin) {
      redirect("/admin");
    }
    redirect("/register");
  }

  // Closed account: every page but the subscription and support pages shows the lock screen.
  const access = subscriptionAccess(user.business.subscription);
  const locked = !access.active;
  const subscriptionStatus = locked ? "expired" : access.kind === "paid" ? "active" : access.kind;

  return (
    <DashboardShell
      business={user.business}
      user={user}
      subscriptionStatus={subscriptionStatus}
      locked={locked}
    >
      {children}
    </DashboardShell>
  );
}
