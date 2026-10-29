import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as vehicleService from '../services/vehicleService';

const createVehicleSchema = z.object({
  vehicleId: z.string().optional(),
  registrationNo: z.string().min(3, 'Registration number must be at least 3 characters'),
  type: z.string().min(2, 'Vehicle type is required'),
  capacity: z.number().positive('Capacity must be greater than zero'),
  status: z.enum(['available', 'assigned', 'maintenance', 'inactive']).optional(),
  notes: z.string().optional(),
});

const updateVehicleSchema = z.object({
  registrationNo: z.string().min(3).optional(),
  type: z.string().min(2).optional(),
  capacity: z.number().positive().optional(),
  status: z.enum(['available', 'assigned', 'maintenance', 'inactive']).optional(),
  notes: z.string().optional(),
});

export async function getVehicles(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, type, search, page, limit, sortBy, sortOrder } = req.query;
    const result = await vehicleService.getVehicles({
      status: status as string,
      type: type as string,
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

export async function getVehicleById(req: Request, res: Response, next: NextFunction) {
  try {
    const vehicle = await vehicleService.getVehicleById(req.params.id);
    res.json({ success: true, data: vehicle });
  } catch (err) {
    next(err);
  }
}

export async function createVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.createVehicle(validated);
    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully.',
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateVehicleSchema.parse(req.body);
    const vehicle = await vehicleService.updateVehicle(req.params.id, validated);
    res.json({
      success: true,
      message: 'Vehicle updated successfully.',
      data: vehicle,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteVehicle(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await vehicleService.deleteVehicle(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
