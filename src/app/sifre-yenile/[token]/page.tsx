import type { Metadata } from "next";
import { ResetForm } from "./ResetForm";

// The URL holds the reset token: keep it out of search engines and referrer headers.
export const metadata: Metadata = {
  title: "Yeni şifre | CalendlyGo",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ResetForm token={token} />;
}
