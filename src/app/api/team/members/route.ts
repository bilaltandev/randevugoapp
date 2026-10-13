import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { removeMember } from "@/lib/teamInvites";
import { subscriptionLock } from "@/lib/subscriptionAccess";

// Business owner: DELETE ?employeeId=… removes that staff record's member from the team. Their account and
// sessions end; the staff record and its booking history stay (it can be invited again).
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
    const removed = await removeMember(user.business.id, employeeId);
    if (!removed) {
      return NextResponse.json({ error: "Bu çalışan ekibe katılmamış.", code: "NOT_MEMBER" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[team-member] remove failed", { name: (error as Error)?.name });
    return NextResponse.json({ error: "Üye ekipten çıkarılamadı." }, { status: 500 });
  }
}
