import prisma from '../prisma';
import { AppError, VehicleStatus } from '../types';
import { logActivity } from './activityService';

export interface CreateVehicleInput {
  vehicleId?: string;
  registrationNo: string;
  type: string;
  capacity: number;
  status?: VehicleStatus;
  notes?: string;
  actorId?: string;
}

export interface UpdateVehicleInput {
  registrationNo?: string;
  type?: string;
  capacity?: number;
  status?: VehicleStatus;
  notes?: string;
  actorId?: string;
}

export async function createVehicle(input: CreateVehicleInput) {
  let vehicleId = input.vehicleId?.trim();
  if (!vehicleId) {
    const count = await prisma.vehicle.count();
    vehicleId = `V-${100 + count + 1}`;
  }

  const registrationNo = input.registrationNo.trim().toUpperCase();

  // Validate uniqueness
  const existingVehicle = await prisma.vehicle.findFirst({
    where: {
      OR: [{ vehicleId }, { registrationNo }],
    },
  });

  if (existingVehicle) {
    if (existingVehicle.vehicleId === vehicleId) {
      throw new AppError(`Vehicle ID '${vehicleId}' already exists.`, 409, 'DUPLICATE_VEHICLE_ID');
    }
    if (existingVehicle.registrationNo === registrationNo) {
      throw new AppError(
        `Registration number '${registrationNo}' already registered.`,
        409,
        'DUPLICATE_REGISTRATION'
      );
    }
  }

  const capacity = Number(input.capacity);
  if (isNaN(capacity) || capacity <= 0) {
    throw new AppError('Vehicle capacity must be a positive number.', 400, 'INVALID_CAPACITY');
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      vehicleId,
      registrationNo,
      type: input.type.trim(),
      capacity,
      status: input.status || 'available',
      notes: input.notes?.trim() || null,
    },
  });

  await logActivity({
    action: 'VEHICLE_CREATED',
    entityType: 'VEHICLE',
    entityId: vehicle.vehicleId,
    details: { registrationNo, type: vehicle.type, capacity: vehicle.capacity, status: vehicle.status },
    actorId: input.actorId || 'Dispatcher',
  });

  return vehicle;
}

export async function getVehicles(options?: {
  status?: string;
  type?: string;
  search?: string;
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
  if (options?.type && options.type !== 'all') {
    where.type = options.type;
  }
  if (options?.search) {
    where.OR = [
      { vehicleId: { contains: options.search } },
      { registrationNo: { contains: options.search } },
      { type: { contains: options.search } },
      { notes: { contains: options.search } },
    ];
  }

  const orderBy: any = {};
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = options?.sortOrder || 'desc';
  orderBy[sortBy] = sortOrder;

  const [total, vehicles] = await Promise.all([
    prisma.vehicle.count({ where }),
    prisma.vehicle.findMany({
      where,
      include: {
        assignments: {
          where: { assignmentStatus: 'active' },
          include: { delivery: true, driver: true },
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
    vehicles: vehicles.map((v) => ({
      ...v,
      activeAssignment: v.assignments[0] || null,
    })),
  };
}

export async function getVehicleById(vehicleId: string) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vehicleId },
    include: {
      assignments: {
        include: {
          delivery: true,
          driver: true,
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!vehicle) {
    throw new AppError(`Vehicle '${vehicleId}' not found.`, 404, 'VEHICLE_NOT_FOUND');
  }

  const activeAssignment = vehicle.assignments.find((a) => a.assignmentStatus === 'active') || null;

  return {
    ...vehicle,
    activeAssignment,
  };
}

export async function updateVehicle(vehicleId: string, input: UpdateVehicleInput) {
  const existing = await prisma.vehicle.findUnique({
    where: { vehicleId },
    include: {
      assignments: {
        where: {
          assignmentStatus: 'active',
          delivery: { status: { in: ['assigned', 'in_transit'] } },
        },
      },
    },
  });

  if (!existing) {
    throw new AppError(`Vehicle '${vehicleId}' not found.`, 404, 'VEHICLE_NOT_FOUND');
  }

  const hasActiveDelivery = existing.assignments.length > 0;

  // Rule: Cannot change to maintenance or inactive if active delivery exists
  if (
    hasActiveDelivery &&
    input.status &&
    (input.status === 'maintenance' || input.status === 'inactive')
  ) {
    const activeDeliveryId = existing.assignments[0].deliveryId;
    throw new AppError(
      `Cannot change vehicle '${vehicleId}' status to '${input.status}' because it is assigned to active delivery '${activeDeliveryId}'. Resolve the delivery first.`,
      409,
      'VEHICLE_ACTIVE_ASSIGNMENT_CONFLICT',
      { activeDeliveryId, requestedStatus: input.status }
    );
  }

  // Check unique registration if updating
  if (input.registrationNo) {
    const regUpper = input.registrationNo.trim().toUpperCase();
    if (regUpper !== existing.registrationNo) {
      const duplicateReg = await prisma.vehicle.findUnique({
        where: { registrationNo: regUpper },
      });
      if (duplicateReg) {
        throw new AppError(
          `Registration number '${regUpper}' is already registered to vehicle '${duplicateReg.vehicleId}'.`,
          409,
          'DUPLICATE_REGISTRATION'
        );
      }
    }
  }

  const data: any = {};
  if (input.registrationNo) data.registrationNo = input.registrationNo.trim().toUpperCase();
  if (input.type) data.type = input.type.trim();
  if (input.capacity !== undefined) {
    const cap = Number(input.capacity);
    if (isNaN(cap) || cap <= 0) throw new AppError('Invalid capacity', 400, 'INVALID_CAPACITY');
    data.capacity = cap;
  }
  if (input.status) data.status = input.status;
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;

  const updated = await prisma.vehicle.update({
    where: { vehicleId },
    data,
  });

  await logActivity({
    action: 'VEHICLE_UPDATED',
    entityType: 'VEHICLE',
    entityId: vehicleId,
    details: data,
    actorId: input.actorId || 'Dispatcher',
  });

  return updated;
}

export async function deleteVehicle(vehicleId: string, actorId = 'Dispatcher') {
  const vehicle = await prisma.vehicle.findUnique({
    where: { vehicleId },
    include: {
      assignments: {
        where: {
          assignmentStatus: 'active',
          delivery: { status: { in: ['assigned', 'in_transit'] } },
        },
      },
    },
  });

  if (!vehicle) {
    throw new AppError(`Vehicle '${vehicleId}' not found.`, 404, 'VEHICLE_NOT_FOUND');
  }

  if (vehicle.assignments.length > 0 || vehicle.status === 'assigned') {
    const activeDeliveryId = vehicle.assignments[0]?.deliveryId || 'active delivery';
    throw new AppError(
      `Cannot delete vehicle '${vehicleId}' because it is assigned to active delivery '${activeDeliveryId}'. Resolve the delivery first.`,
      409,
      'VEHICLE_ACTIVE_ASSIGNMENT_CONFLICT'
    );
  }

  await prisma.vehicle.delete({
    where: { vehicleId },
  });

  await logActivity({
    action: 'VEHICLE_DELETED',
    entityType: 'VEHICLE',
    entityId: vehicleId,
    details: { registrationNo: vehicle.registrationNo },
    actorId,
  });

  return { success: true, message: `Vehicle '${vehicleId}' deleted successfully.` };
}
