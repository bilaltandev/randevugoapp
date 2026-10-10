import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { TableManagementClient } from "@/components/restaurant/TableManagementClient";
import { TableShape, TableStatus } from "@/components/restaurant/types";
import { UtensilsCrossed } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

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
      <Panel className="mx-auto max-w-xl">
        <EmptyState
          icon={UtensilsCrossed}
          title="Masa planı restoranlara özeldir"
          description={
            <>
              Bu modül yalnızca Restoran & Kafe sektöründe aktiftir. İşletme sektörünüz:{" "}
              <span className="font-medium text-ink">{business.sector}</span>.
            </>
          }
          actions={<Button href="/dashboard">Panele dön</Button>}
        />
      </Panel>
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
