import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, setSessionCookie } from "@/lib/auth";

function slugify(text: string): string {
  const trMap: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u"
  };
  return text
    .split("")
    .map((c) => trMap[c] || c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const SECTOR_DEFAULTS: Record<string, { services: Array<{ name: string; duration: number; price: number; desc: string }>; theme: string }> = {
  BERBER: {
    theme: "amber",
    services: [
      { name: "Klasik Saç Kesimi", duration: 30, price: 350, desc: "Yüz hatlarına uygun profesyonel kesim ve fön." },
      { name: "Sakal Tıraşı & Bakım", duration: 20, price: 200, desc: "Sıcak havlu kompresi ve ustura tıraşı." },
      { name: "Saç & Sakal Komple Bakım", duration: 50, price: 500, desc: "Komple bakım, yıkama ve canlandırıcı maske." }
    ]
  },
  GUZELLIK: {
    theme: "rose",
    services: [
      { name: "Medikal Cilt Bakımı", duration: 60, price: 850, desc: "Derinlemesine temizlik, serum ve maske terapisi." },
      { name: "Klasik Manikür & Pedikür", duration: 45, price: 450, desc: "Tırnak bakımı, peeling ve el masajı." },
      { name: "Lazer Epilasyon Seansı", duration: 40, price: 700, desc: "Son teknoloji acısız buz başlıklı uygulama." }
    ]
  },
  RESTORAN: {
    theme: "emerald",
    services: [
      { name: "Akşam Yemeği Rezervasyonu (1-4 Kişi)", duration: 90, price: 0, desc: "Şefin özel menüsü eşliğinde masa rezervasyonu." },
      { name: "VIP Salon / Grup Rezervasyonu", duration: 120, price: 0, desc: "Özel kutlama ve iş yemekleri için masa hazırlığı." }
    ]
  },
  KLINIK: {
    theme: "cyan",
    services: [
      { name: "Uzman Doktor Muayenesi", duration: 30, price: 1200, desc: "Detaylı anamnez, fiziksel muayene ve tedavi planı." },
      { name: "Kontrol Muayenesi", duration: 20, price: 0, desc: "Tedavi sonrası takip ve kontrol görüşmesi." }
    ]
  },
  OTO_SERVIS: {
    theme: "blue",
    services: [
      { name: "Periyodik Araç Bakımı", duration: 60, price: 1500, desc: "Motor yağı, filtreler, fren ve sıvı kontrolleri." },
      { name: "Detaylı Ekspertiz & Check-Up", duration: 45, price: 1000, desc: "Bilgisayarlı arıza tespiti ve alt takım incelemesi." }
    ]
  },
  DIGER: {
    theme: "indigo",
    services: [
      { name: "Birebir Danışmanlık", duration: 45, price: 750, desc: "Kişiye özel profesyonel seans ve planlama." }
    ]
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, phone, businessName, sector = "BERBER", address, city = "İstanbul", whatsappNumber } = body;

    if (!name || !email || !password || !businessName) {
      return NextResponse.json(
        { error: "Lütfen ad soyad, e-posta, şifre ve işletme adını doldurunuz." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu e-posta adresi ile zaten bir hesap mevcut." },
        { status: 400 }
      );
    }

    // Generate unique slug
    let baseSlug = slugify(businessName) || "isletme";
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.business.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const hashedPassword = await hashPassword(password);
    const now = new Date();
    const trialEnd = new Date(now);
    trialEnd.setDate(now.getDate() + 3); // 3 days free trial

    // Transaction for atomic creation
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        phone: phone || null,
        role: "BUSINESS_OWNER",
        businesses: {
          create: {
            name: businessName,
            slug,
            sector,
            description: `${businessName} olarak kaliteli hizmet anlayışımızla yanınızdayız. Randevunuzu hemen online oluşturabilirsiniz.`,
            phone: phone || "0850 000 00 00",
            address: address || "Merkez Mah. No: 1",
            city: city || "İstanbul",
            whatsappNumber: whatsappNumber || phone || null,
            subscription: {
              create: {
                planType: "TRIAL",
                trialStartDate: now,
                trialEndDate: trialEnd,
                status: "trial",
                paymentStatus: "paid",
                monthlyPrice: 89.0,
              },
            },
            notifications: {
              create: {
                title: "RandevuGo'ya Hoş Geldiniz! 🎉",
                message: "3 günlük ücretsiz deneme süreniz başladı. Hemen hizmetlerinizi ve sayfanızı özelleştirin.",
                type: "SYSTEM",
                link: "/dashboard",
              },
            },
          },
        },
      },
      include: {
        businesses: {
          include: {
            subscription: true,
          },
        },
      },
    });

    const business = user.businesses[0];

    // Create default working hours (Mon-Sat 09:00 - 19:00)
    for (let day = 0; day <= 6; day++) {
      await prisma.workingHour.create({
        data: {
          businessId: business.id,
          dayOfWeek: day,
          isOpen: day !== 0,
          openTime: "09:00",
          closeTime: "19:00",
          breakStartTime: "13:00",
          breakEndTime: "14:00",
        },
      });
    }

    // Create initial employee (Owner)
    const ownerEmployee = await prisma.employee.create({
      data: {
        businessId: business.id,
        name: name,
        specialty: "İşletme Sahibi & Uzman",
        phone: phone || null,
        email: email,
      },
    });

    // Create starter services based on sector
    const sectorPreset = SECTOR_DEFAULTS[sector] || SECTOR_DEFAULTS.DIGER;
    for (const s of sectorPreset.services) {
      const createdService = await prisma.service.create({
        data: {
          businessId: business.id,
          name: s.name,
          durationMinutes: s.duration,
          price: s.price,
          description: s.desc,
        },
      });

      await prisma.employeeService.create({
        data: {
          employeeId: ownerEmployee.id,
          serviceId: createdService.id,
        },
      });
    }

    // Create default Page Blocks
    const defaultBlocks = [
      {
        id: "hero-1",
        type: "Hero",
        title: business.name,
        subtitle: "Hızlı, kolay ve sıra beklemeden online randevunuzu oluşturun.",
        badge: "Online Rezervasyon Açık",
        ctaText: "Hemen Randevu Al",
        align: "center",
      },
      {
        id: "about-1",
        type: "About",
        title: "Hakkımızda",
        content: `${business.name} olarak müşterilerimize en üst düzeyde kaliteli ve güvenilir hizmet sunmaktan mutluluk duyuyoruz.`,
        stats: [
          { label: "Müşteri Memnuniyeti", value: "%100" },
          { label: "Kolay Randevu", value: "7/24" },
        ],
      },
      {
        id: "services-1",
        type: "Services",
        title: "Hizmetlerimiz",
        subtitle: "Size en uygun hizmeti seçerek kolayca randevunuzu planlayın.",
        showPrice: true,
        showDuration: true,
      },
      {
        id: "staff-1",
        type: "Staff",
        title: "Ekibimiz",
        subtitle: "Uzman kadromuzla tanışın.",
      },
      {
        id: "booking-1",
        type: "Booking",
        title: "Online Rezervasyon",
        subtitle: "Uygun gün ve saati seçin, randevunuzu anında onaylayalım.",
      },
      {
        id: "location-1",
        type: "Location",
        title: "İletişim & Konum",
        address: business.address + ", " + business.city,
        phone: business.phone,
        whatsapp: business.whatsappNumber,
      },
    ];

    await prisma.page.create({
      data: {
        businessId: business.id,
        blocksJson: JSON.stringify(defaultBlocks),
        themeColor: sectorPreset.theme,
        font: "Inter",
        isPublished: true,
        seoTitle: `${business.name} - Online Randevu`,
        seoDescription: `${business.name} için 7/24 online rezervasyon yapın.`,
      },
    });

    // Set auth session
    await setSessionCookie({
      userId: user.id,
      email: user.email,
      role: user.role,
      businessId: business.id,
      businessSlug: business.slug,
    });

    return NextResponse.json({
      success: true,
      businessSlug: business.slug,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        business,
      },
    });
  } catch (error: unknown) {
    console.error("Register API error:", error);
    return NextResponse.json(
      { error: "Kayıt işlemi sırasında bir hata meydana geldi." },
      { status: 500 }
    );
  }
}
