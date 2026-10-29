import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import * as deliveryService from '../services/deliveryService';
import * as assignmentService from '../services/assignmentService';

const createDeliverySchema = z.object({
  deliveryId: z.string().optional(),
  pickup: z.string().min(2, 'Pickup location is required'),
  dropoff: z.string().min(2, 'Drop-off location is required'),
  scheduledTime: z.string().min(1, 'Scheduled time is required'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  packageDescription: z.string().optional(),
  requiredCapacity: z.number().positive().optional(),
});

const updateDeliverySchema = z.object({
  pickup: z.string().min(2).optional(),
  dropoff: z.string().min(2).optional(),
  scheduledTime: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  packageDescription: z.string().optional(),
  requiredCapacity: z.number().positive().optional(),
});

const assignDeliverySchema = z.object({
  vehicleId: z.string().min(1, 'Vehicle ID is required'),
  driverId: z.string().min(1, 'Driver ID is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['pending', 'assigned', 'in_transit', 'delivered', 'cancelled']),
});

export async function getDeliveries(req: Request, res: Response, next: NextFunction) {
  try {
    const { status, priority, search, vehicleId, driverId, page, limit, sortBy, sortOrder } = req.query;
    const result = await deliveryService.getDeliveries({
      status: status as string,
      priority: priority as string,
      search: search as string,
      vehicleId: vehicleId as string,
      driverId: driverId as string,
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

export async function getDeliveryById(req: Request, res: Response, next: NextFunction) {
  try {
    const delivery = await deliveryService.getDeliveryById(req.params.id);
    res.json({ success: true, data: delivery });
  } catch (err) {
    next(err);
  }
}

export async function createDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = createDeliverySchema.parse(req.body);
    const delivery = await deliveryService.createDelivery(validated);
    res.status(201).json({
      success: true,
      message: 'Delivery created successfully.',
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateDeliverySchema.parse(req.body);
    const delivery = await deliveryService.updateDelivery(req.params.id, validated);
    res.json({
      success: true,
      message: 'Delivery updated successfully.',
      data: delivery,
    });
  } catch (err) {
    next(err);
  }
}

export async function assignDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = assignDeliverySchema.parse(req.body);
    const deliveryId = req.params.id;

    const result = await assignmentService.assignDelivery({
      deliveryId,
      vehicleId: validated.vehicleId,
      driverId: validated.driverId,
    });

    res.status(200).json({
      success: true,
      message: `Delivery '${deliveryId}' successfully assigned to vehicle '${validated.vehicleId}' and driver '${validated.driverId}'.`,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDeliveryStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const validated = updateStatusSchema.parse(req.body);
    const deliveryId = req.params.id;

    const updated = await deliveryService.updateDeliveryStatus(deliveryId, validated.status);

    res.json({
      success: true,
      message: `Delivery '${deliveryId}' status updated to '${validated.status}'.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDelivery(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await deliveryService.deleteDelivery(req.params.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
