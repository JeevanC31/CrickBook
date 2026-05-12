import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, coachId, sessionTime } = await request.json();

    const booking = await prisma.coachBooking.create({
      data: {
        userId,
        coachId,
        sessionTime: new Date(sessionTime),
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to book coach' }, { status: 500 });
  }
}
