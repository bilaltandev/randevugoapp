import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getStaffActor } from "@/lib/staffActor";
import { subscriptionAccess, subscriptionLock } from "@/lib/subscriptionAccess";
import { getWhatsAppBookingUrl } from "@/lib/utils";
import { APPOINTMENT_STATUS } from "@/lib/appointmentStatus";
import {
  appointmentRange,
  dayOfWeekFromKey,
  employeesForService,
  findOverlap,
  fitsWorkingHour,
  isOccupyingStatus,
  isPastSlot,
  isValidDateKey,
  minutesToTime,
  parseTime,
  storedTimeToMinutes,
} from "@/lib/appointmentRules";
import {
  BookingError,
  EMPLOYEE_TIME_CONFLICT,
  NO_AVAILABLE_EMPLOYEE,
  TABLE_TIME_CONFLICT,
  occupyingAppointments,
  withBookingLock,
} from "@/lib/appointmentBooking";

const APPOINTMENT_STATUSES = Object.keys(APPOINTMENT_STATUS);

const EMPLOYEE_CONFLICT_MESSAGE = "Seçilen çalışanın bu saat aralığında başka bir randevusu var. Lütfen başka bir saat veya çalışan seçin.";

// GET: List appointments (owner: the whole business; team member: only their own)
export async function GET(req: Request) {
  try {
    const actor = await getStaffActor();
    if (!actor) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    const where: any = {
      businessId: actor.businessId,
      ...(actor.employeeId ? { employeeId: actor.employeeId } : {}),
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (date) {
      where.date = date;
    } else {
      // Optional date range (mobile calendar week/month views): ?from=YYYY-MM-DD&to=YYYY-MM-DD
      const from = searchParams.get("from");
      const to = searchParams.get("to");
      if ((from && isValidDateKey(from)) || (to && isValidDateKey(to))) {
        where.date = {
          ...(from && isValidDateKey(from) ? { gte: from } : {}),
          ...(to && isValidDateKey(to) ? { lte: to } : {}),
        };
      }
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search } },
      ];
    }

    // Optional paging (mobile list): ?limit=&offset=. Without `limit` the full list is returned as before.
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Math.min(Math.max(parseInt(limitParam, 10) || 0, 1), 100) : null;
    const offset = limit ? Math.max(parseInt(searchParams.get("offset") ?? "0", 10) || 0, 0) : 0;

    const appointments = await prisma.appointment.findMany({
      where,
      ...(limit ? { skip: offset, take: limit + 1 } : {}),
      include: {
        service: true,
        employee: true,
        customer: true,
        review: true,
        table: {
          include: {
            area: true,
          },
        },
      },
      orderBy: [
        { date: "desc" },
        { startTime: "asc" },
        { id: "asc" }, // stable order for paging
      ],
    });

    if (limit) {
      // One extra row was fetched to tell whether another page exists.
      const hasMore = appointments.length > limit;
      return NextResponse.json({ appointments: appointments.slice(0, limit), hasMore, nextOffset: hasMore ? offset + limit : null });
    }

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("GET appointments error:", error);
    return NextResponse.json({ error: "Rezervasyonlar alınırken bir hata oluştu." }, { status: 500 });
  }
}


// POST: Create appointment (Public Customer or Business Owner)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      businessId,
      serviceId,
      employeeId,
      date,
      startTime,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      sectorData,
      tableId,
      isBlockedSlot = false,
    } = body;

    if (!businessId || !serviceId || !date || !startTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Lütfen gerekli tüm randevu bilgilerini doldurunuz." },
        { status: 400 }
      );
    }

    // Overlap checks compare minutes, so malformed dates/times must never reach them.
    if (!isValidDateKey(date) || parseTime(startTime) === null) {
      return NextResponse.json({ error: "Geçersiz tarih veya saat.", code: "INVALID_DATE_TIME" }, { status: 400 });
    }

    // Only a literal `true` asks for a blocked slot; the request is then authorized by the owner session,
    // never by the flag itself. Anything else is handled as a regular public booking.
    const blocking = isBlockedSlot === true;

    // The business's own owner (web cookie or mobile Bearer) or one of its team members may book outside the
    // public opening hours, e.g. a walk-in; everyone else gets the same hours the booking page offers.
    // A team member always books for themselves, whatever employee the request names.
    const actor = await getStaffActor();
    const isOwner = !!actor && actor.businessId === businessId;
    const memberEmployeeId = isOwner && actor.kind === "member" ? actor.employeeId : null;

    // Closing a time slot is a staff action; the public booking form must not be able to do it.
    if (blocking && !isOwner) {
      return NextResponse.json({ error: "Saat kapatmak için işletme hesabıyla giriş yapmalısınız." }, { status: 403 });
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    // No trial or paid period left: nobody books, not customers and not the staff themselves.
    if (!subscriptionAccess(business.subscription).active) {
      if (isOwner) return subscriptionLock(business.subscription)!;
      return NextResponse.json(
        { error: "Bu işletme şu an online randevu almıyor.", code: "BOOKING_CLOSED" },
        { status: 403 }
      );
    }

    // Every referenced record must belong to the business being booked. Customers may only book
    // active services and staff; an owner closing a slot may reference inactive ones.
    const activeOnly = blocking ? {} : { isActive: true };

    const service = await prisma.service.findFirst({
      where: { id: serviceId, businessId, ...activeOnly },
    });

    if (!service) {
      return NextResponse.json({ error: "Seçilen hizmet bulunamadı." }, { status: 404 });
    }

    const range = appointmentRange(startTime, service.durationMinutes);
    if (!range) {
      return NextResponse.json(
        { error: "Randevu gün sonunu aşamaz. Lütfen daha erken bir saat seçin.", code: "INVALID_DATE_TIME" },
        { status: 400 }
      );
    }
    const endTime = minutesToTime(range.end);
    const dayOfWeek = dayOfWeekFromKey(date);

    if (!isOwner) {
      // Customers can't book a time that has already started (Türkiye time). Owners may, e.g. to record a walk-in.
      if (isPastSlot(date, range.start)) {
        return NextResponse.json(
          { error: "Geçmiş bir saate rezervasyon yapılamaz. Lütfen ileri bir saat seçin.", code: "PAST_DATE_TIME" },
          { status: 400 }
        );
      }
      const businessHour = await prisma.workingHour.findFirst({ where: { businessId, dayOfWeek, employeeId: null } });
      if (!businessHour || !fitsWorkingHour(businessHour, range)) {
        return NextResponse.json(
          { error: "Seçilen saat işletmenin çalışma saatleri dışında.", code: "OUTSIDE_WORKING_HOURS" },
          { status: 400 }
        );
      }
    }

    // Candidate employees. "any" picks the first one who is free (inside the lock below), so a slot that
    // available-slots offered because some employee is free is not rejected because the first one is busy.
    const requestedEmployeeId = memberEmployeeId ?? employeeId;
    const anyEmployee = !requestedEmployeeId || requestedEmployeeId === "any";
    const employees = await prisma.employee.findMany({
      where: { businessId, ...(anyEmployee ? { isActive: true } : { id: requestedEmployeeId, ...activeOnly }) },
      include: { employeeServices: { select: { serviceId: true } }, workingHours: { where: { dayOfWeek } } },
      orderBy: { createdAt: "asc" },
    });

    if (employees.length === 0) {
      return NextResponse.json(
        { error: anyEmployee ? "Uygun çalışan bulunamadı." : "Seçilen çalışan bulunamadı." },
        { status: 400 }
      );
    }

    let candidates = anyEmployee ? employeesForService(employees, service.id) : employees;
    if (!isOwner) {
      // An employee's own hours for the day, when set, narrow the business hours (as in available-slots).
      candidates = candidates.filter((e) => e.workingHours.length === 0 || fitsWorkingHour(e.workingHours[0], range));
    }
    if (candidates.length === 0) {
      return NextResponse.json(
        anyEmployee
          ? { error: "Bu saat için uygun çalışan bulunamadı.", code: NO_AVAILABLE_EMPLOYEE }
          : { error: "Seçilen çalışan bu saatte çalışmıyor.", code: "OUTSIDE_WORKING_HOURS" },
        { status: anyEmployee ? 409 : 400 }
      );
    }

    // Handle table validation for restaurant
    let selectedTable: any = null;
    if (tableId) {
      selectedTable = await prisma.restaurantTable.findFirst({
        where: { id: tableId, businessId },
        include: { area: true },
      });
      if (!selectedTable) {
        return NextResponse.json({ error: "Seçilen masa bulunamadı." }, { status: 404 });
      }
    }

    const mergedSectorData = {
      ...(typeof sectorData === "object" && sectorData !== null ? sectorData : {}),
      ...(selectedTable ? { tableId: selectedTable.id, tableName: selectedTable.name, areaName: selectedTable.area?.name } : {}),
    };

    // Checks and writes run under one lock per business and day, so concurrent requests cannot both
    // take the same employee or table. Nothing is written (customer stats included) when a check fails.
    const { appointment, employee } = await withBookingLock(businessId, date, async (tx) => {
      const occupied = await occupyingAppointments(tx, businessId, date);

      if (selectedTable && findOverlap(occupied.filter((a) => a.tableId === selectedTable.id), range)) {
        throw new BookingError(
          409,
          TABLE_TIME_CONFLICT,
          `Seçtiğiniz ${selectedTable.name} bu saat aralığında maalesef doludur. Lütfen başka bir masa veya saat seçiniz.`
        );
      }

      // A closed slot is not a booking: the owner may close time that already has appointments.
      // It still occupies its employee, so new bookings cannot be placed on it.
      const employee = blocking
        ? candidates[0]
        : candidates.find((e) => !findOverlap(occupied.filter((a) => a.employeeId === e.id), range));
      if (!employee) {
        throw anyEmployee
          ? new BookingError(409, NO_AVAILABLE_EMPLOYEE, "Bu saat için uygun çalışan kalmadı. Lütfen başka bir saat seçin.")
          : new BookingError(409, EMPLOYEE_TIME_CONFLICT, EMPLOYEE_CONFLICT_MESSAGE);
      }

      // Upsert Customer CRM record. A blocked slot ("Saat kapat") is not a booking:
      // it gets no customer record and adds nothing to anyone's spend.
      let customer: { id: string } | null = null;
      if (!blocking) {
        const existing = await tx.customer.findFirst({
          where: {
            businessId,
            phone: customerPhone.trim(),
          },
        });

        if (existing) {
          customer = await tx.customer.update({
            where: { id: existing.id },
            data: {
              name: customerName,
              email: customerEmail || existing.email,
              totalAppointments: { increment: 1 },
              totalSpent: { increment: service.price },
            },
          });
        } else {
          customer = await tx.customer.create({
            data: {
              businessId,
              name: customerName,
              phone: customerPhone.trim(),
              email: customerEmail || null,
              totalAppointments: 1,
              totalSpent: service.price,
            },
          });
        }
      }

      const appointment = await tx.appointment.create({
        data: {
          businessId,
          customerId: customer?.id ?? null,
          employeeId: employee.id,
          serviceId,
          tableId: selectedTable?.id ?? null,
          date,
          startTime,
          endTime,
          status: blocking ? "CONFIRMED" : "PENDING",
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          notes: notes || null,
          price: blocking ? 0 : service.price,
          sectorData: Object.keys(mergedSectorData).length > 0 ? JSON.stringify(mergedSectorData) : null,
          isBlockedSlot: blocking,
        },
        include: {
          service: true,
          employee: true,
          table: {
            include: {
              area: true,
            },
          },
        },
      });

      return { appointment, employee };
    });

    // Create notification for business
    const tableInfo = selectedTable ? ` (${selectedTable.name})` : "";
    await prisma.notification.create({
      data: {
        businessId,
        title: blocking ? "Saat Kapatıldı" : "Yeni Rezervasyon!",
        message: `${customerName} - ${service.name}${tableInfo} (${date} ${startTime})`,
        type: "APPOINTMENT",
        link: "/dashboard/appointments",
      },
    });

    // WhatsApp URL for quick client or owner messaging
    const whatsappUrl = getWhatsAppBookingUrl({
      phone: business.whatsappNumber || business.phone,
      businessName: business.name,
      customerName,
      serviceName: service.name,
      employeeName: employee?.name || "Uzman",
      date,
      time: startTime,
      notes,
    });

    return NextResponse.json({
      success: true,
      appointment,
      whatsappUrl,
      message: "Rezervasyonunuz başarıyla oluşturuldu.",
    });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("POST appointment error:", error);
    return NextResponse.json({ error: "Rezervasyon oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}

// PATCH: Update appointment status (Onayla, Tamamla, İptal et, Not güncelle). Team members: own bookings only.
export async function PATCH(req: Request) {
  try {
    const actor = await getStaffActor();
    if (!actor) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }
    const businessId = actor.businessId;
    const locked = subscriptionLock(actor.subscription);
    if (locked) return locked;

    const { id, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Rezervasyon ID'si gereklidir." }, { status: 400 });
    }

    // Any of the four statuses may follow any other (the calendar can e.g. re-confirm a cancelled one),
    // so only the value itself is validated.
    if (status && !APPOINTMENT_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz rezervasyon durumu." }, { status: 400 });
    }

    const data = {
      ...(status ? { status } : {}),
      ...(notes !== undefined ? { notes } : {}),
    };

    const current = await prisma.appointment.findFirst({
      where: { id, businessId, ...(actor.employeeId ? { employeeId: actor.employeeId } : {}) },
      select: { date: true, status: true, isBlockedSlot: true },
    });
    if (!current) {
      return NextResponse.json({ error: "Rezervasyon bulunamadı." }, { status: 404 });
    }

    // Bringing a cancelled/completed booking back to an active status takes its time again, so it gets
    // the same overlap check as a new booking (closed slots excepted, as on creation).
    const reactivating = !!status && isOccupyingStatus(status) && !isOccupyingStatus(current.status) && !current.isBlockedSlot;
    if (!reactivating) {
      const updated = await prisma.appointment.update({ where: { id, businessId }, data });
      return NextResponse.json({ success: true, appointment: updated });
    }

    const updated = await withBookingLock(businessId, current.date, async (tx) => {
      const appt = await tx.appointment.findFirstOrThrow({ where: { id, businessId } });
      const start = storedTimeToMinutes(appt.startTime);
      const end = storedTimeToMinutes(appt.endTime);
      if (start !== null && end !== null) {
        const range = { start, end };
        const occupied = await occupyingAppointments(tx, businessId, appt.date, appt.id);
        if (findOverlap(occupied.filter((a) => a.employeeId === appt.employeeId), range)) {
          throw new BookingError(
            409,
            EMPLOYEE_TIME_CONFLICT,
            "Bu randevu tekrar aktif edilemez: çalışanın aynı saat aralığında başka bir randevusu var."
          );
        }
        if (appt.tableId && findOverlap(occupied.filter((a) => a.tableId === appt.tableId), range)) {
          throw new BookingError(409, TABLE_TIME_CONFLICT, "Bu randevu tekrar aktif edilemez: masa aynı saat aralığında dolu.");
        }
      }
      return tx.appointment.update({ where: { id, businessId }, data });
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    if (error instanceof BookingError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("PATCH appointment error:", error);
    return NextResponse.json({ error: "Rezervasyon güncellenirken bir hata oluştu." }, { status: 500 });
  }
}
