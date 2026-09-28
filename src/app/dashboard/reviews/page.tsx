import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ReviewsClient from "./ReviewsClient";

export default async function ReviewsPage() {
  const user = await getCurrentUser();
  if (!user || !user.business) return null;

  const reviews = await prisma.review.findMany({
    where: { businessId: user.business.id },
    include: {
      appointment: {
        include: { service: true },
      },
      employee: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <ReviewsClient
        businessId={user.business.id}
        initialReviews={reviews}
      />
    </div>
  );
}
