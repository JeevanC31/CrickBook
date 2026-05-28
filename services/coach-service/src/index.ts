import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4003;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'coach-service' });
});

// GET /coaches
app.get('/coaches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const coaches = await prisma.coach.findMany();
    res.json(coaches);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

// POST /coaches
app.post('/coaches', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    const coach = await prisma.coach.create({ data });
    res.status(201).json(coach);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

// POST /coaches/book
app.post('/coaches/book', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, coachId, coachName, sessionTime } = req.body;

    const booking = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if (!user) throw new Error('User not found');

      let coach = await tx.coach.findUnique({ where: { id: coachId } });
      if (!coach) {
        coach = await tx.coach.create({
          data: {
            id: coachId,
            name: coachName || 'Unknown Coach',
            specialty: 'Coach',
            pricePerSession: 500,
            rating: 4.8,
          },
        });
      }

      if (user.walletBalance < coach.pricePerSession) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      await tx.user.update({
        where: { id: userId },
        data: { walletBalance: user.walletBalance - coach.pricePerSession },
      });

      return await tx.coachBooking.create({
        data: {
          userId,
          coachId: coach.id,
          sessionTime: new Date(sessionTime),
        },
      });
    });

    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Coach booking error:', error.message);
    if (error.message === 'INSUFFICIENT_FUNDS') {
      res.status(400).json({ error: 'Insufficient Funds', details: 'Please add money to your wallet to complete this booking.' });
      return;
    }
    res.status(500).json({ error: 'Failed to book coach' });
  }
});

// GET /bookings?userId=...
app.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: String(userId) } : {};
    const bookings = await prisma.coachBooking.findMany({
      where,
      include: { coach: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coach bookings' });
  }
});

app.listen(PORT, () => {
  console.log(`Coach service running on port ${PORT}`);
});
