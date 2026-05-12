import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const turfs = await prisma.turf.findMany();
    return NextResponse.json(turfs);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch turfs' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const turf = await prisma.turf.create({ data });
    return NextResponse.json(turf, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create turf' }, { status: 500 });
  }
}
