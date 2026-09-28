import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import SettingsClient from "./SettingsClient";

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const business = await prisma.business.findUnique({
    where: { id: user.business.id },
    include: {
      workingHours: {
        orderBy: { dayOfWeek: "asc" },
      },
    },
  });

  if (!business) return null;

  return (
    <div className="space-y-6">
      <SettingsClient initialBusiness={business} />
    </div>
  );
}
