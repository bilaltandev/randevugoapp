import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { name: true, email: true, phone: true },
  });
  if (!user) return null;

  return <ProfileClient initialUser={user} />;
}
