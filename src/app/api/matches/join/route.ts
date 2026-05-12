import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { matchId, userId, role } = await request.json();

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId,
        userId,
        role,
      },
    });

    return NextResponse.json(matchPlayer, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join match' }, { status: 500 });
  }
}
