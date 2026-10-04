import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TableManagementClient } from "@/components/restaurant/TableManagementClient";
import { TableShape, TableStatus } from "@/components/restaurant/types";
import Link from "next/link";
import { UtensilsCrossed, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TableManagementPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (!user.business) {
    redirect("/register");
  }

  const business = user.business;
  const isRestaurant = business.sector === "RESTORAN" || business.sector === "RESTAURANT";

  if (!isRestaurant) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-4">
          <UtensilsCrossed className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Masa Yönetimi Restoran İşletmelerine Özeldir
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          Bu modül yalnızca Restoran & Kafe sektöründeki işletmeler için aktiftir. İşletme sektörünüz:{" "}
          <strong className="text-slate-800 dark:text-slate-200">{business.sector}</strong>.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6246EA] text-white text-sm font-semibold hover:bg-[#5235d9] transition-colors"
        >
          Panele Geri Dön
        </Link>
      </div>
    );
  }

  // Fetch areas
  const areas = await prisma.restaurantArea.findMany({
    where: { businessId: business.id },
    orderBy: { sortOrder: "asc" },
  });

  // Fetch tables
  const tables = await prisma.restaurantTable.findMany({
    where: { businessId: business.id },
    include: { area: true },
    orderBy: { name: "asc" },
  });

  // Fetch today's active appointments with tables
  const today = new Date().toISOString().split("T")[0];
  const todayAppointments = await prisma.appointment.findMany({
    where: {
      businessId: business.id,
      date: today,
      status: { in: ["PENDING", "CONFIRMED"] },
      tableId: { not: null },
    },
    select: {
      id: true,
      tableId: true,
      startTime: true,
      endTime: true,
      customerName: true,
      customerPhone: true,
      status: true,
    },
  });

  // Enrich initial tables with appointment info
  const enrichedTables = tables.map((tbl) => {
    const matching = todayAppointments.find((a) => a.tableId === tbl.id);
    let computedStatus = tbl.status;
    if (!tbl.isActive) {
      computedStatus = "OUT_OF_SERVICE";
    } else if (matching) {
      computedStatus = matching.status === "CONFIRMED" ? "OCCUPIED" : "RESERVED";
    }
    return {
      ...tbl,
      shape: tbl.shape as TableShape,
      status: tbl.status as TableStatus,
      computedStatus: computedStatus as TableStatus,
      currentAppointment: matching || null,
    };
  });

  return (
    <TableManagementClient
      business={business}
      initialAreas={areas}
      initialTables={enrichedTables}
    />
  );
}
