import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const matches = await prisma.match.findMany({
      include: { players: true },
    });
    return NextResponse.json(matches);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch matches' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    data.startTime = new Date(data.startTime);
    data.endTime = new Date(data.endTime);
    const match = await prisma.match.create({ data });
    return NextResponse.json(match, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
