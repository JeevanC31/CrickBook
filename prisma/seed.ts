import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = `${process.env.DATABASE_URL}`;

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding database...');
  
  // 1. Seed Shop Products
  await prisma.product.createMany({
    data: [
      { name: 'SG English Willow', price: 150.00, stock: 10, category: 'Bat', imageUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { name: 'Pro Helmet', price: 45.00, stock: 20, category: 'Protection' },
      { name: 'Leather Ball (Box of 6)', price: 30.00, stock: 50, category: 'Ball' }
    ],
    skipDuplicates: true,
  });

  // 2. Seed Turfs
  await prisma.turf.createMany({
    data: [
      { name: 'Green Arena Nets', location: '2.5 km away', pricePerHour: 25.00, netsAvailable: 3, imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' },
      { name: 'Stadium Pro Turf', location: '5.1 km away', pricePerHour: 40.00, netsAvailable: 1, imageUrl: 'https://images.unsplash.com/photo-1518605368461-1e12922349ce?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&q=80' }
    ],
    skipDuplicates: true,
  });

  // 3. Seed Coaches
  await prisma.coach.createMany({
    data: [
      { name: 'David Warner', specialty: 'Batting Coach', pricePerSession: 50.00, rating: 4.9, imageUrl: 'https://i.pravatar.cc/150?img=33' },
      { name: 'Brett Lee', specialty: 'Pace Bowling Coach', pricePerSession: 60.00, rating: 4.8, imageUrl: 'https://i.pravatar.cc/150?img=12' }
    ],
    skipDuplicates: true,
  });

  // 4. Seed Matches
  await prisma.match.createMany({
    data: [
      { title: 'Weekend League T20', location: 'Central Park Nets', startTime: new Date('2026-05-15T08:00:00Z'), endTime: new Date('2026-05-15T11:00:00Z') }
    ],
    skipDuplicates: true,
  });

  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
