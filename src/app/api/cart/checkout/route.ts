import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { userId, items, deliveryAddress, discountCode, discountPercentage, finalAmount } = await request.json();

    if (!userId || !items || items.length === 0 || !deliveryAddress) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use a transaction to ensure all items and the order are created together
    const order = await prisma.$transaction(async (tx) => {
      // 1. Create the Order
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: finalAmount,
          status: 'PENDING',
          deliveryAddress,
          discount: discountPercentage,
          couponCode: discountCode,
        }
      });

      // 2. Create OrderItems
      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          }
        });
        
        // 3. Decrement stock
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } }
        });
      }

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error('Checkout error:', error.message);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
