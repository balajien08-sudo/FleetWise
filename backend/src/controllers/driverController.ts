import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as driverService from '../services/driverService';

const createDriverSchema = z.object({
  driverId: z.string().optional(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(8, 'Phone number must have at least 8 digits'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  availabilityStatus: z.enum(['available', 'assigned', 'unavailable']).optional(),
  notes: z.string().optional(),
});

const updateDriverSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().min(8).optional(),
  email: z.string().email().optional().or(z.literal('')),
  availabilityStatus: z.enum(['available', 'assigned', 'unavailable']).optional(),
  notes: z.string().optional(),
});

export async function getDrivers(req: Request, res: Response, next: NextFunction) {
  try {
    const { availabilityStatus, search, page, limit, sortBy, sortOrder } = req.query;
    const result = await driverService.getDrivers({
      availabilityStatus: availabilityStatus as string,
      search: search as string,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc',
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function getDriverById(req: Request, res: Response, next: NextFunction) {
  try {
    const driver = await driverService.getDriverById(req.params.id);
    res.json({ success: true, data: driver });
  } catch (err) {
    next(err);
  }
}

export async function createDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createDriverSchema.parse(req.body);
    const driver = await driverService.createDriver(validated);
    res.status(201).json({
      success: true,
      message: 'Driver created successfully.',
      data: driver,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateDriverSchema.parse(req.body);
    const driver = await driverService.updateDriver(req.params.id, validated);
    res.json({
      success: true,
      message: 'Driver updated successfully.',
      data: driver,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDriver(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await driverService.deleteDriver(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
