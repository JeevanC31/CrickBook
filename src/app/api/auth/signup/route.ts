import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createHash } from 'crypto';

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex');
}

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    // Validate password strength server-side
    const passwordRules = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /[0-9]/.test(password),
      /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]/.test(password),
    ];
    if (!passwordRules.every(Boolean)) {
      return NextResponse.json({ error: 'Password does not meet security requirements.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 400 });
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashPassword(password),
      },
    });

    // Return user without the passwordHash
    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json({ user: safeUser, message: 'Account created successfully.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 });
  }
}
