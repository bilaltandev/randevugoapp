import { NextResponse } from "next/server";
import { findOpenInvite } from "@/lib/teamInvites";
import { NO_STORE, inviteRateLimited, joinTeamResponse } from "../../shared";

// Public (the invite link itself is the credential):
//   GET  → who invites whom, for the accept page
//   POST { name, email, password, phone? } → creates the member account; they then sign in to the mobile app

const INVALID = { error: "Bu davet geçersiz, kullanılmış veya süresi dolmuş.", code: "INVITE_INVALID" };

export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const blocked = await inviteRateLimited(req);
    if (blocked) return blocked;
    const { token } = await params;
    const invite = await findOpenInvite(token);
    if (!invite) return NextResponse.json(INVALID, { status: 410, headers: NO_STORE });
    return NextResponse.json(
      {
        businessName: invite.business.name,
        businessLogo: invite.business.logo,
        employeeName: invite.employee?.name ?? null,
        expiresAt: invite.expiresAt,
      },
      { headers: NO_STORE }
    );
  } catch (error) {
    console.error("[team-invite] lookup failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet bilgisi alınamadı." }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const blocked = await inviteRateLimited(req);
  if (blocked) return blocked;
  const { token } = await params;
  const body = await req.json().catch(() => ({}));
  return joinTeamResponse(token, body && typeof body === "object" ? body : {});
}
