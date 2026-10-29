import { Request, Response, NextFunction } from 'express';
import * as dashboardService from '../services/dashboardService';

export async function getDashboardSummary(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await dashboardService.getDashboardSummary();
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
}
