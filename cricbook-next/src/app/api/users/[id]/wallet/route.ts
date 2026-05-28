import { NextRequest, NextResponse } from 'next/server';

const AUTH_API_URL = process.env.AUTH_API_URL || 'http://auth-service:4001';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const res = await fetch(`${AUTH_API_URL}/users/${userId}/wallet`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error || 'Failed to fetch wallet balance' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Wallet fetch error:', error);
    return NextResponse.json({ error: 'Wallet service unavailable' }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params;
    const body = await req.json();

    const res = await fetch(`${AUTH_API_URL}/users/${userId}/wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err.error || 'Transaction failed' }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Wallet update error:', error);
    return NextResponse.json({ error: 'Wallet service unavailable' }, { status: 500 });
  }
}
