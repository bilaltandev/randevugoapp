import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getSupportAgent } from "@/lib/support";
import SupportBusinessClient from "./SupportBusinessClient";

export const dynamic = "force-dynamic";

export default async function SupportBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const agent = await getSupportAgent();
  if (!agent) return null;

  const { id } = await params;
  const business = await prisma.business.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true, createdAt: true } },
      subscription: true,
      _count: { select: { appointments: true, services: true, employees: true, customers: true } },
      supportTickets: {
        orderBy: { updatedAt: "desc" },
        take: 20,
        select: { id: true, subject: true, status: true, priority: true, updatedAt: true },
      },
      appointments: {
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          customerName: true,
          date: true,
          startTime: true,
          status: true,
          service: { select: { name: true } },
        },
      },
    },
  });
  if (!business) notFound();

  const sub = business.subscription;
  return (
    <SupportBusinessClient
      business={{
        id: business.id,
        name: business.name,
        slug: business.slug,
        sector: business.sector,
        phone: business.phone,
        address: business.address,
        city: business.city,
        isActive: business.isActive,
        createdAt: business.createdAt.toISOString(),
        ownerName: business.user.name,
        ownerEmail: business.user.email,
        ownerPhone: business.user.phone,
        subscriptionStatus: sub?.status ?? null,
        subscriptionPlan: sub?.planType ?? null,
        trialEnd: sub?.trialEndDate?.toISOString() ?? null,
        subscriptionEnd: (sub?.status === "active" ? sub.subscriptionEndDate : sub?.trialEndDate)?.toISOString() ?? null,
        counts: business._count,
      }}
      tickets={business.supportTickets.map((t) => ({ ...t, updatedAt: t.updatedAt.toISOString() }))}
      recentAppointments={business.appointments.map((a) => ({
        id: a.id,
        customerName: a.customerName,
        date: a.date,
        startTime: a.startTime,
        status: a.status,
        serviceName: a.service?.name ?? null,
      }))}
    />
  );
}
