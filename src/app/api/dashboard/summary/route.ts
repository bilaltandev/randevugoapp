import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getDashboardSummary, trialDaysRemaining } from "@/lib/dashboardSummary";
import { getStaffActor } from "@/lib/staffActor";

// Panel overview ("Özet") for the mobile app: the same data the web dashboard page renders.
// A team member gets the same overview, counting only their own bookings.
export async function GET() {
  try {
    const actor = await getStaffActor();
    if (!actor) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const [summary, subscription] = await Promise.all([
      getDashboardSummary(actor.businessId, actor.employeeId ?? undefined),
      prisma.subscription.findUnique({ where: { businessId: actor.businessId }, select: { status: true, trialEndDate: true } }),
    ]);

    return NextResponse.json({
      ...summary,
      subscription: {
        status: subscription?.status ?? "trial",
        daysRemaining: trialDaysRemaining(subscription),
      },
    });
  } catch (error) {
    console.error("GET dashboard summary error:", error);
    return NextResponse.json({ error: "Özet bilgileri alınamadı." }, { status: 500 });
  }
}
