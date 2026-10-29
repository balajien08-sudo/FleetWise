import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as assignmentService from '../services/assignmentService';

const assignSchema = z.object({
  deliveryId: z.string().min(1, 'Delivery ID is required'),
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
});

export async function getAssignments(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, vehicleId, driverId, deliveryId, limit, offset } = req.query;
    const result = await assignmentService.getAssignments({
      status: status as string,
      vehicleId: vehicleId as string,
      driverId: driverId as string,
      deliveryId: deliveryId as string,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
}

export async function createAssignment(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = assignSchema.parse(req.body);
    const result = await assignmentService.assignDelivery(validated);
    res.status(201).json({
      success: true,
      message: `Assignment created successfully.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}
