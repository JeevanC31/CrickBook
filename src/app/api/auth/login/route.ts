import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.passwordHash !== hashPassword(password)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Return user without passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, message: 'Logged in successfully.' }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Login failed. Please try again.' }, { status: 500 });
  }
}
