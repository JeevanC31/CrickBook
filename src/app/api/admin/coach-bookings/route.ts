import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const coachBookings = await prisma.coachBooking.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          }
        },
        coach: {
          select: {
            name: true,
            specialty: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(coachBookings);
  } catch (error) {
    console.error("Error fetching coach bookings:", error);
    return NextResponse.json({ error: 'Failed to fetch coach bookings' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status } = await request.json();
    
    const updatedBooking = await prisma.coachBooking.update({
      where: { id },
      data: { status }
    });

    return NextResponse.json(updatedBooking);
  } catch (error) {
    console.error("Error updating coach booking status:", error);
    return NextResponse.json({ error: 'Failed to update coach booking status' }, { status: 500 });
  }
}
