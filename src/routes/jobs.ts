import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { db } from '../config/db';

const router = Router();

// GET /api/jobs - List all jobs with search, filter, pagination
router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, category, type, sort, page = '1', limit = '6' } = req.query;
    const query: any = { status: 'open' };

    if (search) {
      query.title = { $regex: search as string, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }

    const sortOptions: any = {};
    if (sort === 'salary-desc') {
      sortOptions.salary = -1; // Note: salary is a string in DB so this might not sort perfectly without a numeric field, but for now we'll do standard string sort or just createdAt
    } else {
      sortOptions.createdAt = -1;
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

    const jobs = await db.collection('jobs')
      .find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit as string))
      .toArray();

    const total = await db.collection('jobs').countDocuments(query);

    res.json({ jobs, total, page: parseInt(page as string), limit: parseInt(limit as string) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// GET /api/jobs/:id - Single job details
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    // Increment view count
    await db.collection('jobs').updateOne(
      { _id: new ObjectId(id) },
      { $inc: { viewCount: 1 } }
    );

    const job = await db.collection('jobs').findOne({ _id: new ObjectId(id) });
    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(job);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

// GET /api/jobs/related/:id - Related jobs
router.get('/related/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    const currentJob = await db.collection('jobs').findOne({ _id: new ObjectId(id) });
    if (!currentJob) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    const relatedJobs = await db.collection('jobs')
      .find({
        category: currentJob.category,
        _id: { $ne: new ObjectId(id) },
        status: 'open'
      })
      .limit(3)
      .toArray();

    res.json(relatedJobs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch related jobs' });
  }
});

export default router;
