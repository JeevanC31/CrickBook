import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4005;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'shop-service' });
});

// GET /shop (products)
app.get('/shop', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// POST /shop (create product)
app.post('/shop', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const product = await prisma.product.create({ data });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// GET /cart?userId=...
app.get('/cart', async (req: Request, res: Response): Promise<void> => {
  const userId = req.query.userId as string;
  if (!userId) {
    res.status(400).json({ error: 'Missing userId' });
    return;
  }

  try {
    const cart = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
    res.json(cart);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cart' });
  }
});

// POST /cart
app.post('/cart', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, productId, quantity } = req.body;

    const existingCartItem = await prisma.cartItem.findFirst({ where: { userId, productId } });

    if (existingCartItem) {
      const updated = await prisma.cartItem.update({
        where: { id: existingCartItem.id },
        data: { quantity: existingCartItem.quantity + (quantity || 1) },
      });
      res.json(updated);
      return;
    }

    const cartItem = await prisma.cartItem.create({
      data: { userId, productId, quantity: quantity || 1 },
    });
    res.status(201).json(cartItem);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

// DELETE /cart/:id
app.delete('/cart/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.cartItem.delete({ where: { id } });
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to remove cart item' });
  }
});

// POST /cart/checkout
app.post('/cart/checkout', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, items, deliveryAddress, discountCode, discountPercentage, finalAmount } = req.body;

    if (!userId || !items || items.length === 0 || !deliveryAddress) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const order = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if (!user) throw new Error('User not found');

      if (user.walletBalance < finalAmount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: user.walletBalance - finalAmount },
      });

      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: finalAmount,
          status: 'PENDING',
          deliveryAddress,
          discount: discountPercentage,
          couponCode: discountCode,
        },
      });

      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: newOrder.id,
            productId: item.id,
            quantity: item.quantity,
            priceAtPurchase: item.price,
          },
        });
        await tx.product.update({
          where: { id: item.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return newOrder;
    });

    res.status(201).json(order);
  } catch (error: any) {
    console.error('Checkout error:', error.message);
    if (error.message === 'INSUFFICIENT_FUNDS') {
      res.status(400).json({ error: 'Insufficient Funds', details: 'Please add money to your wallet to complete purchase.' });
      return;
    }
    res.status(500).json({ error: 'Checkout failed' });
  }
});

// GET /orders?userId=...
app.get('/orders', async (req: Request, res: Response): Promise<void> => {
  const userId = req.query.userId as string;

  try {
    const where = userId ? { userId } : {};
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: { include: { product: true } },
      },
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /orders (legacy cart-to-order)
app.post('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });

    if (cartItems.length === 0) {
      res.status(400).json({ error: 'Cart is empty' });
      return;
    }

    let totalAmount = 0;
    const orderItemsData = cartItems.map((item: any) => {
      totalAmount += item.product.price * item.quantity;
      return {
        productId: item.productId,
        quantity: item.quantity,
        priceAtPurchase: item.product.price,
      };
    });

    const order = await prisma.$transaction(async (tx: any) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount,
          orderItems: { create: orderItemsData },
        },
      });
      await tx.cartItem.deleteMany({ where: { userId } });
      return newOrder;
    });

    res.status(201).json(order);
  } catch (error) {
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// GET /categories
app.get('/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.listen(PORT, () => {
  console.log(`Shop service running on port ${PORT}`);
});
