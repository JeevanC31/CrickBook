import express, { Request, Response } from 'express';
import cors from 'cors';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4004;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'match-service' });
});

// GET /matches
app.get('/matches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      orderBy: { startTime: 'asc' },
      include: {
        players: {
          include: {
            user: { select: { id: true, name: true, phone: true } },
          },
        },
      },
    });
    res.json(matches);
  } catch (error: any) {
    console.error('Fetch matches error:', error.message);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// POST /matches
app.post('/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    data.startTime = new Date(data.startTime);
    data.endTime = new Date(data.endTime);
    if (data.pricePerPlayer) data.pricePerPlayer = parseFloat(data.pricePerPlayer);
    if (data.maxCapacity) data.maxCapacity = parseInt(data.maxCapacity);

    const match = await prisma.match.create({ data });
    res.status(201).json(match);
  } catch (error: any) {
    console.error('Create match error:', error.message);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// POST /matches/join
app.post('/matches/join', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId, matchId, role } = req.body;

    if (!userId || !matchId || !role) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const result = await prisma.$transaction(async (tx: any) => {
      const match = await tx.match.findUnique({
        where: { id: matchId },
        include: { _count: { select: { players: true } } },
      });

      if (!match) throw new Error('Match not found');

      const existingPlayer = await tx.matchPlayer.findFirst({ where: { matchId, userId } });
      if (existingPlayer) throw new Error('You have already joined this match');

      if (match._count.players >= match.maxCapacity) {
        throw new Error('Match is full (capacity reached)');
      }

      const user = await tx.user.findUnique({ where: { id: userId }, select: { walletBalance: true } });
      if (!user) throw new Error('User not found');

      if (user.walletBalance < match.pricePerPlayer) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      if (match.pricePerPlayer > 0) {
        await tx.user.update({
          where: { id: userId },
          data: { walletBalance: user.walletBalance - match.pricePerPlayer },
        });
      }

      return await tx.matchPlayer.create({
        data: { userId, matchId, role, status: 'CONFIRMED' },
      });
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error('Join match error:', error.message);
    if (error.message === 'INSUFFICIENT_FUNDS') {
      res.status(400).json({ error: 'Insufficient Funds', details: 'Please add money to your wallet to join this match.' });
      return;
    }
    res.status(500).json({ error: error.message || 'Failed to join match' });
  }
});

// GET /bookings?userId=...
app.get('/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.query;
    const where = userId ? { userId: String(userId) } : {};
    const bookings = await prisma.matchPlayer.findMany({
      where,
      include: { match: true },
      orderBy: { createdAt: 'desc' },
    });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch match bookings' });
  }
});

app.listen(PORT, () => {
  console.log(`Match service running on port ${PORT}`);
});
