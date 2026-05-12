import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function hash(pw: string) {
  return createHash('sha256').update(pw).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied. Admin account not found.' }, { status: 403 });
    }

    if (user.passwordHash !== hash(password)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, message: 'Admin logged in.' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
