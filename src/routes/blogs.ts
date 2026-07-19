import { Router, Request, Response } from 'express';
import { db } from '../config/db';

const router = Router();

// GET /api/blogs - List all blogs
router.get('/', async (req: Request, res: Response) => {
  try {
    const blogs = await db.collection('blogs')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blogs' });
  }
});

// GET /api/blogs/:slug - Single blog by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const blog = await db.collection('blogs').findOne({ slug });
    
    if (!blog) {
      res.status(404).json({ error: 'Blog not found' });
      return;
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch blog' });
  }
});

export default router;
