import prisma from '../prisma';
import { AppError } from '../types';
import { logActivity } from './activityService';

export interface AssignDeliveryParams {
  deliveryId: string;
  vehicleId: string;
  driverId: string;
  actorId?: string;
}

export async function assignDelivery(params: AssignDeliveryParams) {
  const { deliveryId, vehicleId, driverId, actorId = 'Dispatcher' } = params;

  // Execute in an atomic transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Delivery
      const delivery = await tx.delivery.findUnique({
        where: { deliveryId },
      });

      if (!delivery) {
        throw new AppError(`Delivery '${deliveryId}' not found.`, 404, 'DELIVERY_NOT_FOUND');
      }

      if (delivery.status !== 'pending') {
        throw new AppError(
          `Assignment rejected: Delivery '${deliveryId}' is already in '${delivery.status}' status. Only pending deliveries can be assigned.`,
          409,
          'DELIVERY_NOT_PENDING',
          { deliveryId, currentStatus: delivery.status }
        );
      }

      // 2. Verify Vehicle
      const vehicle = await tx.vehicle.findUnique({
        where: { vehicleId },
      });

      if (!vehicle) {
        throw new AppError(`Vehicle '${vehicleId}' not found.`, 404, 'VEHICLE_NOT_FOUND');
      }

      if (vehicle.status === 'maintenance') {
        throw new AppError(
          `Assignment rejected: Vehicle '${vehicleId}' (${vehicle.registrationNo}) is currently in maintenance and cannot be dispatched.`,
          409,
          'VEHICLE_IN_MAINTENANCE',
          { vehicleId, status: vehicle.status }
        );
      }

      if (vehicle.status === 'inactive') {
        throw new AppError(
          `Assignment rejected: Vehicle '${vehicleId}' is marked as inactive.`,
          409,
          'VEHICLE_INACTIVE',
          { vehicleId, status: vehicle.status }
        );
      }

      if (vehicle.status !== 'available') {
        throw new AppError(
          `Assignment rejected: Vehicle '${vehicleId}' is currently not available (status: ${vehicle.status}).`,
          409,
          'VEHICLE_NOT_AVAILABLE',
          { vehicleId, status: vehicle.status }
        );
      }

      // Double-check active assignments for this vehicle
      const existingVehicleAssignment = await tx.assignment.findFirst({
        where: {
          vehicleId,
          assignmentStatus: 'active',
          delivery: {
            status: { in: ['assigned', 'in_transit'] },
          },
        },
        include: { delivery: true },
      });

      if (existingVehicleAssignment) {
        throw new AppError(
          `Assignment rejected: Vehicle '${vehicleId}' is already assigned to active delivery '${existingVehicleAssignment.deliveryId}'.`,
          409,
          'VEHICLE_ALREADY_ASSIGNED',
          { vehicleId, activeDeliveryId: existingVehicleAssignment.deliveryId }
        );
      }

      // 3. Verify Driver
      const driver = await tx.driver.findUnique({
        where: { driverId },
      });

      if (!driver) {
        throw new AppError(`Driver '${driverId}' not found.`, 404, 'DRIVER_NOT_FOUND');
      }

      if (driver.availabilityStatus === 'unavailable') {
        throw new AppError(
          `Assignment rejected: Driver '${driver.name}' (${driverId}) is marked as unavailable.`,
          409,
          'DRIVER_UNAVAILABLE',
          { driverId, status: driver.availabilityStatus }
        );
      }

      if (driver.availabilityStatus !== 'available') {
        throw new AppError(
          `Assignment rejected: Driver '${driver.name}' (${driverId}) is currently not available (status: ${driver.availabilityStatus}).`,
          409,
          'DRIVER_NOT_AVAILABLE',
          { driverId, status: driver.availabilityStatus }
        );
      }

      // Double-check active assignments for this driver
      const existingDriverAssignment = await tx.assignment.findFirst({
        where: {
          driverId,
          assignmentStatus: 'active',
          delivery: {
            status: { in: ['assigned', 'in_transit'] },
          },
        },
        include: { delivery: true },
      });

      if (existingDriverAssignment) {
        throw new AppError(
          `Assignment rejected: Driver '${driver.name}' (${driverId}) is already assigned to active delivery '${existingDriverAssignment.deliveryId}'.`,
          409,
          'DRIVER_ALREADY_ASSIGNED',
          { driverId, activeDeliveryId: existingDriverAssignment.deliveryId }
        );
      }

      // 4. Capacity validation (if delivery specifies required capacity)
      if (delivery.requiredCapacity && delivery.requiredCapacity > vehicle.capacity) {
        throw new AppError(
          `Assignment rejected: Delivery requires ${delivery.requiredCapacity} kg capacity, but vehicle '${vehicleId}' only has ${vehicle.capacity} kg capacity.`,
          409,
          'VEHICLE_OVERLOAD',
          { requiredCapacity: delivery.requiredCapacity, vehicleCapacity: vehicle.capacity }
        );
      }

      // 5. Create Assignment record
      const assignment = await tx.assignment.create({
        data: {
          deliveryId,
          vehicleId,
          driverId,
          assignedAt: new Date(),
          assignmentStatus: 'active',
        },
      });

      // 6. Update Delivery Status -> assigned
      await tx.delivery.update({
        where: { deliveryId },
        data: { status: 'assigned' },
      });

      // 7. Update Vehicle Status -> assigned
      await tx.vehicle.update({
        where: { vehicleId },
        data: { status: 'assigned' },
      });

      // 8. Update Driver Availability -> assigned
      await tx.driver.update({
        where: { driverId },
        data: { availabilityStatus: 'assigned' },
      });

      // 9. Create Activity Log inside the transaction
      await tx.activityLog.create({
        data: {
          action: 'ASSIGNMENT_CREATED',
          entityType: 'ASSIGNMENT',
          entityId: deliveryId,
          details: JSON.stringify({
            assignmentId: assignment.id,
            deliveryId,
            vehicleId,
            vehicleRegistration: vehicle.registrationNo,
            driverId,
            driverName: driver.name,
            pickup: delivery.pickup,
            dropoff: delivery.dropoff,
            priority: delivery.priority,
          }),
          actorId,
        },
      });

      return {
        assignment,
        delivery: { ...delivery, status: 'assigned' },
        vehicle: { ...vehicle, status: 'assigned' },
        driver: { ...driver, availabilityStatus: 'assigned' },
      };
    });

    return result;
  } catch (error: any) {
    // If the error is a conflict or validation error, record a failed audit attempt outside the rollback
    if (error instanceof AppError && error.statusCode === 409) {
      await logActivity({
        action: 'ASSIGNMENT_REJECTED',
        entityType: 'ASSIGNMENT',
        entityId: deliveryId,
        details: {
          reason: error.message,
          code: error.code,
          vehicleId,
          driverId,
          deliveryId,
        },
        actorId,
      });
    }
    throw error;
  }
}

export async function getAssignments(options?: {
  status?: string;
  vehicleId?: string;
  driverId?: string;
  deliveryId?: string;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};
  if (options?.status) where.assignmentStatus = options.status;
  if (options?.vehicleId) where.vehicleId = options.vehicleId;
  if (options?.driverId) where.driverId = options.driverId;
  if (options?.deliveryId) where.deliveryId = options.deliveryId;

  const [total, assignments] = await Promise.all([
    prisma.assignment.count({ where }),
    prisma.assignment.findMany({
      where,
      include: {
        delivery: true,
        vehicle: true,
        driver: true,
      },
      orderBy: { assignedAt: 'desc' },
      take: options?.limit || 50,
      skip: options?.offset || 0,
    }),
  ]);

  return { total, assignments, limit: options?.limit || 50, offset: options?.offset || 0 };
}
