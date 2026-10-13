import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { findOpenInvite } from "@/lib/teamInvites";
import { InviteForm } from "./InviteForm";

export const metadata: Metadata = {
  title: "Ekip daveti",
  robots: { index: false, follow: false },
};

// Team invite link (TEAM plan): the invitee creates their member account here, then signs in to the mobile app.
export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invite = await findOpenInvite(token);

  if (!invite) {
    return (
      <AuthShell
        title="Davet geçersiz"
        description="Bu davet bağlantısı kullanılmış, iptal edilmiş veya süresi dolmuş. İşletme sahibinden yeni bir bağlantı isteyin."
        footer={
          <Link href="/" className="font-medium text-brand hover:text-brand-hover">
            Ana sayfaya dön
          </Link>
        }
      >
        {null}
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={<span className="text-xs font-medium text-brand-ink">Ekip daveti</span>}
      title={`${invite.business.name} ekibine katılın`}
      description={
        <>
          {invite.employee ? (
            <>
              <strong className="font-medium text-ink">{invite.employee.name}</strong> adına alınan randevular hesabınıza düşecek.{" "}
            </>
          ) : (
            "Size alınan randevular hesabınıza düşecek. "
          )}
          Hesabınızı oluşturduktan sonra mobil uygulamaya bu e-posta ve şifreyle giriş yapın.
        </>
      }
    >
      <InviteForm token={token} defaultName={invite.employee?.name ?? ""} />
    </AuthShell>
  );
}
