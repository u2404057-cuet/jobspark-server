import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB, db } from './db.js';
import { auth } from './auth.js';
import { toNodeHandler } from 'better-auth/node';
import { requireAuth } from './authMiddleware.js';
import jobsRouter from './jobs.js';
import blogsRouter from './blogs.js';
import dashboardRouter from './dashboard.js';
import aiRouter from './ai.js';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://jobspark-zeta.vercel.app'
];
if (process.env.CLIENT_URL) {
  const cleanUrl = process.env.CLIENT_URL.replace(/\/$/, '');
  if (!allowedOrigins.includes(cleanUrl)) {
    allowedOrigins.push(cleanUrl);
  }
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const cleanOrigin = origin.replace(/\/$/, '');
    if (
      allowedOrigins.includes(cleanOrigin) ||
      cleanOrigin.endsWith('.vercel.app') ||
      cleanOrigin.startsWith('http://localhost:')
    ) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
}));

// Auth Route (Must be mounted before express.json() to prevent interference with request body parsing)
app.all("/api/auth/*path", (req, res, next) => {
  console.log(`[Auth Route Debug] Method: ${req.method}, Path: ${req.path}, URL: ${req.url}`);
  toNodeHandler(auth)(req, res, next);
});

app.use(express.json());

// Request Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Database Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database middleware error:', err);
  }
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Welcome to the JobSpark API!' });
});
app.get('/api', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Welcome to the JobSpark API!' });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'JobSpark API is running' });
});
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'JobSpark API is running' });
});

app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: (req as any).user });
});
app.get('/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: (req as any).user });
});

app.use('/api/jobs', jobsRouter);
app.use('/jobs', jobsRouter);

app.get('/api/my-jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const jobs = await db.collection('jobs')
      .find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
});
app.get('/my-jobs', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const jobs = await db.collection('jobs')
      .find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .toArray();
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your jobs' });
  }
});

app.use('/api/blogs', blogsRouter);
app.use('/blogs', blogsRouter);

app.use('/api/dashboard', dashboardRouter);
app.use('/dashboard', dashboardRouter);
app.use('/', dashboardRouter);
app.use('/api', dashboardRouter);

app.use('/api/ai', aiRouter);
app.use('/ai', aiRouter);
app.use('/', aiRouter);
app.use('/api', aiRouter);

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: err.message || 'Internal Server Error', details: err });
});

// Start Server
if (process.env.NODE_ENV !== 'production') {
  connectDB()
    .then(() => {
      app.listen(port, () => {
        console.log(`🚀 Server running on port ${port}`);
      });
    })
    .catch((err) => {
      console.error('❌ Failed to start server due to database connection error:', err);
    });
}

export default app;
