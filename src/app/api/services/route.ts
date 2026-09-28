import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const services = await prisma.service.findMany({
      where: { businessId: user.business.id },
      include: {
        employeeServices: {
          include: { employee: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("GET services error:", error);
    return NextResponse.json({ error: "Hizmetler alınırken hata oluştu." }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { name, description, durationMinutes, price, image, employeeIds } = await req.json();

    if (!name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json({ error: "İsim, süre ve fiyat alanları zorunludur." }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        businessId: user.business.id,
        name,
        description: description || null,
        durationMinutes: parseInt(durationMinutes, 10),
        price: parseFloat(price),
        image: image || null,
      },
    });

    // Link assigned employees
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      for (const empId of employeeIds) {
        await prisma.employeeService.create({
          data: {
            employeeId: empId,
            serviceId: service.id,
          },
        });
      }
    }

    return NextResponse.json({ success: true, service });
  } catch (error) {
    console.error("POST service error:", error);
    return NextResponse.json({ error: "Hizmet oluşturulurken hata oluştu." }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id, name, description, durationMinutes, price, image, isActive } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Hizmet ID'si gereklidir." }, { status: 400 });
    }

    const updated = await prisma.service.update({
      where: { id, businessId: user.business.id },
      data: {
        ...(name ? { name } : {}),
        ...(description !== undefined ? { description } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: parseInt(durationMinutes, 10) } : {}),
        ...(price !== undefined ? { price: parseFloat(price) } : {}),
        ...(image !== undefined ? { image } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return NextResponse.json({ success: true, service: updated });
  } catch (error) {
    console.error("PUT service error:", error);
    return NextResponse.json({ error: "Hizmet güncellenirken hata oluştu." }, { status: 500 });
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
      return NextResponse.json({ error: "Hizmet ID'si gereklidir." }, { status: 400 });
    }

    await prisma.service.delete({
      where: { id, businessId: user.business.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE service error:", error);
    return NextResponse.json({ error: "Hizmet silinirken hata oluştu." }, { status: 500 });
  }
}
