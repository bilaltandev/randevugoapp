import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { TeamInviteError, createInvite, revokeInvites } from "@/lib/teamInvites";
import { subscriptionLock } from "@/lib/subscriptionAccess";

// Business owner (web cookie or mobile Bearer), TEAM plan:
//   POST   { employeeId }   → a new single-use invite link for that staff record ({ path, expiresAt })
//   DELETE ?employeeId=…    → stops that record's open links

const NO_STORE = { "Cache-Control": "no-store" };

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;
    const body = await req.json().catch(() => ({}));
    const employeeId = typeof body.employeeId === "string" ? body.employeeId : "";
    if (!employeeId) {
      return NextResponse.json({ error: "Çalışan seçilmedi.", code: "INVALID_REQUEST" }, { status: 400 });
    }

    // The link token is returned once and never stored in plain form.
    const invite = await createInvite(user.business.id, employeeId);
    return NextResponse.json({ path: invite.path, expiresAt: invite.expiresAt }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof TeamInviteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[team-invite] create failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet bağlantısı oluşturulamadı." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;
    const employeeId = new URL(req.url).searchParams.get("employeeId");
    if (!employeeId) {
      return NextResponse.json({ error: "Çalışan seçilmedi.", code: "INVALID_REQUEST" }, { status: 400 });
    }
    const revoked = await revokeInvites(user.business.id, employeeId);
    return NextResponse.json({ success: true, revoked });
  } catch (error) {
    console.error("[team-invite] revoke failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet iptal edilemedi." }, { status: 500 });
  }
}
