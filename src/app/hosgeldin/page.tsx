import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { IntroSlides } from "@/components/onboarding/IntroSlides";

export const metadata: Metadata = {
  title: "Hoş geldiniz | CalendlyGo",
};

/** After sign-up: the intro slides, then the plan cards. Only for signed-in business owners. */
export default async function WelcomePage() {
  const user = await getCurrentUser();
  if (!user || !user.business) redirect("/login");
  return <IntroSlides next="/dashboard/subscription?hosgeldin=1" />;
}
