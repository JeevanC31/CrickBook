import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4002;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'turf-service' });
});

// GET /turfs
app.get('/turfs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const turfs = await prisma.turf.findMany();
    res.json(turfs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch turfs' });
  }
});

// POST /turfs
app.post('/turfs', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const turf = await prisma.turf.create({ data });
    res.status(201).json(turf);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create turf' });
  }
});

// POST /turfs/book
app.post('/turfs/book', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, turfId, startTime, endTime, guests } = req.body;
    console.log('--- Booking Attempt ---');
    console.log('User ID:', userId, '| Turf ID:', turfId, '| Guests:', guests);

    if (!userId || !turfId || !startTime || !endTime) {
      res.status(400).json({ error: 'Missing required fields: userId, turfId, startTime, endTime' });
      return;
    }

    const booking = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      const turf = await tx.turf.findUnique({ where: { id: turfId }, select: { pricePerHour: true } });

      if (!user) throw new Error('User not found');
      if (!turf) throw new Error('Turf not found');

      if (user.walletBalance < turf.pricePerHour) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: user.walletBalance - turf.pricePerHour },
      });

      return await tx.turfBooking.create({
        data: {
          userId,
          turfId,
          startTime: new Date(startTime),
          endTime: new Date(endTime),
          guests: guests ? Number(guests) : undefined,
        },
      });
    });

    console.log('Booking created:', booking.id);
    res.status(201).json(booking);
  } catch (error: unknown) {
    const err = error as Error & { code?: string };
    console.error('Booking error:', err.message);
    if (err.message === 'INSUFFICIENT_FUNDS') {
      res.status(400).json({ error: 'Insufficient Funds', details: 'Please add money to your wallet to complete this booking.' });
      return;
    }
    if (err.code === 'P2003') {
      res.status(400).json({ error: 'Database Relation Error', details: 'The User ID or Turf ID does not exist.' });
      return;
    }
    res.status(500).json({ error: 'Failed to book turf', details: err.message });
  }
});

// GET /bookings?userId=...
app.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: String(userId) } : {};
    const bookings = await prisma.turfBooking.findMany({
      where,
      include: { turf: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch turf bookings' });
  }
});

app.listen(PORT, () => {
  console.log(`Turf service running on port ${PORT}`);
});
