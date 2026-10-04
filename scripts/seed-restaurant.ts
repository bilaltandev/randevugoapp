import prisma from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Checking or creating restaurant business...");

  let user = await prisma.user.findUnique({
    where: { email: "restoran@randevugo.com" },
  });

  const hashedPassword = await bcrypt.hash("123456", 10);

  if (!user) {
    user = await prisma.user.create({
      data: {
        name: "Restoran İşletmecisi",
        email: "restoran@randevugo.com",
        password: hashedPassword,
        role: "BUSINESS_OWNER",
        phone: "05339998877",
      },
    });
  }

  let business = await prisma.business.findFirst({
    where: {
      OR: [
        { slug: "bogazicirestoran" },
        { userId: user.id },
      ],
    },
  });

  const now = new Date();
  const trialEnd = new Date(now);
  trialEnd.setDate(now.getDate() + 30);

  if (!business) {
    business = await prisma.business.create({
      data: {
        userId: user.id,
        name: "Boğaziçi Gurme & Terrace",
        slug: "bogazicirestoran",
        sector: "RESTORAN",
        description: "Boğaz manzarası eşliğinde Akdeniz mutfağı, taze deniz ürünleri ve seçkin şaraplar ile unutulmaz bir lezzet deneyimi.",
        logo: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=200&h=200&fit=crop",
        coverImage: "https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&h=500&fit=crop",
        phone: "0212 345 67 89",
        address: "Kuruçeşme Cad. No: 58/B, Beşiktaş",
        city: "İstanbul",
        whatsappNumber: "905339998877",
        isVerified: true,
        subscription: {
          create: {
            planType: "PRO",
            trialStartDate: now,
            trialEndDate: trialEnd,
            status: "active",
            paymentStatus: "paid",
            monthlyPrice: 149.0,
          },
        },
      },
    });
  } else {
    // Ensure sector is RESTORAN
    business = await prisma.business.update({
      where: { id: business.id },
      data: { sector: "RESTORAN" },
    });
  }

  // Ensure services exist
  const existingServices = await prisma.service.findMany({ where: { businessId: business.id } });
  if (existingServices.length === 0) {
    await prisma.service.createMany({
      data: [
        {
          businessId: business.id,
          name: "Akşam Yemeği Rezervasyonu",
          description: "Özel şef menüsü, a la carte lezzetler ve eşsiz Boğaz manzarası eşliğinde masa rezervasyonu.",
          durationMinutes: 120,
          price: 0,
        },
        {
          businessId: business.id,
          name: "VIP Teras & Kutlama Rezervasyonu",
          description: "Özel kutlama ve yıldönümleri için terasın en seçkin masasında karşılama ikramları ile rezervasyon.",
          durationMinutes: 150,
          price: 500,
        },
        {
          businessId: business.id,
          name: "Öğle Yemeği & İş Toplantısı",
          description: "Sessiz ve konforlu alanda iş yemekleri için hızlı servis menüsü.",
          durationMinutes: 90,
          price: 0,
        },
      ],
    });
  }

  // Ensure employees exist
  const existingEmployees = await prisma.employee.findMany({ where: { businessId: business.id } });
  if (existingEmployees.length === 0) {
    await prisma.employee.createMany({
      data: [
        {
          businessId: business.id,
          name: "Ali Kaptan",
          specialty: "Maitre d' & Şef Garson",
          phone: "05331112233",
          photo: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=200&h=200&fit=crop",
        },
        {
          businessId: business.id,
          name: "Selin Yılmaz",
          specialty: "Masa ve Salon Şefi",
          phone: "05332223344",
          photo: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop",
        },
      ],
    });
  }

  // Ensure WorkingHours exist
  const existingHours = await prisma.workingHour.findMany({ where: { businessId: business.id } });
  if (existingHours.length === 0) {
    const hoursData = [0, 1, 2, 3, 4, 5, 6].map((day) => ({
      businessId: business.id,
      dayOfWeek: day,
      isOpen: true,
      openTime: "12:00",
      closeTime: "23:30",
      breakStartTime: "16:00",
      breakEndTime: "17:00",
    }));
    await prisma.workingHour.createMany({ data: hoursData });
  }

  // Create Restaurant Areas
  const existingAreas = await prisma.restaurantArea.findMany({ where: { businessId: business.id } });
  let indoorArea = existingAreas.find((a) => a.name === "İç Mekan");
  let terraceArea = existingAreas.find((a) => a.name === "Teras");
  let gardenArea = existingAreas.find((a) => a.name === "Bahçe");

  if (!indoorArea) {
    indoorArea = await prisma.restaurantArea.create({
      data: { businessId: business.id, name: "İç Mekan", sortOrder: 1 },
    });
  }
  if (!terraceArea) {
    terraceArea = await prisma.restaurantArea.create({
      data: { businessId: business.id, name: "Teras", sortOrder: 2 },
    });
  }
  if (!gardenArea) {
    gardenArea = await prisma.restaurantArea.create({
      data: { businessId: business.id, name: "Bahçe", sortOrder: 3 },
    });
  }

  // Ensure Tables exist
  const existingTables = await prisma.restaurantTable.findMany({ where: { businessId: business.id } });
  if (existingTables.length === 0) {
    await prisma.restaurantTable.createMany({
      data: [
        // Teras masaları
        {
          businessId: business.id,
          areaId: terraceArea.id,
          name: "Masa 1",
          capacity: 2,
          shape: "ROUND",
          positionX: 80,
          positionY: 80,
          width: 80,
          height: 80,
          imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&h=400&fit=crop",
          description: "Deniz Manzaralı, gün batımı cephesi",
          isActive: true,
        },
        {
          businessId: business.id,
          areaId: terraceArea.id,
          name: "Masa 2",
          capacity: 4,
          shape: "SQUARE",
          positionX: 240,
          positionY: 80,
          width: 90,
          height: 90,
          imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
          description: "Deniz Manzaralı, ön cephe geniş masa",
          isActive: true,
        },
        {
          businessId: business.id,
          areaId: terraceArea.id,
          name: "Masa 3",
          capacity: 6,
          shape: "RECTANGLE",
          positionX: 420,
          positionY: 80,
          width: 140,
          height: 80,
          imageUrl: "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&h=400&fit=crop",
          description: "Teras VIP Geniş Grup Masası",
          isActive: true,
        },
        // İç Mekan masaları
        {
          businessId: business.id,
          areaId: indoorArea.id,
          name: "Masa 4",
          capacity: 2,
          shape: "ROUND",
          positionX: 100,
          positionY: 100,
          width: 80,
          height: 80,
          imageUrl: "https://images.unsplash.com/photo-1578474846511-04ba529f0b88?w=600&h=400&fit=crop",
          description: "Pencere Kenarı, romantik aydınlatma",
          isActive: true,
        },
        {
          businessId: business.id,
          areaId: indoorArea.id,
          name: "Masa 5",
          capacity: 4,
          shape: "SQUARE",
          positionX: 280,
          positionY: 100,
          width: 90,
          height: 90,
          imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&h=400&fit=crop",
          description: "Şömine Kenarı, huzurlu köşe",
          isActive: true,
        },
        {
          businessId: business.id,
          areaId: indoorArea.id,
          name: "Masa 6",
          capacity: 8,
          shape: "RECTANGLE",
          positionX: 460,
          positionY: 100,
          width: 160,
          height: 90,
          imageUrl: "https://images.unsplash.com/photo-1579027989536-b7b1f875659b?w=600&h=400&fit=crop",
          description: "Özel Salon, aile ve kutlama masası",
          isActive: true,
        },
        // Bahçe masaları
        {
          businessId: business.id,
          areaId: gardenArea.id,
          name: "Bahçe 1",
          capacity: 4,
          shape: "ROUND",
          positionX: 120,
          positionY: 120,
          width: 90,
          height: 90,
          imageUrl: "https://images.unsplash.com/photo-1537047902294-62a40c20a6ae?w=600&h=400&fit=crop",
          description: "Zeytin Ağacı Altı, açık hava",
          isActive: true,
        },
        {
          businessId: business.id,
          areaId: gardenArea.id,
          name: "Bahçe 2",
          capacity: 6,
          shape: "RECTANGLE",
          positionX: 300,
          positionY: 120,
          width: 130,
          height: 80,
          imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&h=400&fit=crop",
          description: "Bahçe Çardak Yanı",
          isActive: true,
        },
      ],
    });
  }

  console.log("Restaurant seed completed successfully!");
  console.log("Business Slug: bogazicirestoran");
  console.log("User Email: restoran@randevugo.com / 123456");
}

main().catch(console.error).finally(() => prisma.$disconnect());
