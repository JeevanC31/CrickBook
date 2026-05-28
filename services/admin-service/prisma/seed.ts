import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database with sample data...');

  // ── Categories ────────────────────────────────────────────────
  await prisma.category.createMany({
    data: [
      { name: 'Bat' },
      { name: 'Ball' },
      { name: 'Protection' },
      { name: 'Clothing' },
      { name: 'Accessories' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Categories seeded');

  // ── Products ─────────────────────────────────────────────────
  await prisma.product.createMany({
    data: [
      { name: 'SG English Willow Bat', description: 'Professional grade English willow bat used by top cricketers', price: 4500, stock: 12, category: 'Bat', imageUrl: 'https://images.unsplash.com/photo-1624718600280-91f2c4f91da7?w=400', imageUrls: '["https://images.unsplash.com/photo-1624718600280-91f2c4f91da7?w=400"]' },
      { name: 'Kookaburra Pace Elite', description: 'High-performance all-rounder bat with extended sweet spot', price: 3200, stock: 8, category: 'Bat', imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400', imageUrls: '["https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400"]' },
      { name: 'MRF Genius Grand', description: 'Endorsed by Virat Kohli, balanced pickup, great for all pitches', price: 5800, stock: 5, category: 'Bat', imageUrl: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=400', imageUrls: '["https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=400"]' },
      { name: 'SG Test Special Leather Ball', description: 'Premium red leather ball for formal cricket', price: 650, stock: 40, category: 'Ball', imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400' },
      { name: 'Dukes Cricket Ball (Box of 6)', description: 'Preferred by England Test cricket, excellent seam movement', price: 3600, stock: 15, category: 'Ball', imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=400' },
      { name: 'SS Sunridges Pro Helmet', description: 'CE-certified helmet with full face guard and premium foam padding', price: 2200, stock: 20, category: 'Protection', imageUrl: 'https://images.unsplash.com/photo-1627308595186-3f29d7658498?w=400' },
      { name: 'Masuri Cricket Gloves', description: 'Multi-layer palm protection gloves for batsmen', price: 1100, stock: 30, category: 'Protection', imageUrl: 'https://images.unsplash.com/photo-1508098682722-e99c643f91d0?w=400' },
      { name: 'Adidas ODI Playing Shirt', description: 'Breathable, moisture-wicking ODI-style cricket jersey', price: 1800, stock: 25, category: 'Clothing', imageUrl: 'https://images.unsplash.com/photo-1529071538540-63c2aa9427bf?w=400' },
      { name: 'DSC Spikes Cricket Shoes', description: 'Rubber and metal spike combo for excellent grip on all surfaces', price: 2900, stock: 18, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
      { name: 'Cricket Kit Bag — Pro XL', description: 'Wheels-equipped, 4-compartment bag fits all gear for a full team', price: 3500, stock: 10, category: 'Accessories', imageUrl: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?w=400' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Products seeded');

  // ── Turfs ─────────────────────────────────────────────────────
  await prisma.turf.createMany({
    data: [
      { name: 'Green Arena Nets', location: 'Anna Nagar, Chennai (2.5 km)', pricePerHour: 800, netsAvailable: 4, imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=400' },
      { name: 'Stadium Pro Turf', location: 'Guindy, Chennai (5.1 km)', pricePerHour: 1200, netsAvailable: 2, imageUrl: 'https://images.unsplash.com/photo-1518605368461-1e12922349ce?w=400' },
      { name: 'Elite Cricket Centre', location: 'T Nagar, Chennai (3.8 km)', pricePerHour: 1000, netsAvailable: 6, imageUrl: 'https://images.unsplash.com/photo-1629245218781-dc7ae5d3abc5?w=400' },
      { name: 'Champions Net Zone', location: 'Adyar, Chennai (7 km)', pricePerHour: 600, netsAvailable: 3, imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=400' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Turfs seeded');

  // ── Coaches ───────────────────────────────────────────────────
  await prisma.coach.createMany({
    data: [
      { name: 'Rajesh Kumar', specialty: 'Batting Coach', pricePerSession: 1500, rating: 4.9, imageUrl: 'https://i.pravatar.cc/300?img=33' },
      { name: 'Suresh Raina Jr', specialty: 'Pace Bowling Coach', pricePerSession: 2000, rating: 4.8, imageUrl: 'https://i.pravatar.cc/300?img=12' },
      { name: 'Anita Sharma', specialty: 'Spin Bowling Specialist', pricePerSession: 1800, rating: 4.7, imageUrl: 'https://i.pravatar.cc/300?img=25' },
      { name: 'Vikram Pillai', specialty: 'Wicket-Keeping Coach', pricePerSession: 1200, rating: 4.6, imageUrl: 'https://i.pravatar.cc/300?img=48' },
      { name: 'David Mathews', specialty: 'All-Round Fitness Coach', pricePerSession: 2500, rating: 5.0, imageUrl: 'https://i.pravatar.cc/300?img=62' },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Coaches seeded');

  // ── Matches ───────────────────────────────────────────────────
  const now = new Date();
  const d = (daysFromNow: number, hour = 8) => {
    const dt = new Date(now);
    dt.setDate(dt.getDate() + daysFromNow);
    dt.setHours(hour, 0, 0, 0);
    return dt;
  };

  await prisma.match.createMany({
    data: [
      {
        title: 'Weekend League T20',
        stadiumName: 'MA Chidambaram Stadium',
        location: 'Chepauk, Chennai',
        startTime: d(3, 8),
        endTime: d(3, 11),
        pricePerPlayer: 200,
        maxCapacity: 22,
        status: 'SCHEDULED',
        weather: 'Sunny ☀️',
        imageUrl: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=600',
      },
      {
        title: 'Corporate Cricket Cup',
        stadiumName: 'Green Arena',
        location: 'Anna Nagar, Chennai',
        startTime: d(7, 6),
        endTime: d(7, 10),
        pricePerPlayer: 150,
        maxCapacity: 26,
        status: 'SCHEDULED',
        weather: 'Partly Cloudy ⛅',
        imageUrl: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=600',
      },
      {
        title: 'Inter-Colony Championship',
        stadiumName: 'Champions Net Zone',
        location: 'Adyar, Chennai',
        startTime: d(14, 7),
        endTime: d(14, 12),
        pricePerPlayer: 0,
        maxCapacity: 30,
        status: 'SCHEDULED',
        weather: 'Clear 🌤️',
        imageUrl: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=600',
      },
      {
        title: 'Night Cricket Bash',
        stadiumName: 'Elite Cricket Centre',
        location: 'T Nagar, Chennai',
        startTime: d(2, 19),
        endTime: d(2, 22),
        pricePerPlayer: 300,
        maxCapacity: 22,
        status: 'SCHEDULED',
        weather: 'Clear Night 🌙',
        imageUrl: 'https://images.unsplash.com/photo-1629245218781-dc7ae5d3abc5?w=600',
      },
    ],
    skipDuplicates: true,
  });
  console.log('✅ Matches seeded');

  console.log('\n🎉 All sample data seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
