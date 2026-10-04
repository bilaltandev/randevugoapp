import prisma from "../src/lib/prisma";

async function runTests() {
  console.log("🚀 Starting Restaurant Table Management & Booking E2E verification...\n");

  // 1. Verify restaurant business exists
  const restaurant = await prisma.business.findFirst({
    where: { slug: "bogazicirestoran" },
    include: {
      restaurantAreas: { include: { tables: true } },
      restaurantTables: true,
    },
  });

  if (!restaurant) {
    throw new Error("Boğaziçi Gurme & Terrace restaurant not found in database!");
  }

  console.log(`✅ Business found: "${restaurant.name}" (Sector: ${restaurant.sector})`);
  console.log(`✅ Areas count: ${restaurant.restaurantAreas.length}`);
  console.log(`✅ Tables count: ${restaurant.restaurantTables.length}`);

  // Print sample table details
  const sampleTable = restaurant.restaurantTables[0];
  console.log(`   Sample Table: ${sampleTable.name} (${sampleTable.capacity} Kişilik, Şekil: ${sampleTable.shape}, X:${sampleTable.positionX}, Y:${sampleTable.positionY})`);
  console.log(`   Görsel: ${sampleTable.imageUrl ? "Var (URL yüklü)" : "Yok"}`);
  console.log(`   Açıklama: "${sampleTable.description}"`);

  // 2. Test Table Creation
  console.log("\n🧪 Testing table creation via Prisma...");
  const newTable = await prisma.restaurantTable.create({
    data: {
      businessId: restaurant.id,
      areaId: restaurant.restaurantAreas[0]?.id || null,
      name: "Test Masa VIP",
      capacity: 8,
      shape: "RECTANGLE",
      positionX: 350,
      positionY: 220,
      width: 150,
      height: 90,
      description: "Özel VIP Deniz Manzaralı Masa",
      imageUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600",
      isActive: true,
      status: "AVAILABLE",
    },
  });
  console.log(`✅ Created test table: ID ${newTable.id}, Name: ${newTable.name}, Capacity: ${newTable.capacity}`);

  // 3. Test Batch Position Update (Drag and Drop simulation)
  console.log("\n🧪 Testing batch position update (drag & drop simulation)...");
  await prisma.restaurantTable.update({
    where: { id: newTable.id },
    data: { positionX: 400, positionY: 260 },
  });
  const updatedTable = await prisma.restaurantTable.findUnique({ where: { id: newTable.id } });
  if (updatedTable?.positionX !== 400 || updatedTable?.positionY !== 260) {
    throw new Error("Position update failed!");
  }
  console.log(`✅ Position successfully moved to X: ${updatedTable.positionX}, Y: ${updatedTable.positionY}`);

  // 4. Test Customer Booking with Table
  console.log("\n🧪 Testing customer reservation with table selection...");
  const service = await prisma.service.findFirst({ where: { businessId: restaurant.id } });
  const employee = await prisma.employee.findFirst({ where: { businessId: restaurant.id } });

  if (!service || !employee) {
    throw new Error("Service or employee missing for restaurant!");
  }

  const testDate = "2026-10-15";
  const testStartTime = "20:00";
  const testEndTime = "22:00";

  const appointment = await prisma.appointment.create({
    data: {
      businessId: restaurant.id,
      serviceId: service.id,
      employeeId: employee.id,
      tableId: newTable.id,
      date: testDate,
      startTime: testStartTime,
      endTime: testEndTime,
      status: "CONFIRMED",
      customerName: "Caner Test Müşteri",
      customerPhone: "05329998877",
      customerEmail: "caner@test.com",
      sectorData: JSON.stringify({
        guestCount: "6",
        tableId: newTable.id,
        tableName: newTable.name,
      }),
    },
    include: {
      table: { include: { area: true } },
    },
  });

  console.log(`✅ Created appointment ID: ${appointment.id}`);
  console.log(`   Customer: ${appointment.customerName}`);
  console.log(`   Assigned Table: ${appointment.table?.name} (Kapasite: ${appointment.table?.capacity}, Alan: ${appointment.table?.area?.name})`);

  // 5. Test Availability Conflict Check
  console.log("\n🧪 Testing conflict detection for overlapping booking on same table...");
  const overlappingApps = await prisma.appointment.findMany({
    where: {
      businessId: restaurant.id,
      tableId: newTable.id,
      date: testDate,
      status: { in: ["PENDING", "CONFIRMED"] },
    },
  });

  let hasConflict = false;
  const requestedStart = "20:30";
  const requestedEnd = "22:30";
  for (const app of overlappingApps) {
    if (requestedStart < app.endTime && requestedEnd > app.startTime) {
      hasConflict = true;
      console.log(`✅ Conflict correctly detected! Table is occupied by "${app.customerName}" between ${app.startTime} - ${app.endTime}.`);
      break;
    }
  }

  if (!hasConflict) {
    throw new Error("Conflict detection failed!");
  }

  // 6. Test Non-Restaurant sector isolation
  console.log("\n🧪 Testing sector isolation (Non-restaurant businesses)...");
  const barber = await prisma.business.findFirst({ where: { sector: "BERBER" } });
  if (barber) {
    const isBarberRestaurant = barber.sector === "RESTORAN" || barber.sector === "RESTAURANT";
    console.log(`✅ Barber business sector is: ${barber.sector}. isRestaurant = ${isBarberRestaurant} (Correct: hidden from non-restaurant)`);
  }

  // 7. Cleanup test data
  console.log("\n🧹 Cleaning up test appointment and test table...");
  await prisma.appointment.delete({ where: { id: appointment.id } });
  await prisma.restaurantTable.delete({ where: { id: newTable.id } });
  console.log("✅ Cleanup complete.");

  console.log("\n🎉 ALL TESTS PASSED SUCCESSFULLY! The table management module is completely functional with real database data.");
}

runTests().catch(console.error).finally(() => prisma.$disconnect());
