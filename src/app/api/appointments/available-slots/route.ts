import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");
    const dateStr = searchParams.get("date"); // YYYY-MM-DD
    const serviceId = searchParams.get("serviceId");
    const employeeId = searchParams.get("employeeId"); // optional or "any"

    if (!businessId || !dateStr) {
      return NextResponse.json(
        { error: "businessId ve date parametreleri zorunludur." },
        { status: 400 }
      );
    }

    const targetDate = new Date(dateStr + "T00:00:00");
    const dayOfWeek = targetDate.getDay(); // 0 is Sunday, 1 is Monday ...

    // Get business working hours for this day
    const workingHour = await prisma.workingHour.findFirst({
      where: {
        businessId,
        dayOfWeek,
        employeeId: null, // Business overall hours
      },
    });

    if (!workingHour || !workingHour.isOpen) {
      return NextResponse.json({ slots: [], message: "Bu gün işletme kapalıdır." });
    }

    // Get service duration
    let durationMinutes = 30;
    if (serviceId) {
      const service = await prisma.service.findUnique({
        where: { id: serviceId },
      });
      if (service) durationMinutes = service.durationMinutes;
    }

    // Get employees for this business
    let activeEmployees = await prisma.employee.findMany({
      where: {
        businessId,
        isActive: true,
        ...(employeeId && employeeId !== "any" ? { id: employeeId } : {}),
      },
    });

    if (activeEmployees.length === 0) {
      return NextResponse.json({ slots: [], message: "Seçilen kriterde uygun çalışan bulunamadı." });
    }

    // Get existing appointments for this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: dateStr,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    // Helper: convert "HH:mm" to minutes from midnight
    const timeToMinutes = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };

    const minutesToTime = (minutes: number) => {
      const h = Math.floor(minutes / 60).toString().padStart(2, "0");
      const m = (minutes % 60).toString().padStart(2, "0");
      return `${h}:${m}`;
    };

    const openMin = timeToMinutes(workingHour.openTime);
    const closeMin = timeToMinutes(workingHour.closeTime);
    const breakStartMin = workingHour.breakStartTime ? timeToMinutes(workingHour.breakStartTime) : null;
    const breakEndMin = workingHour.breakEndTime ? timeToMinutes(workingHour.breakEndTime) : null;

    // Check if targetDate is today, filter past hours
    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const availableSlots: string[] = [];

    // Step by 30 minutes
    const step = 30;

    for (let slotStart = openMin; slotStart + durationMinutes <= closeMin; slotStart += step) {
      const slotEnd = slotStart + durationMinutes;

      // If today, slot must be at least 15 mins in future
      if (isToday && slotStart <= currentMinutes + 15) {
        continue;
      }

      // Check break overlap
      if (breakStartMin !== null && breakEndMin !== null) {
        if (slotStart < breakEndMin && slotEnd > breakStartMin) {
          continue; // Overlaps with lunch break
        }
      }

      // Check if at least one employee is available during this slot
      const isSlotAvailable = activeEmployees.some((emp) => {
        const empAppointments = existingAppointments.filter((a) => a.employeeId === emp.id);
        const hasConflict = empAppointments.some((a) => {
          const aStart = timeToMinutes(a.startTime);
          const aEnd = timeToMinutes(a.endTime);
          return slotStart < aEnd && slotEnd > aStart;
        });
        return !hasConflict;
      });

      if (isSlotAvailable) {
        availableSlots.push(minutesToTime(slotStart));
      }
    }

    return NextResponse.json({
      slots: availableSlots,
      workingHours: {
        open: workingHour.openTime,
        close: workingHour.closeTime,
      },
    });
  } catch (error) {
    console.error("Available slots error:", error);
    return NextResponse.json({ error: "Saatler hesaplanırken hata oluştu." }, { status: 500 });
  }
}
