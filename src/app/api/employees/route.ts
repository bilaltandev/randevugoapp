import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { PERSON_STAFF_LIMIT, planOf } from "@/lib/plans";
import { removeMember } from "@/lib/teamInvites";
import { subscriptionLock } from "@/lib/subscriptionAccess";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const rows = await prisma.employee.findMany({
      where: { businessId: user.business.id },
      include: {
        employeeServices: {
          include: { service: true },
        },
        user: { select: { email: true } },
        teamInvites: {
          where: { acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
          select: { expiresAt: true },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Team status per record: `memberEmail` once someone joined through an invite, else the open invite's expiry.
    const employees = rows.map(({ user: member, teamInvites, ...employee }) => ({
      ...employee,
      userId: undefined, // internal account id; not needed by clients
      memberEmail: member?.email ?? null,
      inviteExpiresAt: member ? null : (teamInvites[0]?.expiresAt ?? null),
    }));

    return NextResponse.json({
      employees,
      plan: planOf(user.business.subscription),
      memberLimit: user.business.subscription?.memberLimit ?? 5,
    });
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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { name, specialty, photo, phone, email, serviceIds } = await req.json();

    if (!name || !specialty) {
      return NextResponse.json({ error: "İsim ve uzmanlık alanı zorunludur." }, { status: 400 });
    }

    // PERSON plan: one person takes the bookings.
    if (planOf(user.business.subscription) === "PERSON") {
      const count = await prisma.employee.count({ where: { businessId: user.business.id } });
      if (count >= PERSON_STAFF_LIMIT) {
        return NextResponse.json(
          { error: "Person planında yalnızca bir çalışan olabilir. Ekip kurmak için Team planına geçin.", code: "PLAN_LIMIT" },
          { status: 403 }
        );
      }
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

    // Link only this business's own services.
    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      const own = await prisma.service.findMany({
        where: { id: { in: serviceIds.filter((v: unknown) => typeof v === "string") }, businessId: user.business.id },
        select: { id: true },
      });
      for (const svc of own) {
        await prisma.employeeService.create({
          data: {
            employeeId: employee.id,
            serviceId: svc.id,
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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { id, name, specialty, photo, phone, email, isActive, serviceIds } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Çalışan ID'si gereklidir." }, { status: 400 });
    }

    const businessId = user.business.id;
    const updated = await prisma.$transaction(async (tx) => {
      const employee = await tx.employee.update({
        where: { id, businessId },
        data: {
          ...(name ? { name } : {}),
          ...(specialty ? { specialty } : {}),
          ...(photo !== undefined ? { photo } : {}),
          ...(phone !== undefined ? { phone } : {}),
          ...(email !== undefined ? { email } : {}),
          ...(isActive !== undefined ? { isActive } : {}),
        },
      });

      // When given, `serviceIds` replaces the employee's services (only this business's own services).
      if (Array.isArray(serviceIds)) {
        const own = await tx.service.findMany({
          where: { id: { in: serviceIds.filter((v: unknown) => typeof v === "string") }, businessId },
          select: { id: true },
        });
        await tx.employeeService.deleteMany({ where: { employeeId: employee.id } });
        if (own.length > 0) {
          await tx.employeeService.createMany({ data: own.map((s) => ({ employeeId: employee.id, serviceId: s.id })) });
        }
      }

      return tx.employee.findUniqueOrThrow({
        where: { id: employee.id },
        include: { employeeServices: { include: { service: true } } },
      });
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
    const locked = subscriptionLock(user.business.subscription);
    if (locked) return locked;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Çalışan ID'si gereklidir." }, { status: 400 });
    }

    // Deleting cascades to the appointments that reference it, so a record with booking history is
    // kept; deactivating it hides it from new bookings instead.
    const bookings = await prisma.appointment.count({ where: { employeeId: id, businessId: user.business.id } });
    if (bookings > 0) {
      return NextResponse.json(
        { error: "Bu çalışana ait randevu kayıtları olduğu için silinemez (silmek geçmiş randevuları da siler). Bunun yerine çalışanı pasife alabilirsiniz.", code: "HAS_APPOINTMENTS" },
        { status: 409 }
      );
    }

    // A member linked to this record leaves the team with it (account and sessions end).
    await removeMember(user.business.id, id);
    await prisma.employee.delete({
      where: { id, businessId: user.business.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE employee error:", error);
    return NextResponse.json({ error: "Çalışan silinirken hata oluştu." }, { status: 500 });
  }
}
