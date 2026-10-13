import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { subscriptionLock } from "@/lib/subscriptionAccess";
import { TeamInviteError, createInviteCode, openCodeSummary, revokeInviteCodes } from "@/lib/teamInvites";

// Business owner, TEAM plan: single-use sign-up codes ("Hazır ekibe katıl").
//   GET    → how many codes are open (codes themselves are never shown again)
//   POST   → a new code, returned once
//   DELETE → stops every open code

const NO_STORE = { "Cache-Control": "no-store" };

async function ownerBusinessId() {
  const user = await getCurrentUser();
  return user?.business?.id ?? null;
}

async function ownerBusiness() {
  const user = await getCurrentUser();
  return user?.business ?? null;
}

export async function GET() {
  try {
    const businessId = await ownerBusinessId();
    if (!businessId) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    return NextResponse.json(await openCodeSummary(businessId), { headers: NO_STORE });
  } catch (error) {
    console.error("[team-code] summary failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet kodları alınamadı." }, { status: 500 });
  }
}

export async function POST() {
  try {
    const business = await ownerBusiness();
    if (!business) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    const locked = subscriptionLock(business.subscription);
    if (locked) return locked;
    const businessId = business.id;
    const { code, expiresAt } = await createInviteCode(businessId);
    return NextResponse.json({ code, expiresAt }, { headers: NO_STORE });
  } catch (error) {
    if (error instanceof TeamInviteError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[team-code] create failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet kodu oluşturulamadı." }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const businessId = await ownerBusinessId();
    if (!businessId) return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    return NextResponse.json({ success: true, revoked: await revokeInviteCodes(businessId) });
  } catch (error) {
    console.error("[team-code] revoke failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Davet kodları iptal edilemedi." }, { status: 500 });
  }
}
