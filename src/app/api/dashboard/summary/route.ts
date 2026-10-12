import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDashboardSummary, trialDaysRemaining } from "@/lib/dashboardSummary";

// Panel overview ("Özet") for the mobile app: the same data the web dashboard page renders.
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const summary = await getDashboardSummary(user.business.id);
    const subscription = user.business.subscription;

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
