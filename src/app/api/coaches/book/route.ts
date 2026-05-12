import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, coachId, coachName, sessionTime } = await request.json();

    // Ensure coach exists to prevent foreign key errors from hardcoded frontend
    let coach = await prisma.coach.findUnique({ where: { id: coachId } });
    if (!coach) {
      coach = await prisma.coach.create({
        data: {
          id: coachId,
          name: coachName || 'Unknown Coach',
          specialty: 'Coach',
          pricePerSession: 50,
          rating: 4.8
        }
      });
    }

    const booking = await prisma.coachBooking.create({
      data: {
        userId,
        coachId: coach.id,
        sessionTime: new Date(sessionTime),
      },
    });

    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('Coach booking error:', error.message);
    return NextResponse.json({ error: 'Failed to book coach' }, { status: 500 });
  }
}
