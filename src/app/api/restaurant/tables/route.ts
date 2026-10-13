import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { businessNow } from "@/lib/appointmentRules";
import { getCurrentUser } from "@/lib/auth";
import { subscriptionLock } from "@/lib/subscriptionAccess";

// Helper: check if two time ranges overlap (HH:mm strings)
function isTimeOverlapping(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  return start1 < end2 && end1 > start2;
}

// GET /api/restaurant/tables
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessIdParam = searchParams.get("businessId");
    const areaIdParam = searchParams.get("areaId");
    const dateParam = searchParams.get("date");
    const startTimeParam = searchParams.get("startTime");
    const durationMinutesParam = searchParams.get("durationMinutes");
    const guestCountParam = searchParams.get("guestCount");

    let businessId = businessIdParam;
    let isOwner = false;

    if (!businessId) {
      const user = await getCurrentUser();
      if (!user || !user.business) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
      }
      businessId = user.business.id;
      isOwner = true;
    } else {
      const user = await getCurrentUser();
      if (user && user.business?.id === businessId) {
        isOwner = true;
      }
    }

    const where: any = { businessId };
    if (areaIdParam && areaIdParam !== "ALL") {
      where.areaId = areaIdParam;
    }

    const tables = await prisma.restaurantTable.findMany({
      where,
      include: {
        area: true,
      },
      orderBy: [{ name: "asc" }],
    });

    // If date and startTime are provided, calculate real-time reservation availability
    let calculatedEndTime = "";
    if (startTimeParam) {
      const duration = Number(durationMinutesParam) || 90;
      const [h, m] = startTimeParam.split(":").map(Number);
      const totalM = h * 60 + m + duration;
      const eh = Math.floor(totalM / 60).toString().padStart(2, "0");
      const em = (totalM % 60).toString().padStart(2, "0");
      calculatedEndTime = `${eh}:${em}`;
    }

    // Target date for appointments check: either dateParam or today for owner
    // "Today" is Türkiye time, not the server's UTC day.
    const targetDate = dateParam || (isOwner ? businessNow().dateKey : null);

    let appointmentsForDate: any[] = [];
    if (targetDate) {
      appointmentsForDate = await prisma.appointment.findMany({
        where: {
          businessId,
          date: targetDate,
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
          date: true,
        },
      });
    }

    const guestCount = guestCountParam ? parseInt(guestCountParam, 10) : 0;

    const enrichedTables = tables.map((tbl) => {
      // Find appointments matching this table
      const tableAppointments = appointmentsForDate.filter((app) => app.tableId === tbl.id);

      let isOccupiedAtRequestedTime = false;
      let matchingAppointment: any = null;

      if (startTimeParam && calculatedEndTime) {
        for (const app of tableAppointments) {
          if (isTimeOverlapping(startTimeParam, calculatedEndTime, app.startTime, app.endTime)) {
            isOccupiedAtRequestedTime = true;
            matchingAppointment = app;
            break;
          }
        }
      } else if (tableAppointments.length > 0) {
        // If no specific slot requested, check if it has any appointment today
        matchingAppointment = tableAppointments[0];
      }

      // Determine computed status:
      // "AVAILABLE" | "RESERVED" | "OCCUPIED" | "OUT_OF_SERVICE"
      let computedStatus = tbl.status; // Base status from model ("AVAILABLE", "OUT_OF_SERVICE", etc.)
      if (!tbl.isActive) {
        computedStatus = "OUT_OF_SERVICE";
      } else if (isOccupiedAtRequestedTime || matchingAppointment) {
        computedStatus = matchingAppointment.status === "CONFIRMED" ? "OCCUPIED" : "RESERVED";
      } else if (tbl.status === "OUT_OF_SERVICE") {
        computedStatus = "OUT_OF_SERVICE";
      } else {
        computedStatus = "AVAILABLE";
      }

      const isCapacitySufficient = guestCount > 0 ? tbl.capacity >= guestCount : true;

      return {
        ...tbl,
        computedStatus,
        isAvailable: tbl.isActive && computedStatus === "AVAILABLE" && isCapacitySufficient,
        insufficientCapacity: !isCapacitySufficient,
        currentAppointment: isOwner ? matchingAppointment : (matchingAppointment ? { startTime: matchingAppointment.startTime, endTime: matchingAppointment.endTime } : null),
      };
    });

    return NextResponse.json({ tables: enrichedTables });
  } catch (error) {
    console.error("GET restaurant tables error:", error);
    return NextResponse.json({ error: "Masalar alınırken bir hata oluştu." }, { status: 500 });
  }
}

// POST /api/restaurant/tables
// Create a new table
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const body = await req.json();
    const {
      name,
      capacity = 2,
      shape = "ROUND",
      positionX = 100,
      positionY = 100,
      width = 90,
      height = 90,
      imageUrl,
      description,
      areaId,
      isActive = true,
      status = "AVAILABLE",
    } = body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Masa adı / numarası gereklidir." }, { status: 400 });
    }

    // Verify areaId belongs to this business if provided
    let verifiedAreaId = null;
    if (areaId) {
      const area = await prisma.restaurantArea.findFirst({
        where: { id: areaId, businessId: user.business.id },
      });
      if (area) {
        verifiedAreaId = area.id;
      }
    }

    const newTable = await prisma.restaurantTable.create({
      data: {
        businessId: user.business.id,
        areaId: verifiedAreaId,
        name: name.trim(),
        capacity: Math.max(1, Number(capacity) || 2),
        shape: ["ROUND", "SQUARE", "RECTANGLE"].includes(shape) ? shape : "ROUND",
        positionX: Number(positionX) || 100,
        positionY: Number(positionY) || 100,
        width: Math.max(50, Number(width) || 90),
        height: Math.max(50, Number(height) || 90),
        imageUrl: imageUrl || null,
        description: description ? description.trim() : null,
        isActive: Boolean(isActive),
        status: ["AVAILABLE", "RESERVED", "OCCUPIED", "OUT_OF_SERVICE"].includes(status) ? status : "AVAILABLE",
      },
      include: {
        area: true,
      },
    });

    return NextResponse.json({ success: true, table: newTable });
  } catch (error) {
    console.error("POST restaurant table error:", error);
    return NextResponse.json({ error: "Masa oluşturulurken hata oluştu." }, { status: 500 });
  }
}

// PATCH /api/restaurant/tables
// Update an existing table
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const body = await req.json();
    const {
      id,
      name,
      capacity,
      shape,
      positionX,
      positionY,
      width,
      height,
      imageUrl,
      description,
      areaId,
      isActive,
      status,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Masa ID gereklidir." }, { status: 400 });
    }

    const existing = await prisma.restaurantTable.findFirst({
      where: { id, businessId: user.business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    let verifiedAreaId = existing.areaId;
    if (areaId !== undefined) {
      if (areaId === null || areaId === "") {
        verifiedAreaId = null;
      } else {
        const area = await prisma.restaurantArea.findFirst({
          where: { id: areaId, businessId: user.business.id },
        });
        verifiedAreaId = area ? area.id : null;
      }
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (capacity !== undefined) updateData.capacity = Math.max(1, Number(capacity));
    if (shape !== undefined && ["ROUND", "SQUARE", "RECTANGLE"].includes(shape)) updateData.shape = shape;
    if (positionX !== undefined) updateData.positionX = Number(positionX);
    if (positionY !== undefined) updateData.positionY = Number(positionY);
    if (width !== undefined) updateData.width = Math.max(50, Number(width));
    if (height !== undefined) updateData.height = Math.max(50, Number(height));
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (description !== undefined) updateData.description = description;
    if (areaId !== undefined) updateData.areaId = verifiedAreaId;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);
    if (status !== undefined && ["AVAILABLE", "RESERVED", "OCCUPIED", "OUT_OF_SERVICE"].includes(status)) {
      updateData.status = status;
    }

    const updated = await prisma.restaurantTable.update({
      where: { id },
      data: updateData,
      include: {
        area: true,
      },
    });

    return NextResponse.json({ success: true, table: updated });
  } catch (error) {
    console.error("PATCH restaurant table error:", error);
    return NextResponse.json({ error: "Masa güncellenirken hata oluştu." }, { status: 500 });
  }
}

// DELETE /api/restaurant/tables
// Delete a table
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Masa ID gereklidir." }, { status: 400 });
    }

    const existing = await prisma.restaurantTable.findFirst({
      where: { id, businessId: user.business.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Masa bulunamadı." }, { status: 404 });
    }

    await prisma.restaurantTable.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE restaurant table error:", error);
    return NextResponse.json({ error: "Masa silinirken hata oluştu." }, { status: 500 });
  }
}
