import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getWhatsAppBookingUrl } from "@/lib/utils";

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
      isBlockedSlot = false,
    } = body;

    if (!businessId || !serviceId || !date || !startTime || !customerName || !customerPhone) {
      return NextResponse.json(
        { error: "Lütfen gerekli tüm randevu bilgilerini doldurunuz." },
        { status: 400 }
      );
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

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
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

    const employee = await prisma.employee.findUnique({
      where: { id: assignedEmployeeId },
    });

    // Upsert Customer CRM record
    let customer = await prisma.customer.findFirst({
      where: {
        businessId,
        phone: customerPhone.trim(),
      },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: customerName,
          email: customerEmail || customer.email,
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

    // Create Appointment
    const appointment = await prisma.appointment.create({
      data: {
        businessId,
        customerId: customer.id,
        employeeId: assignedEmployeeId,
        serviceId,
        date,
        startTime,
        endTime,
        status: isBlockedSlot ? "CONFIRMED" : "PENDING",
        customerName,
        customerPhone,
        customerEmail: customerEmail || null,
        notes: notes || null,
        price: service.price,
        sectorData: sectorData ? JSON.stringify(sectorData) : null,
        isBlockedSlot,
      },
      include: {
        service: true,
        employee: true,
      },
    });

    // Create notification for business
    await prisma.notification.create({
      data: {
        businessId,
        title: isBlockedSlot ? "Saat Kapatıldı" : "Yeni Rezervasyon!",
        message: `${customerName} - ${service.name} (${date} ${startTime})`,
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
