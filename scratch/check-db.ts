import { prisma } from '../src/lib/prisma';

async function main() {
  try {
    const count = await prisma.turfBooking.count();
    const bookings = await prisma.turfBooking.findMany({
      include: { 
        turf: { select: { name: true } }, 
        user: { select: { name: true, email: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('--- Database Check ---');
    console.log('Total bookings in DB:', count);
    if (count > 0) {
      console.log('Latest booking details:');
      console.log(JSON.stringify(bookings[0], null, 2));
    }
  } catch (e) {
    console.error('DB Check failed:', e);
  }
}

main();
