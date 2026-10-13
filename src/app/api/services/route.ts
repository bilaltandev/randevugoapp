import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { subscriptionLock } from "@/lib/subscriptionAccess";

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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { name, description, durationMinutes, price, image, employeeIds } = await req.json();

    if (!name || durationMinutes === undefined || price === undefined) {
      return NextResponse.json({ error: "İsim, süre ve fiyat alanları zorunludur." }, { status: 400 });
    }
    const duration = parseInt(durationMinutes, 10);
    const amount = parseFloat(price);
    if (!Number.isInteger(duration) || duration <= 0 || duration > 24 * 60 || !Number.isFinite(amount) || amount < 0) {
      return NextResponse.json({ error: "Süre 1–1440 dakika, fiyat 0 veya üzeri olmalıdır." }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        businessId: user.business.id,
        name,
        description: description || null,
        durationMinutes: duration,
        price: amount,
        image: image || null,
      },
    });

    // Link assigned employees — only this business's own staff.
    if (Array.isArray(employeeIds) && employeeIds.length > 0) {
      const own = await prisma.employee.findMany({
        where: { id: { in: employeeIds.filter((v: unknown) => typeof v === "string") }, businessId: user.business.id },
        select: { id: true },
      });
      for (const emp of own) {
        await prisma.employeeService.create({
          data: {
            employeeId: emp.id,
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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { id, name, description, durationMinutes, price, image, isActive, employeeIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Hizmet ID'si gereklidir." }, { status: 400 });
    }

    if (durationMinutes !== undefined) {
      const duration = parseInt(durationMinutes, 10);
      if (!Number.isInteger(duration) || duration <= 0 || duration > 24 * 60) {
        return NextResponse.json({ error: "Süre 1–1440 dakika olmalıdır." }, { status: 400 });
      }
    }
    if (price !== undefined && !(Number.isFinite(parseFloat(price)) && parseFloat(price) >= 0)) {
      return NextResponse.json({ error: "Fiyat 0 veya üzeri olmalıdır." }, { status: 400 });
    }

    const businessId = user.business.id;
    const updated = await prisma.$transaction(async (tx) => {
      const service = await tx.service.update({
        where: { id, businessId },
        data: {
          ...(name ? { name } : {}),
          ...(description !== undefined ? { description } : {}),
          ...(durationMinutes !== undefined ? { durationMinutes: parseInt(durationMinutes, 10) } : {}),
          ...(price !== undefined ? { price: parseFloat(price) } : {}),
          ...(image !== undefined ? { image } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      });

      // When given, `employeeIds` replaces who offers the service (only this business's own staff).
      if (Array.isArray(employeeIds)) {
        const own = await tx.employee.findMany({
          where: { id: { in: employeeIds.filter((v: unknown) => typeof v === "string") }, businessId },
          select: { id: true },
        });
        await tx.employeeService.deleteMany({ where: { serviceId: service.id } });
        if (own.length > 0) {
          await tx.employeeService.createMany({ data: own.map((e) => ({ employeeId: e.id, serviceId: service.id })) });
        }
      }

      return tx.service.findUniqueOrThrow({
        where: { id: service.id },
        include: { employeeServices: { include: { employee: true } } },
      });
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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Hizmet ID'si gereklidir." }, { status: 400 });
    }

    // Deleting cascades to the appointments that reference it, so a record with booking history is
    // kept; deactivating it hides it from new bookings instead.
    const bookings = await prisma.appointment.count({ where: { serviceId: id, businessId: user.business.id } });
    if (bookings > 0) {
      return NextResponse.json(
        { error: "Bu hizmete ait randevu kayıtları olduğu için silinemez (silmek geçmiş randevuları da siler). Bunun yerine hizmeti pasife alabilirsiniz.", code: "HAS_APPOINTMENTS" },
        { status: 409 }
      );
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
