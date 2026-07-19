import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';
import { fromNodeHeaders } from 'better-auth/node';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session || !session.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Attach user to request
    (req as any).user = session.user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized' });
  }
};
