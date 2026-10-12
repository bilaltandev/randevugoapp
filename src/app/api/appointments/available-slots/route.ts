import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  OCCUPYING_STATUSES,
  businessNow,
  dayOfWeekFromKey,
  employeesForService,
  findOverlap,
  fitsWorkingHour,
  isValidDateKey,
  minutesToTime,
  storedTimeToMinutes,
} from "@/lib/appointmentRules";

/** Slots start every 30 minutes. */
const STEP_MINUTES = 30;
/** Today's slots must start at least this far in the future. */
const LEAD_MINUTES = 15;

// Same rules as POST /api/appointments (appointmentRules), so a slot offered here is one the booking accepts.
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
    if (!isValidDateKey(dateStr)) {
      return NextResponse.json({ error: "Geçersiz tarih.", code: "INVALID_DATE_TIME" }, { status: 400 });
    }

    // "Today" and the current time are Türkiye time, not the server's (UTC on Vercel).
    const now = businessNow();
    if (dateStr < now.dateKey) {
      return NextResponse.json({ slots: [], message: "Geçmiş bir tarih seçildi." });
    }

    const dayOfWeek = dayOfWeekFromKey(dateStr);

    const workingHour = await prisma.workingHour.findFirst({
      where: { businessId, dayOfWeek, employeeId: null }, // business-wide hours
    });

    const openMin = workingHour ? storedTimeToMinutes(workingHour.openTime) : null;
    const closeMin = workingHour ? storedTimeToMinutes(workingHour.closeTime) : null;
    if (!workingHour || !workingHour.isOpen || openMin === null || closeMin === null) {
      return NextResponse.json({ slots: [], message: "Bu gün işletme kapalıdır." });
    }

    let durationMinutes = 30;
    if (serviceId) {
      const service = await prisma.service.findFirst({ where: { id: serviceId, businessId } });
      if (service) durationMinutes = service.durationMinutes;
    }

    const employees = await prisma.employee.findMany({
      where: {
        businessId,
        isActive: true,
        ...(employeeId && employeeId !== "any" ? { id: employeeId } : {}),
      },
      include: {
        employeeServices: { select: { serviceId: true } },
        workingHours: { where: { dayOfWeek } },
      },
    });
    const activeEmployees = serviceId ? employeesForService(employees, serviceId) : employees;

    if (activeEmployees.length === 0) {
      return NextResponse.json({ slots: [], message: "Seçilen kriterde uygun çalışan bulunamadı." });
    }

    const existingAppointments = await prisma.appointment.findMany({
      where: {
        businessId,
        date: dateStr,
        status: { in: [...OCCUPYING_STATUSES] },
      },
      select: { employeeId: true, startTime: true, endTime: true, status: true },
    });

    const earliestStart = dateStr === now.dateKey ? now.minutes + LEAD_MINUTES : -1;
    const availableSlots: string[] = [];

    for (let slotStart = openMin; slotStart + durationMinutes <= closeMin; slotStart += STEP_MINUTES) {
      if (slotStart <= earliestStart) continue;
      const range = { start: slotStart, end: slotStart + durationMinutes };
      if (!fitsWorkingHour(workingHour, range)) continue; // business break

      // At least one employee must be working (own hours, when set) and free.
      const isSlotAvailable = activeEmployees.some(
        (emp) =>
          (emp.workingHours.length === 0 || fitsWorkingHour(emp.workingHours[0], range)) &&
          !findOverlap(existingAppointments.filter((a) => a.employeeId === emp.id), range)
      );

      if (isSlotAvailable) availableSlots.push(minutesToTime(slotStart));
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
