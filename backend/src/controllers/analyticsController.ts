import { Request, Response, NextFunction } from 'express';
import * as analyticsService from '../services/analyticsService';

export async function getAnalytics(req: Request, res: Response, next: NextFunction) {
  try {
    const { range } = req.query;
    const data = await analyticsService.getAnalyticsData(range as '7d' | '30d' | 'all');
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

export async function exportDeliveriesCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await analyticsService.exportDeliveriesCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleetwise-deliveries.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}

export async function exportVehiclesCsv(req: Request, res: Response, next: NextFunction) {
  try {
    const csv = await analyticsService.exportVehiclesCsv();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="fleetwise-vehicles.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
}
