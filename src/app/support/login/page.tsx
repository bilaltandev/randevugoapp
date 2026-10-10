import { redirect } from "next/navigation";
import { getSupportAgent } from "@/lib/support";
import SupportLoginForm from "./SupportLoginForm";

export const dynamic = "force-dynamic";

export default async function SupportLoginPage() {
  if (await getSupportAgent()) {
    redirect("/support");
  }

  return <SupportLoginForm />;
}
