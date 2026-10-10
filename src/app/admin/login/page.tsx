import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AdminLoginForm from "./AdminLoginForm";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  const role = user?.role?.toUpperCase();
  if (role === "SUPER_ADMIN" || role === "ADMIN" || role === "SUPERADMIN") {
    redirect("/admin");
  }

  return <AdminLoginForm />;
}
