import { NextRequest, NextResponse } from 'next/server';

const TURF_API_URL = process.env.TURF_API_URL || 'http://turf-service:4002';
const COACH_API_URL = process.env.COACH_API_URL || 'http://coach-service:4003';
const MATCH_API_URL = process.env.MATCH_API_URL || 'http://match-service:4004';
const SHOP_API_URL = process.env.SHOP_API_URL || 'http://shop-service:4005';

// Helper: safe fetch with timeout
async function safeFetch(url: string) {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  // Fetch all bookings in parallel
  const [turfBookings, coachBookings, matchBookings, shopOrders] = await Promise.all([
    safeFetch(`${TURF_API_URL}/bookings?userId=${userId}`),
    safeFetch(`${COACH_API_URL}/bookings?userId=${userId}`),
    safeFetch(`${MATCH_API_URL}/bookings?userId=${userId}`),
    safeFetch(`${SHOP_API_URL}/orders?userId=${userId}`),
  ]);

  const orders: any[] = [];

  // Turf bookings
  for (const b of turfBookings) {
    orders.push({
      id: b.id,
      category: 'Turf',
      title: b.turf?.name || 'Turf Booking',
      subtitle: b.turf?.location || '',
      startTime: b.startTime,
      endTime: b.endTime,
      guests: b.guests,
      status: b.status,
      createdAt: b.createdAt,
    });
  }

  // Coach bookings
  for (const b of coachBookings) {
    orders.push({
      id: b.id,
      category: 'Coach',
      title: b.coach?.name || 'Coach Session',
      subtitle: b.coach?.specialty || '',
      startTime: b.sessionTime,
      endTime: b.sessionTime,
      guests: 1,
      status: b.status,
      createdAt: b.createdAt,
    });
  }

  // Match bookings
  for (const b of matchBookings) {
    orders.push({
      id: b.id,
      category: 'Match',
      title: b.match?.title || 'Match',
      subtitle: b.match?.location || b.match?.stadiumName || '',
      startTime: b.match?.startTime || b.createdAt,
      endTime: b.match?.endTime || b.createdAt,
      guests: 1,
      status: b.status,
      createdAt: b.createdAt,
      fullItemsList: b.role,
    });
  }

  // Shop orders
  for (const o of shopOrders) {
    const items = (o.orderItems || [])
      .map((i: any) => `${i.product?.name || 'Item'} ×${i.quantity}`)
      .join(', ');
    orders.push({
      id: o.id,
      category: 'Sports Items',
      title: `Order #${o.id.split('-')[0].toUpperCase()}`,
      subtitle: `₹${o.totalAmount?.toFixed(2)}`,
      startTime: o.createdAt,
      endTime: o.createdAt,
      guests: null,
      status: o.status,
      createdAt: o.createdAt,
      deliveryAddress: o.deliveryAddress,
      discount: o.discount,
      couponCode: o.couponCode,
      totalAmount: o.totalAmount,
      fullItemsList: items || 'No items',
    });
  }

  // Sort by createdAt desc
  orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return NextResponse.json(orders);
}
