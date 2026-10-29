import { Request, Response, NextFunction } from 'express';
import prisma from '../prisma';
import { seedDemoData } from '../../prisma/seed';
import { logActivity } from '../services/activityService';

export async function getHealth(req: Request, res: Response, next: NextFunction) {
  try {
    let dbStatus = 'disconnected';
    let dbLatencyMs = 0;

    const start = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'connected';
    } catch (dbErr) {
      dbStatus = 'error';
    }

    const isHealthy = dbStatus === 'connected';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'FleetWise API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
        provider: 'sqlite',
      },
      memory: process.memoryUsage(),
    });
  } catch (err) {
    next(err);
  }
}

export async function resetDemoData(req: Request, res: Response, next: NextFunction) {
  try {
    // Only permit in non-production environments
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN_IN_PRODUCTION',
          message: 'Demo data reset is disabled in production mode.',
        },
      });
    }

    const summary = await seedDemoData();

    await logActivity({
      action: 'DEMO_DATA_RESET',
      entityType: 'SYSTEM',
      entityId: 'SYSTEM',
      details: { summary, resetAt: new Date().toISOString() },
      actorId: 'Judge/Admin',
    });

    res.json({
      success: true,
      message: 'Demo data has been reset and seeded to clean state.',
      data: summary,
    });
  } catch (err) {
    next(err);
  }
}
