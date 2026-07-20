import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import { connectDB } from '../src/config/db.js';
import { auth } from '../src/lib/auth.js';
import { toNodeHandler } from 'better-auth/node';
import { requireAuth } from '../src/middleware/authMiddleware.js';
import jobsRouter from '../src/routes/jobs.js';
import blogsRouter from '../src/routes/blogs.js';
import dashboardRouter from '../src/routes/dashboard.js';
import aiRouter from '../src/routes/ai.js';

const app = express();
const port = process.env.PORT || 8000;

// Middleware
const allowedOrigins = [
  'http://localhost:3000',
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
    if (allowedOrigins.includes(cleanOrigin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
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

// Database Connection
connectDB();

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
