import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4007;

app.use(cors());
app.use(express.json());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(process.cwd(), 'public', 'uploads'));
  },
  filename: (_req, file, cb) => {
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    cb(null, `${randomUUID()}.${ext}`);
  },
});
const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'];
    const ext = file.originalname.split('.').pop()?.toLowerCase() || '';
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'admin-service' });
});

// ─── Admin Auth ─────────────────────────────────────────────────────────────

app.post('/admin/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const hash = createHash('sha256').update(password).digest('hex');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.role !== 'ADMIN') {
      res.status(403).json({ error: 'Access denied. Admin account not found.' });
      return;
    }
    if (user.passwordHash !== hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, message: 'Admin logged in.' });
  } catch {
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// ─── Stats ───────────────────────────────────────────────────────────────────

app.get('/admin/stats', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      userCount, turfBookingCount, coachBookingCount, orderCount,
      shopRevenueResult, turfBookingsForRevenue, coachBookingsForRevenue,
      matchPlayersForRevenue, recentUsers, recentOrders,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.turfBooking.count(),
      prisma.coachBooking.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalAmount: true } }),
      prisma.turfBooking.findMany({ select: { startTime: true, endTime: true, turf: { select: { pricePerHour: true } } } }),
      prisma.coachBooking.findMany({ select: { coach: { select: { pricePerSession: true } } } }),
      prisma.matchPlayer.findMany({ select: { match: { select: { pricePerPlayer: true } } } }),
      prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 5, select: { id: true, name: true, email: true, role: true, createdAt: true } }),
      prisma.order.findMany({ orderBy: { createdAt: 'desc' }, take: 5, include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true } } } } } }),
    ]);

    const turfRevenue = turfBookingsForRevenue.reduce((sum: number, b: any) => {
      const hours = (new Date(b.endTime).getTime() - new Date(b.startTime).getTime()) / 3_600_000;
      return sum + hours * b.turf.pricePerHour;
    }, 0);
    const coachRevenue = coachBookingsForRevenue.reduce((sum: number, b: any) => sum + b.coach.pricePerSession, 0);
    const matchRevenue = matchPlayersForRevenue.reduce((sum: number, p: any) => sum + p.match.pricePerPlayer, 0);
    const shopRevenue = shopRevenueResult._sum.totalAmount || 0;
    const totalRevenue = turfRevenue + coachRevenue + matchRevenue + shopRevenue;

    res.json({
      stats: { users: userCount, turfBookings: turfBookingCount, coachBookings: coachBookingCount, orders: orderCount, revenue: totalRevenue },
      revenueBreakdown: {
        turf: parseFloat(turfRevenue.toFixed(2)),
        coach: parseFloat(coachRevenue.toFixed(2)),
        match: parseFloat(matchRevenue.toFixed(2)),
        shop: parseFloat(shopRevenue.toFixed(2)),
        total: parseFloat(totalRevenue.toFixed(2)),
      },
      recentUsers,
      recentOrders,
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Failed to load stats' });
  }
});

// ─── Users ───────────────────────────────────────────────────────────────────

app.get('/admin/users', async (_req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, phone: true, specialization: true, createdAt: true, _count: { select: { turfBookings: true, coachBookings: true, orders: true } } },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.delete('/admin/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    await prisma.user.delete({ where: { id } });
    res.json({ message: 'User deleted.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── Turfs ───────────────────────────────────────────────────────────────────

app.get('/admin/turfs', async (_req: Request, res: Response): Promise<void> => {
  try {
    const turfs = await prisma.turf.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(turfs);
  } catch {
    res.status(500).json({ error: 'Failed to fetch turfs' });
  }
});

app.post('/admin/turfs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, location, pricePerHour, netsAvailable, imageUrl } = req.body;
    const turf = await prisma.turf.create({ data: { name, location, pricePerHour: parseFloat(pricePerHour), netsAvailable: parseInt(netsAvailable), imageUrl: imageUrl || null } });
    res.status(201).json(turf);
  } catch {
    res.status(500).json({ error: 'Failed to create turf' });
  }
});

app.patch('/admin/turfs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, location, pricePerHour, netsAvailable, imageUrl } = req.body;
    if (!id) {
      res.status(400).json({ error: 'ID required' });
      return;
    }
    const turf = await prisma.turf.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(location && { location }),
        ...(pricePerHour !== undefined && { pricePerHour: parseFloat(pricePerHour) }),
        ...(netsAvailable !== undefined && { netsAvailable: parseInt(netsAvailable) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });
    res.json(turf);
  } catch {
    res.status(500).json({ error: 'Failed to update turf' });
  }
});

app.delete('/admin/turfs', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: 'ID required' });
      return;
    }
    await prisma.turf.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete turf' });
  }
});

// ─── Coaches ─────────────────────────────────────────────────────────────────

app.get('/admin/coaches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const coaches = await prisma.coach.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(coaches);
  } catch {
    res.status(500).json({ error: 'Failed to fetch coaches' });
  }
});

app.post('/admin/coaches', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, specialty, pricePerSession, rating, imageUrl } = req.body;
    const coach = await prisma.coach.create({ data: { name, specialty, pricePerSession: parseFloat(pricePerSession), rating: parseFloat(rating) || 0, imageUrl: imageUrl || null } });
    res.status(201).json(coach);
  } catch {
    res.status(500).json({ error: 'Failed to create coach' });
  }
});

app.patch('/admin/coaches', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, name, specialty, pricePerSession, rating, imageUrl } = req.body;
    if (!id) {
      res.status(400).json({ error: 'ID required' });
      return;
    }
    const coach = await prisma.coach.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(specialty && { specialty }),
        ...(pricePerSession !== undefined && { pricePerSession: parseFloat(pricePerSession) }),
        ...(rating !== undefined && { rating: parseFloat(rating) }),
        ...(imageUrl !== undefined && { imageUrl: imageUrl || null }),
      },
    });
    res.json(coach);
  } catch {
    res.status(500).json({ error: 'Failed to update coach' });
  }
});

app.delete('/admin/coaches', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: 'ID required' });
      return;
    }
    await prisma.coach.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete coach' });
  }
});

// ─── Matches ─────────────────────────────────────────────────────────────────

app.get('/admin/matches', async (_req: Request, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({ orderBy: { startTime: 'desc' }, include: { players: { include: { user: { select: { name: true, email: true, phone: true } } } } } });
    res.json(matches);
  } catch {
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

app.post('/admin/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const data = req.body;
    data.startTime = new Date(data.startTime);
    data.endTime = new Date(data.endTime);
    if (data.pricePerPlayer) data.pricePerPlayer = parseFloat(data.pricePerPlayer);
    if (data.maxCapacity) data.maxCapacity = parseInt(data.maxCapacity);
    const match = await prisma.match.create({ data });
    res.status(201).json(match);
  } catch {
    res.status(500).json({ error: 'Failed to create match' });
  }
});

app.patch('/admin/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, pricePerPlayer, status } = req.body;
    if (!id) {
      res.status(400).json({ error: 'Match ID is required' });
      return;
    }
    const match = await prisma.match.update({ where: { id }, data: { ...(pricePerPlayer !== undefined && { pricePerPlayer: parseFloat(pricePerPlayer) }), ...(status && { status }) } });
    res.json(match);
  } catch {
    res.status(500).json({ error: 'Failed to update match' });
  }
});

app.delete('/admin/matches', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: 'Match ID is required' });
      return;
    }
    await prisma.matchPlayer.deleteMany({ where: { matchId: id } });
    const deleted = await prisma.match.delete({ where: { id } });
    res.json(deleted);
  } catch {
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// ─── Products ─────────────────────────────────────────────────────────────────

app.get('/admin/products', async (_req: Request, res: Response): Promise<void> => {
  try {
    const products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(products);
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.post('/admin/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.create({ data: req.body });
    res.status(201).json(product);
  } catch {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.patch('/admin/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, ...data } = req.body;
    const product = await prisma.product.update({ where: { id }, data });
    res.json(product);
  } catch {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/admin/products', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    await prisma.product.delete({ where: { id } });
    res.json({ message: 'Product deleted.' });
  } catch {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ─── Categories ───────────────────────────────────────────────────────────────

app.get('/admin/categories', async (_req: Request, res: Response): Promise<void> => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/admin/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      res.status(400).json({ error: 'Name required' });
      return;
    }
    const category = await prisma.category.create({ data: { name: name.trim() } });
    res.status(201).json(category);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      res.status(409).json({ error: 'Category already exists' });
      return;
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

app.delete('/admin/categories', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.body;
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ─── Bookings (Turf) ─────────────────────────────────────────────────────────

app.get('/admin/bookings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await prisma.turfBooking.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, turf: { select: { name: true, location: true } } } });
    res.json(bookings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch turf bookings' });
  }
});

app.patch('/admin/bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    const updated = await prisma.turfBooking.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update booking' });
  }
});

// ─── Coach Bookings ───────────────────────────────────────────────────────────

app.get('/admin/coach-bookings', async (_req: Request, res: Response): Promise<void> => {
  try {
    const coachBookings = await prisma.coachBooking.findMany({ include: { user: { select: { name: true, email: true } }, coach: { select: { name: true, specialty: true } } }, orderBy: { createdAt: 'desc' } });
    res.json(coachBookings);
  } catch {
    res.status(500).json({ error: 'Failed to fetch coach bookings' });
  }
});

app.patch('/admin/coach-bookings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    const updated = await prisma.coachBooking.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update coach booking status' });
  }
});

// ─── Orders ───────────────────────────────────────────────────────────────────

app.get('/admin/orders', async (_req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({ orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, orderItems: { include: { product: { select: { name: true } } } } } });
    res.json(orders);
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

app.patch('/admin/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id, status } = req.body;
    const updated = await prisma.order.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// ─── File Upload ──────────────────────────────────────────────────────────────

app.post('/upload', upload.single('file'), (req: Request, res: Response): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file provided' });
      return;
    }
    res.json({ url: `/uploads/${req.file.filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Admin service running on port ${PORT}`);
});
