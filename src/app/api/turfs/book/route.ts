// Booking route - Updated to support guest count and detailed error reporting
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, turfId, startTime, endTime, guests } = await request.json();
    console.log('--- Booking Attempt ---');
    console.log('User ID:', userId);
    console.log('Turf ID:', turfId);
    console.log('Guests:', guests);

    const booking = await prisma.turfBooking.create({
      data: {
        userId,
        turfId,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        guests: guests ? Number(guests) : undefined,
      },
    });

    console.log('Booking created successfully:', booking.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (error: any) {
    console.error('--- CRITICAL BOOKING ERROR ---');
    console.error('Error Code:', error.code);
    console.error('Error Message:', error.message);
    console.error('Error Stack:', error.stack);
    
    // Check if it's a Prisma relation error (P2003)
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Database Relation Error', 
        details: 'The User ID or Turf ID provided does not exist in our records.' 
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Failed to book turf', 
      details: error.message 
    }, { status: 500 });
  }
}
