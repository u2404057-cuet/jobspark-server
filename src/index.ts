import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import { auth } from './lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import { requireAuth } from './middleware/authMiddleware.js';
import jobsRouter from './routes/jobs.js';
import blogsRouter from './routes/blogs.js';
import dashboardRouter from './routes/dashboard.js';
import aiRouter from './routes/ai.js';

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

// Auth Route
app.all("/api/auth/{*path}", toNodeHandler(auth));

// Routes
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'JobSpark API is running' });
});

app.get('/api/me', requireAuth, (req: Request, res: Response) => {
  res.status(200).json({ user: (req as any).user });
});

app.use('/api/jobs', jobsRouter);
app.use('/api/blogs', blogsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/ai', aiRouter);

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
  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
  });
}

export default app;
