const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.turfBooking.count();
  const bookings = await prisma.turfBooking.findMany({
    include: { turf: true, user: true }
  });
  console.log('Total bookings:', count);
  console.log('Bookings details:', JSON.stringify(bookings, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
