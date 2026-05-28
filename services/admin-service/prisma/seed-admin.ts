import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { createHash } from 'crypto';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex');
}

async function main() {
  const adminEmail = 'admin@cricbook.com';
  const adminPassword = 'Admin@123';

  const existing = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (existing) {
    // Make sure it's flagged as ADMIN
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'ADMIN', passwordHash: hash(adminPassword) },
    });
    console.log('✅ Admin user updated.');
  } else {
    await prisma.user.create({
      data: {
        name: 'CricBook Admin',
        email: adminEmail,
        passwordHash: hash(adminPassword),
        role: 'ADMIN',
      },
    });
    console.log('✅ Admin user created.');
  }

  console.log('\n─────────────────────────────');
  console.log('  Admin Login Credentials');
  console.log('─────────────────────────────');
  console.log(`  Email   : ${adminEmail}`);
  console.log(`  Password: ${adminPassword}`);
  console.log('─────────────────────────────\n');
}

main().catch(console.error).finally(() => prisma.$disconnect());
