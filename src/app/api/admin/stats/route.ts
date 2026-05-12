import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const [
      userCount,
      turfBookingCount,
      coachBookingCount,
      orderCount,
      revenueResult,
      recentUsers,
      recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.turfBooking.count(),
      prisma.coachBooking.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
      }),
      prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          user: { select: { name: true, email: true } },
          orderItems: { include: { product: { select: { name: true } } } },
        },
      }),
    ]);

    return NextResponse.json({
      stats: {
        users: userCount,
        turfBookings: turfBookingCount,
        coachBookings: coachBookingCount,
        orders: orderCount,
        revenue: revenueResult._sum.totalAmount || 0,
      },
      recentUsers,
      recentOrders,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load stats' }, { status: 500 });
  }
}
