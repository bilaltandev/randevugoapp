import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ReviewFormClient from "./ReviewFormClient";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ appointmentId: string }>;
}) {
  const { appointmentId } = await params;

  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      business: true,
      service: true,
      employee: true,
      review: true,
    },
  });

  if (!appointment) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/90 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
        <ReviewFormClient appointment={appointment} />
      </div>
    </div>
  );
}
