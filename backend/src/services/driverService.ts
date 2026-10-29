import prisma from '../prisma';
import { AppError, DriverStatus } from '../types';
import { logActivity } from './activityService';

export interface CreateDriverInput {
  driverId?: string;
  name: string;
  phone: string;
  email?: string;
  availabilityStatus?: DriverStatus;
  notes?: string;
  actorId?: string;
}

export interface UpdateDriverInput {
  name?: string;
  phone?: string;
  email?: string;
  availabilityStatus?: DriverStatus;
  notes?: string;
  actorId?: string;
}

export async function createDriver(input: CreateDriverInput) {
  let driverId = input.driverId?.trim();
  if (!driverId) {
    const count = await prisma.driver.count();
    driverId = `DRV-${100 + count + 1}`;
  }

  // Validate unique driverId
  const existingDriver = await prisma.driver.findUnique({
    where: { driverId },
  });

  if (existingDriver) {
    throw new AppError(`Driver ID '${driverId}' already exists.`, 409, 'DUPLICATE_DRIVER_ID');
  }

  const phone = input.phone.trim();
  if (!phone || phone.length < 8) {
    throw new AppError('Valid phone number is required (min 8 digits).', 400, 'INVALID_PHONE');
  }

  const driver = await prisma.driver.create({
    data: {
      driverId,
      name: input.name.trim(),
      phone,
      email: input.email?.trim() || null,
      availabilityStatus: input.availabilityStatus || 'available',
      notes: input.notes?.trim() || null,
    },
  });

  await logActivity({
    action: 'DRIVER_CREATED',
    entityType: 'DRIVER',
    entityId: driver.driverId,
    details: { name: driver.name, phone: driver.phone, status: driver.availabilityStatus },
    actorId: input.actorId || 'Dispatcher',
  });

  return driver;
}

export async function getDrivers(options?: {
  availabilityStatus?: string;
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
  if (options?.availabilityStatus && options.availabilityStatus !== 'all') {
    where.availabilityStatus = options.availabilityStatus;
  }
  if (options?.search) {
    where.OR = [
      { driverId: { contains: options.search } },
      { name: { contains: options.search } },
      { phone: { contains: options.search } },
      { email: { contains: options.search } },
    ];
  }

  const orderBy: any = {};
  const sortBy = options?.sortBy || 'createdAt';
  const sortOrder = options?.sortOrder || 'desc';
  orderBy[sortBy] = sortOrder;

  const [total, drivers] = await Promise.all([
    prisma.driver.count({ where }),
    prisma.driver.findMany({
      where,
      include: {
        assignments: {
          where: { assignmentStatus: 'active' },
          include: { delivery: true, vehicle: true },
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
    drivers: drivers.map((d) => ({
      ...d,
      activeAssignment: d.assignments[0] || null,
    })),
  };
}

export async function getDriverById(driverId: string) {
  const driver = await prisma.driver.findUnique({
    where: { driverId },
    include: {
      assignments: {
        include: {
          delivery: true,
          vehicle: true,
        },
        orderBy: { assignedAt: 'desc' },
      },
    },
  });

  if (!driver) {
    throw new AppError(`Driver '${driverId}' not found.`, 404, 'DRIVER_NOT_FOUND');
  }

  const activeAssignment = driver.assignments.find((a) => a.assignmentStatus === 'active') || null;

  return {
    ...driver,
    activeAssignment,
  };
}

export async function updateDriver(driverId: string, input: UpdateDriverInput) {
  const existing = await prisma.driver.findUnique({
    where: { driverId },
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
    throw new AppError(`Driver '${driverId}' not found.`, 404, 'DRIVER_NOT_FOUND');
  }

  const hasActiveDelivery = existing.assignments.length > 0;

  // Rule: Cannot mark unavailable if driver has active delivery
  if (hasActiveDelivery && input.availabilityStatus && input.availabilityStatus === 'unavailable') {
    const activeDeliveryId = existing.assignments[0].deliveryId;
    throw new AppError(
      `Cannot mark driver '${driverId}' as unavailable because they are assigned to active delivery '${activeDeliveryId}'. Resolve the delivery first.`,
      409,
      'DRIVER_ACTIVE_ASSIGNMENT_CONFLICT',
      { activeDeliveryId, requestedStatus: input.availabilityStatus }
    );
  }

  const data: any = {};
  if (input.name) data.name = input.name.trim();
  if (input.phone) {
    const phone = input.phone.trim();
    if (phone.length < 8) throw new AppError('Valid phone number is required', 400, 'INVALID_PHONE');
    data.phone = phone;
  }
  if (input.email !== undefined) data.email = input.email?.trim() || null;
  if (input.availabilityStatus) data.availabilityStatus = input.availabilityStatus;
  if (input.notes !== undefined) data.notes = input.notes?.trim() || null;

  const updated = await prisma.driver.update({
    where: { driverId },
    data,
  });

  await logActivity({
    action: 'DRIVER_UPDATED',
    entityType: 'DRIVER',
    entityId: driverId,
    details: data,
    actorId: input.actorId || 'Dispatcher',
  });

  return updated;
}

export async function deleteDriver(driverId: string, actorId = 'Dispatcher') {
  const driver = await prisma.driver.findUnique({
    where: { driverId },
    include: {
      assignments: {
        where: {
          assignmentStatus: 'active',
          delivery: { status: { in: ['assigned', 'in_transit'] } },
        },
      },
    },
  });

  if (!driver) {
    throw new AppError(`Driver '${driverId}' not found.`, 404, 'DRIVER_NOT_FOUND');
  }

  if (driver.assignments.length > 0 || driver.availabilityStatus === 'assigned') {
    const activeDeliveryId = driver.assignments[0]?.deliveryId || 'active delivery';
    throw new AppError(
      `Cannot delete driver '${driverId}' because they are assigned to active delivery '${activeDeliveryId}'. Resolve the delivery first.`,
      409,
      'DRIVER_ACTIVE_ASSIGNMENT_CONFLICT'
    );
  }

  await prisma.driver.delete({
    where: { driverId },
  });

  await logActivity({
    action: 'DRIVER_DELETED',
    entityType: 'DRIVER',
    entityId: driverId,
    details: { name: driver.name },
    actorId,
  });

  return { success: true, message: `Driver '${driverId}' deleted successfully.` };
}
