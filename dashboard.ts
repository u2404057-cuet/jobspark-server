import { Router, Request, Response } from 'express';
import { db } from './db.js';
import { requireAuth } from './authMiddleware.js';

const router = Router();

const getStats = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    // Total jobs posted by user
    const totalJobs = await db.collection('jobs').countDocuments({ postedBy: userId });
    
    // Active jobs
    const activeJobs = await db.collection('jobs').countDocuments({ postedBy: userId, status: 'open' });
    
    // Total views on user's jobs (aggregate sum)
    const viewStats = await db.collection('jobs').aggregate([
      { $match: { postedBy: userId } },
      { $group: { _id: null, totalViews: { $sum: '$viewCount' } } }
    ]).toArray();
    
    const totalViews = viewStats.length > 0 ? viewStats[0].totalViews : 0;
    
    // Get last 5 recent jobs for quick display
    const recentJobs = await db.collection('jobs')
      .find({ postedBy: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      totalJobs,
      activeJobs,
      totalViews,
      recentJobs
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
};

router.get('/', requireAuth, getStats);
router.get('/stats', requireAuth, getStats);

export default router;
