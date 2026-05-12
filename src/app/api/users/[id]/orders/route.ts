import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch turf bookings
    const turfBookingsRaw = await prisma.turfBooking.findMany({
      where: { userId: id },
      include: { turf: { select: { name: true, location: true } } },
    });

    // Fetch coach bookings
    const coachBookingsRaw = await prisma.coachBooking.findMany({
      where: { userId: id },
      include: { coach: { select: { name: true, specialty: true } } },
    });

    // Fetch shop orders
    const shopOrdersRaw = await prisma.order.findMany({
      where: { userId: id },
      include: {
        orderItems: {
          include: { product: { select: { name: true } } }
        }
      }
    });

    // Normalize turf bookings
    const turfBookings = turfBookingsRaw.map(b => ({
      id: b.id,
      category: 'Turf',
      title: b.turf.name,
      subtitle: b.turf.location,
      startTime: b.startTime.toISOString(),
      endTime: b.endTime.toISOString(),
      guests: b.guests,
      status: b.status,
      createdAt: b.createdAt.toISOString()
    }));

    // Normalize coach bookings
    const coachBookings = coachBookingsRaw.map(b => ({
      id: b.id,
      category: 'Coach',
      title: `Session with ${b.coach.name}`,
      subtitle: b.coach.specialty,
      startTime: b.sessionTime.toISOString(),
      // Coaches are assumed 1 hour sessions
      endTime: new Date(b.sessionTime.getTime() + 60 * 60 * 1000).toISOString(),
      guests: 1, // Coach sessions are 1-on-1 by default
      status: b.status,
      createdAt: b.createdAt.toISOString()
    }));

    // Normalize shop orders
    const shopOrders = shopOrdersRaw.map(o => {
      const itemNames = o.orderItems.map(i => `${i.product.name} (x${i.quantity})`).join(', ');
      return {
        id: o.id,
        category: 'Sports Items',
        title: itemNames.length > 30 ? itemNames.substring(0, 30) + '...' : itemNames,
        subtitle: `Total: $${o.totalAmount.toFixed(2)}`,
        startTime: o.createdAt.toISOString(),
        endTime: o.createdAt.toISOString(),
        guests: null, // N/A for shop
        status: o.status,
        createdAt: o.createdAt.toISOString(),
        // Extra fields for shop orders
        deliveryAddress: o.deliveryAddress,
        discount: o.discount,
        couponCode: o.couponCode,
        fullItemsList: itemNames,
        totalAmount: o.totalAmount
      };
    });

    // Combine and sort by createdAt descending
    const allBookings = [...turfBookings, ...coachBookings, ...shopOrders].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(allBookings);
  } catch (error) {
    console.error("Error fetching user orders:", error);
    return NextResponse.json({ error: 'Failed to fetch user orders' }, { status: 500 });
  }
}
