import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db';
import { auth } from './lib/auth';
import { toNodeHandler } from 'better-auth/node';
import { requireAuth } from './middleware/authMiddleware';
import jobsRouter from './routes/jobs';
import blogsRouter from './routes/blogs';
import dashboardRouter from './routes/dashboard';
import aiRouter from './routes/ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Database Connection
connectDB();

// Auth Route
app.all("/api/auth/*", toNodeHandler(auth));

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
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
