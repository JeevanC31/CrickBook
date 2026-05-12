import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, turfId, startTime, endTime } = await request.json();

    const booking = await prisma.turfBooking.create({
      data: {
        userId,
        turfId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to book turf' }, { status: 500 });
  }
}
