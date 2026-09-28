import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const employees = await prisma.employee.findMany({
      where: { businessId: user.business.id },
      include: {
        employeeServices: {
          include: { service: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("GET employees error:", error);
    return NextResponse.json({ error: "Çalışanlar alınırken hata oluştu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { name, specialty, photo, phone, email, serviceIds } = await req.json();

    if (!name || !specialty) {
      return NextResponse.json({ error: "İsim ve uzmanlık alanı zorunludur." }, { status: 400 });
    }

    const employee = await prisma.employee.create({
      data: {
        businessId: user.business.id,
        name,
        specialty,
        photo: photo || `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop`,
        phone: phone || null,
        email: email || null,
      },
    });

    if (Array.isArray(serviceIds)) {
      for (const sId of serviceIds) {
        await prisma.employeeService.create({
          data: {
            employeeId: employee.id,
            serviceId: sId,
          },
        });
      }
    }

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("POST employee error:", error);
    return NextResponse.json({ error: "Çalışan eklenirken hata oluştu." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id, name, specialty, photo, phone, email, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Çalışan ID'si gereklidir." }, { status: 400 });
    }

    const updated = await prisma.employee.update({
      where: { id, businessId: user.business.id },
      data: {
        ...(name ? { name } : {}),
        ...(specialty ? { specialty } : {}),
        ...(photo !== undefined ? { photo } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({ success: true, employee: updated });
  } catch (error) {
    console.error("PUT employee error:", error);
    return NextResponse.json({ error: "Çalışan güncellenirken hata oluştu." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Çalışan ID'si gereklidir." }, { status: 400 });
    }

    await prisma.employee.delete({
      where: { id, businessId: user.business.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE employee error:", error);
    return NextResponse.json({ error: "Çalışan silinirken hata oluştu." }, { status: 500 });
  }
}
