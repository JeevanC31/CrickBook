import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

  try {
    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch cart' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId, productId, quantity } = await request.json();

    const existingCartItem = await prisma.cartItem.findFirst({
      where: { userId, productId },
    });

    if (existingCartItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + (quantity || 1) },
      });
      return NextResponse.json(updated, { status: 200 });
    }

    const cartItem = await prisma.cartItem.create({
      data: { userId, productId, quantity: quantity || 1 },
    });

    return NextResponse.json(cartItem, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add to cart' }, { status: 500 });
  }
}
