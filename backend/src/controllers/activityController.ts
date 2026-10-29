import { Request, Response, NextFunction } from 'express';
import * as activityService from '../services/activityService';

export async function getActivityLogs(req: Request, res: Response, next: NextFunction) {
  try {
    const { action, entityType, entityId, search, limit, offset } = req.query;
    const result = await activityService.getActivityLogs({
      action: action as string,
      entityType: entityType as string,
      entityId: entityId as string,
      search: search as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}
