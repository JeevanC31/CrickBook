const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- USERS ---');
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true }
  });
  console.table(users);

  console.log('\n--- BOOKINGS ---');
  const bookings = await prisma.turfBooking.findMany({
    include: { 
      turf: { select: { name: true } }, 
      user: { select: { name: true } } 
    }
  });
  console.table(bookings.map(b => ({
    id: b.id,
    user: b.user?.name || 'Unknown',
    userId: b.userId,
    turf: b.turf?.name || 'Unknown',
    time: b.startTime,
    guests: b.guests
  })));
}

main().catch(console.error).finally(() => prisma.$disconnect());
