import express, { Request, Response } from 'express';
import cors from 'cors';
import { createHash } from 'crypto';
import { prisma } from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req: Request, res: Response): void => {
  res.json({ status: 'ok', service: 'auth-service' });
});

// POST /login
app.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const hash = createHash('sha256').update(password).digest('hex');
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.passwordHash !== hash) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const { passwordHash: _, ...safeUser } = user;
    res.json({ user: safeUser, message: 'Logged in successfully.' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

// POST /signup
app.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    const passwordRules = [
      password && password.length >= 8,
      /[A-Z]/.test(password || ''),
      /[a-z]/.test(password || ''),
      /[0-9]/.test(password || ''),
      /[!@#$%^&*()\-_=+\[\]{};':"\\|,.<>\/?]/.test(password || ''),
    ];
    if (!passwordRules.every(Boolean)) {
      res.status(400).json({ error: 'Password does not meet security requirements.' });
      return;
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: 'An account with this email already exists.' });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: createHash('sha256').update(password).digest('hex'),
      },
    });

    const { passwordHash: _, ...safeUser } = user;
    res.status(201).json({ user: safeUser, message: 'Account created successfully.' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// GET /users/:id
app.get('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const { passwordHash: _, ...safeUser } = user;
    res.json(safeUser);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PUT /users/:id
app.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, phone, age, specialization } = req.body;

    const updated = await prisma.user.update({
      where: { id },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        age: age ? Number(age) : undefined,
        specialization: specialization || undefined,
      },
    });

    const { passwordHash: _, ...safeUser } = updated;
    res.json({ user: safeUser, message: 'Profile updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /users/:id/wallet
app.get('/users/:id/wallet', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id }, select: { walletBalance: true } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({ walletBalance: user.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// POST /users/:id/wallet
app.post('/users/:id/wallet', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { action, amount } = req.body;

    if (!action || amount === undefined || amount <= 0) {
      res.status(400).json({ error: 'Invalid action or amount' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id }, select: { walletBalance: true } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    let newBalance = user.walletBalance;
    if (action === 'add') {
      newBalance += Number(amount);
    } else if (action === 'withdraw') {
      if (user.walletBalance < Number(amount)) {
        res.status(400).json({ error: 'Insufficient funds' });
        return;
      }
      newBalance -= Number(amount);
    } else {
      res.status(400).json({ error: 'Invalid action' });
      return;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { walletBalance: newBalance },
      select: { walletBalance: true },
    });

    res.json({ walletBalance: updated.walletBalance });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update wallet' });
  }
});

app.listen(PORT, () => {
  console.log(`Auth service running on port ${PORT}`);
});
