import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getWhatsAppBookingUrl } from "@/lib/utils";
import { APPOINTMENT_STATUS } from "@/lib/appointmentStatus";

const APPOINTMENT_STATUSES = Object.keys(APPOINTMENT_STATUS);

// GET: List appointments
export async function GET(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const date = searchParams.get("date");
    const search = searchParams.get("search");

    const where: any = {
      businessId: user.business.id,
    };

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (date) {
      where.date = date;
    }

    if (search) {
      where.OR = [
        { customerName: { contains: search } },
        { customerPhone: { contains: search } },
      ];
    }

    const appointments = await prisma.appointment.findMany({
      where,
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
      ],
    });

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

    // Only a literal `true` asks for a blocked slot; the request is then authorized by the owner session,
    // never by the flag itself. Anything else is handled as a regular public booking.
    const blocking = isBlockedSlot === true;

    // Closing a time slot is an owner action; the public booking form must not be able to do it.
    if (blocking) {
      const owner = await getCurrentUser();
      if (!owner || owner.business?.id !== businessId) {
        return NextResponse.json({ error: "Saat kapatmak için işletme hesabıyla giriş yapmalısınız." }, { status: 403 });
      }
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: { subscription: true },
    });

    if (!business) {
      return NextResponse.json({ error: "İşletme bulunamadı." }, { status: 404 });
    }

    // Check if subscription has expired
    if (business.subscription) {
      const now = new Date();
      if (business.subscription.status === "expired" || (business.subscription.status === "trial" && now > new Date(business.subscription.trialEndDate))) {
        return NextResponse.json(
          { error: "Bu işletmenin rezervasyon sistemi şu an aktif değildir (Abonelik süresi doldu)." },
          { status: 403 }
        );
      }
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

    // Calculate end time
    const [h, m] = startTime.split(":").map(Number);
    const endMinutes = h * 60 + m + service.durationMinutes;
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, "0");
    const endM = (endMinutes % 60).toString().padStart(2, "0");
    const endTime = `${endH}:${endM}`;

    // Select employee
    let assignedEmployeeId = employeeId;
    if (!assignedEmployeeId || assignedEmployeeId === "any") {
      const employees = await prisma.employee.findMany({
        where: { businessId, isActive: true },
      });
      if (employees.length === 0) {
        return NextResponse.json({ error: "Uygun çalışan bulunamadı." }, { status: 400 });
      }
      assignedEmployeeId = employees[0].id;
    }

    const employee = await prisma.employee.findFirst({
      where: { id: assignedEmployeeId, businessId, ...activeOnly },
    });

    if (!employee) {
      return NextResponse.json({ error: "Seçilen çalışan bulunamadı." }, { status: 400 });
    }

    // Upsert Customer CRM record. A blocked slot ("Saat kapat") is not a booking:
    // it gets no customer record and adds nothing to anyone's spend.
    let customer: { id: string } | null = null;
    if (!blocking) {
      const existing = await prisma.customer.findFirst({
        where: {
          businessId,
          phone: customerPhone.trim(),
        },
      });

      if (existing) {
        customer = await prisma.customer.update({
          where: { id: existing.id },
          data: {
            name: customerName,
            email: customerEmail || existing.email,
            totalAppointments: { increment: 1 },
            totalSpent: { increment: service.price },
          },
        });
      } else {
        customer = await prisma.customer.create({
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

    // Handle table validation for restaurant
    let validatedTableId: string | null = null;
    let selectedTable: any = null;
    if (tableId) {
      selectedTable = await prisma.restaurantTable.findFirst({
        where: { id: tableId, businessId },
        include: { area: true },
      });
      if (!selectedTable) {
        return NextResponse.json({ error: "Seçilen masa bulunamadı." }, { status: 404 });
      }

      // Check for overlapping active appointments on this table
      const existingTableAppointments = await prisma.appointment.findMany({
        where: {
          businessId,
          tableId,
          date,
          status: { in: ["PENDING", "CONFIRMED"] },
        },
      });

      for (const app of existingTableAppointments) {
        if (startTime < app.endTime && endTime > app.startTime) {
          return NextResponse.json(
            { error: `Seçtiğiniz ${selectedTable.name} bu saat aralığında maalesef doludur. Lütfen başka bir masa veya saat seçiniz.` },
            { status: 400 }
          );
        }
      }

      validatedTableId = selectedTable.id;
    }

    const mergedSectorData = {
      ...(typeof sectorData === "object" && sectorData !== null ? sectorData : {}),
      ...(selectedTable ? { tableId: selectedTable.id, tableName: selectedTable.name, areaName: selectedTable.area?.name } : {}),
    };

    // Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer?.id ?? null,
        employeeId: assignedEmployeeId,
        serviceId,
        tableId: validatedTableId,
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
    console.error("POST appointment error:", error);
    return NextResponse.json({ error: "Rezervasyon oluşturulurken bir hata oluştu." }, { status: 500 });
  }
}

// PATCH: Update appointment status (Onayla, Tamamla, İptal et, Not güncelle)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id, status, notes } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Rezervasyon ID'si gereklidir." }, { status: 400 });
    }

    // Any of the four statuses may follow any other (the calendar can e.g. re-confirm a cancelled one),
    // so only the value itself is validated.
    if (status && !APPOINTMENT_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Geçersiz rezervasyon durumu." }, { status: 400 });
    }

    const updated = await prisma.appointment.update({
      where: {
        id,
        businessId: user.business.id,
      },
      data: {
        ...(status ? { status } : {}),
        ...(notes !== undefined ? { notes } : {}),
      },
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error) {
    console.error("PATCH appointment error:", error);
    return NextResponse.json({ error: "Rezervasyon güncellenirken bir hata oluştu." }, { status: 500 });
  }
}
