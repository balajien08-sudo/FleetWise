import prisma from '../prisma';

export interface LogActivityParams {
  action: string;
  entityType: 'VEHICLE' | 'DRIVER' | 'DELIVERY' | 'ASSIGNMENT' | 'SYSTEM';
  entityId: string;
  details: Record<string, any> | string;
  actorId?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const detailsString = typeof params.details === 'string'
      ? params.details
      : JSON.stringify(params.details);

    return await prisma.activityLog.create({
      data: {
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        details: detailsString,
        actorId: params.actorId || 'Dispatcher',
      },
    });
  } catch (error) {
    // Non-blocking error for activity logs
    console.error('Failed to write activity log:', error);
  }
}

export async function getActivityLogs(options?: {
  limit?: number;
  offset?: number;
  action?: string;
  entityType?: string;
  entityId?: string;
  search?: string;
}) {
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const where: any = {};
  if (options?.action) where.action = options.action;
  if (options?.entityType) where.entityType = options.entityType;
  if (options?.entityId) where.entityId = options.entityId;
  if (options?.search) {
    where.OR = [
      { details: { contains: options.search } },
      { entityId: { contains: options.search } },
      { action: { contains: options.search } },
    ];
  }

  const [total, logs] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
  ]);

  return { total, logs, limit, offset };
}
