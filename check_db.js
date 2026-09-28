const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const businesses = await prisma.business.findMany();
  console.log('Businesses count:', businesses.length);

  for (const b of businesses) {
    console.log(`\n=== Business: ${b.name} (${b.id}) ===`);
    const employees = await prisma.employee.findMany({ where: { businessId: b.id } });
    console.log('Employees:', employees.map(e => ({ id: e.id, name: e.name })));

    const workingHours = await prisma.workingHour.findMany({ where: { businessId: b.id } });
    console.log('WorkingHours:', workingHours.map(w => ({
      day: w.dayOfWeek,
      isOpen: w.isOpen,
      open: w.openTime,
      close: w.closeTime,
      breakStart: w.breakStartTime,
      breakEnd: w.breakEndTime,
      employeeId: w.employeeId
    })));

    const appointments = await prisma.appointment.findMany({
      where: { businessId: b.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });
    console.log('Recent appointments:', appointments.map(a => ({
      id: a.id,
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
      name: a.customerName,
      status: a.status,
      employeeId: a.employeeId,
      notes: a.notes
    })));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
