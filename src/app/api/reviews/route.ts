import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET: List reviews for business
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    let targetBusinessId = businessId;

    if (!targetBusinessId) {
      const user = await getCurrentUser();
      if (!user || !user.business) {
        return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
      }
      targetBusinessId = user.business.id;
    }

    const reviews = await prisma.review.findMany({
      where: {
        businessId: targetBusinessId,
        isApproved: true,
      },
      include: {
        appointment: {
          include: { service: true },
        },
        employee: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const averageRating =
      reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "5.0";

    return NextResponse.json({ reviews, averageRating, totalReviews: reviews.length });
  } catch (error) {
    console.error("GET reviews error:", error);
    return NextResponse.json({ error: "Yorumlar alınırken hata oluştu." }, { status: 500 });
  }
}

// POST: Submit a verified review (Customer)
export async function POST(req: Request) {
  try {
    const { appointmentId, rating, comment, customerName } = await req.json();

    if (!appointmentId || !rating || !comment) {
      return NextResponse.json(
        { error: "Lütfen puan ve yorum alanlarını eksiksiz doldurunuz." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { review: true },
    });

    if (!appointment) {
      return NextResponse.json({ error: "Geçersiz randevu kaydı." }, { status: 404 });
    }

    if (appointment.review) {
      return NextResponse.json(
        { error: "Bu randevu için zaten bir değerlendirme yapılmış." },
        { status: 400 }
      );
    }

    // Only allow review if appointment is completed or confirmed
    if (appointment.status === "CANCELLED") {
      return NextResponse.json(
        { error: "İptal edilen randevular için yorum bırakılamaz." },
        { status: 400 }
      );
    }

    const review = await prisma.review.create({
      data: {
        businessId: appointment.businessId,
        customerId: appointment.customerId,
        appointmentId: appointment.id,
        employeeId: appointment.employeeId,
        rating: Math.min(5, Math.max(1, parseInt(rating, 10))),
        comment,
        customerName: customerName || appointment.customerName,
      },
    });

    // Notify business
    await prisma.notification.create({
      data: {
        businessId: appointment.businessId,
        title: "Yeni Müşteri Değerlendirmesi! ⭐",
        message: `${customerName || appointment.customerName} ${rating} yıldız verdi: "${comment.slice(0, 50)}..."`,
        type: "REVIEW",
        link: "/dashboard/reviews",
      },
    });

    return NextResponse.json({
      success: true,
      review,
      message: "Değerlendirmeniz için teşekkür ederiz!",
    });
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json({ error: "Yorum gönderilirken hata oluştu." }, { status: 500 });
  }
}

// PATCH: Business owner reply
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.business) {
      return NextResponse.json({ error: "Yetkisiz erişim." }, { status: 401 });
    }

    const { id, businessReply } = await req.json();

    if (!id || !businessReply) {
      return NextResponse.json({ error: "Yorum ID ve cevap metni zorunludur." }, { status: 400 });
    }

    const updated = await prisma.review.update({
      where: {
        id,
        businessId: user.business.id,
      },
      data: {
        businessReply,
        replyDate: new Date(),
      },
    });

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error("PATCH review error:", error);
    return NextResponse.json({ error: "Cevap eklenirken hata oluştu." }, { status: 500 });
  }
}
