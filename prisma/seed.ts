import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Veritabanı seed işlemi başlatılıyor...");

  // Clean existing data
  await prisma.review.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employeeService.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.service.deleteMany();
  await prisma.category.deleteMany();
  await prisma.workingHour.deleteMany();
  await prisma.page.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.business.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("123456", 10);

  // 1. Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Sistem Yöneticisi",
      email: "admin@randevugo.com",
      password: hashedPassword,
      role: "ADMIN",
      phone: "05550000000",
    },
  });

  // 2. Ahmet Berber - Flagship Business
  const barberUser = await prisma.user.create({
    data: {
      name: "Ahmet Berber",
      email: "ahmet@berber.com",
      password: hashedPassword,
      role: "BUSINESS_OWNER",
      phone: "05321112233",
    },
  });

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(now.getDate() + 3);

  const barberBusiness = await prisma.business.create({
    data: {
      userId: barberUser.id,
      name: "Ahmet Berber & Styling Club",
      slug: "ahmetberber",
      sector: "BERBER",
      description: "15 yıllık tecrübeyle modern saç tasarımları, sakal sanatı ve saç bakımında Beşiktaş'ın öncü erkek kuaförü.",
      logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=200&h=200&fit=crop&crop=faces",
      coverImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&h=400&fit=crop",
      phone: "0212 259 88 99",
      address: "Sinanpaşa Mah. Şair Nedim Cad. No: 42/A, Beşiktaş",
      city: "İstanbul",
      whatsappNumber: "905321112233",
      isVerified: true,
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
        create: [
          {
            title: "Hoş Geldiniz!",
            message: "RandevuGo'ya hoş geldiniz! 3 günlük ücretsiz deneme süreniz başladı.",
            type: "SYSTEM",
            link: "/dashboard/subscription",
          },
          {
            title: "Yeni Rezervasyon",
            message: "Tolga Akın yarın 14:30 için Saç Kesimi randevusu aldı.",
            type: "APPOINTMENT",
            link: "/dashboard/appointments",
          },
        ],
      },
    },
  });

  // Services
  const s1 = await prisma.service.create({
    data: {
      businessId: barberBusiness.id,
      name: "Saç Kesimi & Yıkama",
      description: "Yüz tipine özel modern makas ve makine kesimi, organik şampuan ile yıkama ve fön.",
      durationMinutes: 30,
      price: 400.0,
      image: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400&h=300&fit=crop",
    },
  });

  const s2 = await prisma.service.create({
    data: {
      businessId: barberBusiness.id,
      name: "Sakal Tıraşı & Sıcak Havlu",
      description: "Klasik ustura tıraşı, buhar ve sıcak havlu terapisi, besleyici sakal yağı masajı.",
      durationMinutes: 20,
      price: 250.0,
      image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop",
    },
  });

  const s3 = await prisma.service.create({
    data: {
      businessId: barberBusiness.id,
      name: "Komple VIP Bakım Paketi",
      description: "Saç kesimi, sakal tasarımı, siyah nokta kil maskesi ve canlandırıcı saç toniği.",
      durationMinutes: 60,
      price: 750.0,
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=300&fit=crop",
    },
  });

  const s4 = await prisma.service.create({
    data: {
      businessId: barberBusiness.id,
      name: "Saç Boyama & Beyaz Kapatma",
      description: "Doğal tonlarda beyaz kamufle edici boya uygulaması ve renk koruyucu bakım.",
      durationMinutes: 45,
      price: 600.0,
      image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400&h=300&fit=crop",
    },
  });

  // Employees
  const emp1 = await prisma.employee.create({
    data: {
      businessId: barberBusiness.id,
      name: "Ahmet Demir",
      specialty: "Kurucu & Baş Stilist",
      photo: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=faces",
      phone: "05321112233",
      email: "ahmet@berber.com",
    },
  });

  const emp2 = await prisma.employee.create({
    data: {
      businessId: barberBusiness.id,
      name: "Can Kaya",
      specialty: "Sakal & Fade Uzmanı",
      photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=faces",
      phone: "05332223344",
      email: "can@berber.com",
    },
  });

  const emp3 = await prisma.employee.create({
    data: {
      businessId: barberBusiness.id,
      name: "Murat Özkan",
      specialty: "Klasik Kesim & Çocuk Tasarım",
      photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=faces",
      phone: "05354445566",
      email: "murat@berber.com",
    },
  });

  // Assign employee services
  for (const emp of [emp1, emp2, emp3]) {
    for (const s of [s1, s2, s3, s4]) {
      await prisma.employeeService.create({
        data: {
          employeeId: emp.id,
          serviceId: s.id,
        },
      });
    }
  }

  // Working Hours (Mon - Sat: 09:00 - 20:00, Sun: Closed)
  for (let day = 0; day <= 6; day++) {
    await prisma.workingHour.create({
      data: {
        businessId: barberBusiness.id,
        dayOfWeek: day,
        isOpen: day !== 0, // Sunday closed
        openTime: "09:00",
        closeTime: "20:00",
        breakStartTime: "13:00",
        breakEndTime: "14:00",
      },
    });
  }

  // Customers
  const c1 = await prisma.customer.create({
    data: {
      businessId: barberBusiness.id,
      name: "Mehmet Yılmaz",
      phone: "05301234567",
      email: "mehmet@gmail.com",
      notes: "Saç dipleri hassas, sert wax tercih etmiyor.",
      totalAppointments: 4,
      totalSpent: 1600.0,
    },
  });

  const c2 = await prisma.customer.create({
    data: {
      businessId: barberBusiness.id,
      name: "Tolga Akın",
      phone: "05429876543",
      email: "tolga@gmail.com",
      notes: "Daimi müşteri, orta fade kesim istiyor.",
      totalAppointments: 2,
      totalSpent: 800.0,
    },
  });

  const c3 = await prisma.customer.create({
    data: {
      businessId: barberBusiness.id,
      name: "Burak Çetin",
      phone: "05367778899",
      email: "burak@gmail.com",
      totalAppointments: 1,
      totalSpent: 750.0,
    },
  });

  // Appointments
  const todayStr = now.toISOString().split("T")[0];
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split("T")[0];

  const appt1 = await prisma.appointment.create({
    data: {
      businessId: barberBusiness.id,
      customerId: c1.id,
      employeeId: emp1.id,
      serviceId: s1.id,
      date: todayStr,
      startTime: "10:30",
      endTime: "11:00",
      status: "COMPLETED",
      customerName: c1.name,
      customerPhone: c1.phone,
      customerEmail: c1.email,
      notes: "Saat tam 10:30'da orada olacağım.",
      price: s1.price,
    },
  });

  const appt2 = await prisma.appointment.create({
    data: {
      businessId: barberBusiness.id,
      customerId: c2.id,
      employeeId: emp2.id,
      serviceId: s2.id,
      date: todayStr,
      startTime: "14:00",
      endTime: "14:20",
      status: "CONFIRMED",
      customerName: c2.name,
      customerPhone: c2.phone,
      notes: "Sıcak havlu bakımı dahil.",
      price: s2.price,
    },
  });

  const appt3 = await prisma.appointment.create({
    data: {
      businessId: barberBusiness.id,
      customerId: c3.id,
      employeeId: emp1.id,
      serviceId: s3.id,
      date: tomorrowStr,
      startTime: "16:00",
      endTime: "17:00",
      status: "PENDING",
      customerName: c3.name,
      customerPhone: c3.phone,
      notes: "Düğün öncesi komple bakım.",
      price: s3.price,
    },
  });

  // Reviews
  await prisma.review.create({
    data: {
      businessId: barberBusiness.id,
      customerId: c1.id,
      appointmentId: appt1.id,
      employeeId: emp1.id,
      rating: 5,
      comment: "Ahmet Bey gerçekten işinin ehli. Yıllardır Beşiktaş'ta berber arıyordum, sonunda buldum. Temiz, hijyenik ve randevu saatinde asla bekletilmiyorsunuz.",
      customerName: c1.name,
      businessReply: "Çok teşekkürler Mehmet Bey, her zaman bekleriz!",
      replyDate: new Date(),
    },
  });

  // Custom Page Blocks (JSON)
  const defaultBlocks = [
    {
      id: "hero-1",
      type: "Hero",
      title: "Ahmet Berber & Styling Club",
      subtitle: "Geleneksel ustura zanaatı ve modern saç tasarımının buluştuğu nokta.",
      badge: "Beşiktaş'ın 1 Numaralı Erkek Kuaförü",
      ctaText: "Hemen Randevu Al",
      ctaSecondaryText: "Hizmetlerimizi İncele",
      bgImage: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1600&h=800&fit=crop",
      align: "center",
      showRatingBadge: true,
      rating: "4.9 (180+ Değerlendirme)",
    },
    {
      id: "about-1",
      type: "About",
      title: "Hakkımızda",
      content: "2011 yılından bu yana Beşiktaş'ta erkek bakımına modern ve kişiye özel bir soluk getiriyoruz. Hijyen standartlarımız, birinci sınıf saç bakım ürünlerimiz ve deneyimli stilistlerimizle kendinizi özel hissedeceğiniz bir deneyim sunuyoruz.",
      image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=600&fit=crop",
      stats: [
        { label: "Yıllık Deneyim", value: "15+" },
        { label: "Mutlu Müşteri", value: "10,000+" },
        { label: "Uzman Stilist", value: "3" },
        { label: "Müşteri Memnuniyeti", value: "%99" },
      ],
    },
    {
      id: "services-1",
      type: "Services",
      title: "Hizmetlerimiz & Fiyatlar",
      subtitle: "İhtiyacınıza en uygun bakım hizmetini seçin ve saniyeler içinde randevu oluşturun.",
      showPrice: true,
      showDuration: true,
    },
    {
      id: "staff-1",
      type: "Staff",
      title: "Uzman Ekibimiz",
      subtitle: "Alanında uzman ve güler yüzlü stilistlerimizle tanışın.",
    },
    {
      id: "booking-1",
      type: "Booking",
      title: "Online Rezervasyon",
      subtitle: "Adım adım kolayca randevunuzu planlayın, sıra beklemeden bakımınızı yaptırın.",
    },
    {
      id: "gallery-1",
      type: "Gallery",
      title: "Salondan Kareler",
      images: [
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=600&h=400&fit=crop",
        "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=600&h=400&fit=crop",
      ],
    },
    {
      id: "reviews-1",
      type: "Reviews",
      title: "Müşteri Değerlendirmeleri",
      subtitle: "RandevuGo üzerinden randevusunu tamamlayan gerçek müşterilerimizin yorumları.",
    },
    {
      id: "location-1",
      type: "Location",
      title: "İletişim & Ulaşım",
      address: "Sinanpaşa Mah. Şair Nedim Cad. No: 42/A, Beşiktaş / İstanbul",
      phone: "0212 259 88 99",
      whatsapp: "905321112233",
      workingHoursText: "Pazartesi - Cumartesi: 09:00 - 20:00 (Pazar Kapalı)",
    },
  ];

  await prisma.page.create({
    data: {
      businessId: barberBusiness.id,
      blocksJson: JSON.stringify(defaultBlocks),
      themeColor: "amber",
      font: "Inter",
      isPublished: true,
      seoTitle: "Ahmet Berber & Styling Club - Beşiktaş Online Randevu",
      seoDescription: "Beşiktaş'ın en gözde erkek kuaföründen 7/24 online randevu alın. Saç kesimi, sakal tıraşı ve komple bakım.",
    },
  });

  // 3. Other businesses for sector variety:
  // Aura Beauty (Güzellik Merkezi)
  const beautyUser = await prisma.user.create({
    data: {
      name: "Selin Yıldız",
      email: "selin@aura.com",
      password: hashedPassword,
      role: "BUSINESS_OWNER",
      phone: "05351112233",
    },
  });

  const beautyBusiness = await prisma.business.create({
    data: {
      userId: beautyUser.id,
      name: "Aura Güzellik & Estetik",
      slug: "auraguzellik",
      sector: "GUZELLIK",
      description: "Medikal cilt bakımı, lazer epilasyon, ipek kirpik ve kalıcı makyaj uygulamaları.",
      logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200&h=200&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&h=400&fit=crop",
      phone: "0216 411 22 33",
      address: "Bağdat Caddesi No: 214/4, Kadıköy",
      city: "İstanbul",
      whatsappNumber: "905351112233",
      subscription: {
        create: {
          planType: "PRO",
          trialStartDate: now,
          trialEndDate: trialEnd,
          subscriptionStartDate: now,
          subscriptionEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          status: "active",
          paymentStatus: "paid",
          monthlyPrice: 89.0,
        },
      },
    },
  });

  await prisma.service.create({
    data: {
      businessId: beautyBusiness.id,
      name: "Hydrafacial Medikal Cilt Bakımı",
      description: "Derinlemesine gözenek temizliği, hyaluronik asit nem takviyesi ve LED terapi.",
      durationMinutes: 60,
      price: 950.0,
      image: "https://images.unsplash.com/photo-1512290900672-1f41d9c7d0d0?w=400&h=300&fit=crop",
    },
  });

  await prisma.employee.create({
    data: {
      businessId: beautyBusiness.id,
      name: "Selin Yıldız",
      specialty: "Uzman Estetisyen",
      photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
    },
  });

  console.log("✅ Seed işlemi başarıyla tamamlandı!");
  console.log("👉 Ahmet Berber Giriş: ahmet@berber.com / 123456");
  console.log("👉 Admin Giriş: admin@randevugo.com / 123456");
  console.log("👉 Randevu Sayfası: http://localhost:3000/ahmetberber");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
