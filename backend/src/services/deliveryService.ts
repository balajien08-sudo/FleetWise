import prisma from '../prisma';
import { AppError, DeliveryStatus } from '../types';
import { logActivity } from './activityService';

export interface CreateDeliveryInput {
  deliveryId?: string;
  pickup: string;
  dropoff: string;
  scheduledTime: string | Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  packageDescription?: string;
  requiredCapacity?: number;
  actorId?: string;
}

export interface UpdateDeliveryInput {
  pickup?: string;
  dropoff?: string;
  scheduledTime?: string | Date;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  packageDescription?: string;
  requiredCapacity?: number;
  actorId?: string;
}

export async function createDelivery(input: CreateDeliveryInput) {
  // If deliveryId is not supplied, generate one like "DEL-301"
  let deliveryId = input.deliveryId?.trim();
  if (!deliveryId) {
    const count = await prisma.delivery.count();
    deliveryId = `DEL-${200 + count + 1}`;
  }

  // Check uniqueness
  const existing = await prisma.delivery.findUnique({
    where: { deliveryId },
  });
  if (existing) {
    throw new AppError(`Delivery ID '${deliveryId}' already exists.`, 409, 'DUPLICATE_DELIVERY_ID');
  }

  const scheduledTime = new Date(input.scheduledTime);
  if (isNaN(scheduledTime.getTime())) {
    throw new AppError('Invalid scheduled time format.', 400, 'INVALID_DATE');
  }

  const delivery = await prisma.delivery.create({
    data: {
      deliveryId,
      pickup: input.pickup.trim(),
      dropoff: input.dropoff.trim(),
      scheduledTime,
      priority: input.priority || 'medium',
      status: 'pending',
      packageDescription: input.packageDescription?.trim() || null,
      requiredCapacity: input.requiredCapacity ? Number(input.requiredCapacity) : null,
    },
  });

  await logActivity({
    action: 'DELIVERY_CREATED',
    entityType: 'DELIVERY',
    entityId: delivery.deliveryId,
    details: {
      pickup: delivery.pickup,
      dropoff: delivery.dropoff,
      priority: delivery.priority,
      scheduledTime: delivery.scheduledTime,
    },
    actorId: input.actorId || 'Dispatcher',
  });

  return delivery;
}

export async function getDeliveries(options?: {
  status?: string;
  priority?: string;
  search?: string;
  vehicleId?: string;
  driverId?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const page = Math.max(1, options?.page || 1);
  const limit = Math.max(1, options?.limit || 20);
  const skip = (page - 1) * limit;

  const where: any = {};
  if (options?.status && options.status !== 'all') {
    where.status = options.status;
  }
  if (options?.priority && options.priority !== 'all') {
    where.priority = options.priority;
  }
  if (options?.search) {
    where.OR = [
      { deliveryId: { contains: options.search } },
      { pickup: { contains: options.search } },
      { dropoff: { contains: options.search } },
      { packageDescription: { contains: options.search } },
    ];
  }

  if (options?.vehicleId || options?.driverId) {
    where.assignments = {
      some: {
        ...(options.vehicleId ? { vehicleId: options.vehicleId } : {}),
        ...(options.driverId ? { driverId: options.driverId } : {}),
        assignmentStatus: 'active',
      },
    };
  }

  const orderBy: any = {};
  const sortBy = options?.sortBy || 'scheduledTime';
  const sortOrder = options?.sortOrder || 'desc';
  orderBy[sortBy] = sortOrder;

  const [total, deliveries] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.findMany({
      where,
      include: {
        assignments: {
          include: {
            vehicle: true,
            driver: true,
          },
          orderBy: { assignedAt: 'desc' },
        },
      },
      orderBy,
      take: limit,
      skip,
    }),
  ]);

  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    deliveries,
  };
}

export async function getDeliveryById(deliveryId: string) {
  const delivery = await prisma.delivery.findUnique({
    where: { deliveryId },
    include: {
      assignments: {
        include: {
          vehicle: true,
          driver: true,
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!delivery) {
    throw new AppError(`Delivery '${deliveryId}' not found.`, 404, 'DELIVERY_NOT_FOUND');
  }

  const activeAssignment = delivery.assignments.find((a) => a.assignmentStatus === 'active') || null;

  return {
    ...delivery,
    activeAssignment,
  };
}

export async function updateDelivery(deliveryId: string, input: UpdateDeliveryInput) {
  const existing = await prisma.delivery.findUnique({
    where: { deliveryId },
  });

  if (!existing) {
    throw new AppError(`Delivery '${deliveryId}' not found.`, 404, 'DELIVERY_NOT_FOUND');
  }

  // Prevent modifying critical fields if active or completed
  if (existing.status === 'in_transit' || existing.status === 'delivered' || existing.status === 'cancelled') {
    throw new AppError(
      `Cannot modify delivery details while in status '${existing.status}'.`,
      400,
      'IMMUTABLE_DELIVERY_STATE'
    );
  }

  const data: any = {};
  if (input.pickup !== undefined) data.pickup = input.pickup.trim();
  if (input.dropoff !== undefined) data.dropoff = input.dropoff.trim();
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.packageDescription !== undefined) data.packageDescription = input.packageDescription.trim();
  if (input.requiredCapacity !== undefined) data.requiredCapacity = Number(input.requiredCapacity);
  if (input.scheduledTime !== undefined) {
    const st = new Date(input.scheduledTime);
    if (isNaN(st.getTime())) throw new AppError('Invalid scheduled time', 400, 'INVALID_DATE');
    data.scheduledTime = st;
  }

  const updated = await prisma.delivery.update({
    where: { deliveryId },
    data,
  });

  await logActivity({
    action: 'DELIVERY_UPDATED',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    details: data,
    actorId: input.actorId || 'Dispatcher',
  });

  return updated;
}

export async function updateDeliveryStatus(
  deliveryId: string,
  targetStatus: DeliveryStatus,
  actorId = 'Dispatcher'
) {
  // Execute within atomic transaction for status transition and resource release
  return await prisma.$transaction(async (tx) => {
    const delivery = await tx.delivery.findUnique({
      where: { deliveryId },
      include: {
        assignments: {
          where: { assignmentStatus: 'active' },
          include: { vehicle: true, driver: true },
        },
      },
    });

    if (!delivery) {
      throw new AppError(`Delivery '${deliveryId}' not found.`, 404, 'DELIVERY_NOT_FOUND');
    }

    const currentStatus = delivery.status;

    // Terminal statuses cannot be modified
    if (currentStatus === 'delivered' || currentStatus === 'cancelled') {
      throw new AppError(
        `Cannot update status from terminal status '${currentStatus}'.`,
        400,
        'TERMINAL_STATUS_IMMUTABLE'
      );
    }

    // Direct assignment via status update is strictly forbidden
    if (targetStatus === 'assigned') {
      throw new AppError(
        `Status 'assigned' cannot be set directly. Please assign a vehicle and driver via the dispatch workflow.`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Direct transition Pending -> Delivered is strictly forbidden
    if (currentStatus === 'pending' && targetStatus === 'delivered') {
      throw new AppError(
        `Invalid status transition: Pending delivery '${deliveryId}' cannot be marked directly as delivered. Must be assigned and dispatched first.`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Direct transition Pending -> In Transit is forbidden
    if (currentStatus === 'pending' && targetStatus === 'in_transit') {
      throw new AppError(
        `Invalid status transition: Pending delivery '${deliveryId}' must be assigned to a vehicle and driver before going in transit.`,
        400,
        'INVALID_STATUS_TRANSITION'
      );
    }

    // Assigned -> In Transit
    if (currentStatus === 'assigned' && targetStatus === 'in_transit') {
      const updated = await tx.delivery.update({
        where: { deliveryId },
        data: { status: 'in_transit' },
      });

      await tx.activityLog.create({
        data: {
          action: 'STATUS_UPDATED',
          entityType: 'DELIVERY',
          entityId: deliveryId,
          details: JSON.stringify({
            from: currentStatus,
            to: targetStatus,
            message: `Delivery ${deliveryId} is now In Transit.`,
          }),
          actorId,
        },
      });

      return updated;
    }

    // In Transit -> Delivered (Resource Release)
    if (currentStatus === 'in_transit' && targetStatus === 'delivered') {
      const updated = await tx.delivery.update({
        where: { deliveryId },
        data: { status: 'delivered' },
      });

      // Close active assignment
      const activeAssignment = delivery.assignments[0];
      if (activeAssignment) {
        await tx.assignment.update({
          where: { id: activeAssignment.id },
          data: {
            endedAt: new Date(),
            assignmentStatus: 'completed',
          },
        });

        // Release vehicle if status is currently assigned
        if (activeAssignment.vehicle.status === 'assigned') {
          await tx.vehicle.update({
            where: { vehicleId: activeAssignment.vehicleId },
            data: { status: 'available' },
          });
        }

        // Release driver if status is currently assigned
        if (activeAssignment.driver.availabilityStatus === 'assigned') {
          await tx.driver.update({
            where: { driverId: activeAssignment.driverId },
            data: { availabilityStatus: 'available' },
          });
        }

        await tx.activityLog.create({
          data: {
            action: 'RESOURCES_RELEASED',
            entityType: 'ASSIGNMENT',
            entityId: deliveryId,
            details: JSON.stringify({
              deliveryId,
              releasedVehicleId: activeAssignment.vehicleId,
              releasedDriverId: activeAssignment.driverId,
              reason: 'Delivery completed successfully.',
            }),
            actorId,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          action: 'STATUS_UPDATED',
          entityType: 'DELIVERY',
          entityId: deliveryId,
          details: JSON.stringify({
            from: currentStatus,
            to: targetStatus,
            message: `Delivery ${deliveryId} successfully delivered. Resources released.`,
          }),
          actorId,
        },
      });

      return updated;
    }

    // Cancellation: from pending or assigned
    if (targetStatus === 'cancelled') {
      if (currentStatus === 'in_transit') {
        throw new AppError(
          `Cannot cancel delivery '${deliveryId}' while in transit. Contact operations directly.`,
          400,
          'IN_TRANSIT_CANCELLATION_RESTRICTED'
        );
      }

      const updated = await tx.delivery.update({
        where: { deliveryId },
        data: { status: 'cancelled' },
      });

      // If assigned, release resources
      const activeAssignment = delivery.assignments[0];
      if (activeAssignment) {
        await tx.assignment.update({
          where: { id: activeAssignment.id },
          data: {
            endedAt: new Date(),
            assignmentStatus: 'cancelled',
          },
        });

        if (activeAssignment.vehicle.status === 'assigned') {
          await tx.vehicle.update({
            where: { vehicleId: activeAssignment.vehicleId },
            data: { status: 'available' },
          });
        }

        if (activeAssignment.driver.availabilityStatus === 'assigned') {
          await tx.driver.update({
            where: { driverId: activeAssignment.driverId },
            data: { availabilityStatus: 'available' },
          });
        }

        await tx.activityLog.create({
          data: {
            action: 'RESOURCES_RELEASED',
            entityType: 'ASSIGNMENT',
            entityId: deliveryId,
            details: JSON.stringify({
              deliveryId,
              releasedVehicleId: activeAssignment.vehicleId,
              releasedDriverId: activeAssignment.driverId,
              reason: 'Delivery was cancelled.',
            }),
            actorId,
          },
        });
      }

      await tx.activityLog.create({
        data: {
          action: 'DELIVERY_CANCELLED',
          entityType: 'DELIVERY',
          entityId: deliveryId,
          details: JSON.stringify({
            from: currentStatus,
            to: 'cancelled',
            releasedResources: !!activeAssignment,
          }),
          actorId,
        },
      });

      return updated;
    }

    // Any other transition is invalid
    throw new AppError(
      `Invalid status transition from '${currentStatus}' to '${targetStatus}'.`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  });
}

export async function deleteDelivery(deliveryId: string, actorId = 'Dispatcher') {
  const delivery = await prisma.delivery.findUnique({
    where: { deliveryId },
  });

  if (!delivery) {
    throw new AppError(`Delivery '${deliveryId}' not found.`, 404, 'DELIVERY_NOT_FOUND');
  }

  if (delivery.status === 'assigned' || delivery.status === 'in_transit') {
    throw new AppError(
      `Cannot delete delivery '${deliveryId}' while in active status '${delivery.status}'. Cancel the delivery first to release resources safely.`,
      409,
      'ACTIVE_DELIVERY_DELETION_FORBIDDEN'
    );
  }

  await prisma.delivery.delete({
    where: { deliveryId },
  });

  await logActivity({
    action: 'DELIVERY_DELETED',
    entityType: 'DELIVERY',
    entityId: deliveryId,
    details: { deliveryId, status: delivery.status },
    actorId,
  });

  return { success: true, message: `Delivery '${deliveryId}' deleted successfully.` };
}
