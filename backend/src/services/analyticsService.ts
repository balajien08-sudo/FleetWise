import prisma from '../prisma';

export async function getAnalyticsData(dateRange?: '7d' | '30d' | 'all') {
  let dateFilter: any = {};
  const now = new Date();

  if (dateRange === '7d') {
    const past = new Date(now);
    past.setDate(past.getDate() - 7);
    dateFilter = { createdAt: { gte: past } };
  } else if (dateRange === '30d') {
    const past = new Date(now);
    past.setDate(past.getDate() - 30);
    dateFilter = { createdAt: { gte: past } };
  }

  const [
    deliveriesByStatus,
    deliveriesByPriority,
    vehicles,
    drivers,
    allDeliveries,
  ] = await Promise.all([
    prisma.delivery.groupBy({
      by: ['status'],
      where: dateFilter,
      _count: { status: true },
    }),
    prisma.delivery.groupBy({
      by: ['priority'],
      where: dateFilter,
      _count: { priority: true },
    }),
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.delivery.findMany({
      where: dateFilter,
      orderBy: { scheduledTime: 'asc' },
    }),
  ]);

  // Vehicle utilization by type
  const vehicleTypeMap: Record<string, { total: number; assigned: number; available: number; maintenance: number }> = {};
  vehicles.forEach((v) => {
    if (!vehicleTypeMap[v.type]) {
      vehicleTypeMap[v.type] = { total: 0, assigned: 0, available: 0, maintenance: 0 };
    }
    vehicleTypeMap[v.type].total += 1;
    if (v.status === 'assigned') vehicleTypeMap[v.type].assigned += 1;
    else if (v.status === 'available') vehicleTypeMap[v.type].available += 1;
    else if (v.status === 'maintenance') vehicleTypeMap[v.type].maintenance += 1;
  });

  const vehicleUtilizationByType = Object.entries(vehicleTypeMap).map(([type, stats]) => ({
    type,
    total: stats.total,
    assigned: stats.assigned,
    available: stats.available,
    maintenance: stats.maintenance,
    utilizationRate: stats.total > 0 ? Math.round((stats.assigned / stats.total) * 100) : 0,
  }));

  // Driver breakdown
  const driverStats = {
    total: drivers.length,
    available: drivers.filter((d) => d.availabilityStatus === 'available').length,
    assigned: drivers.filter((d) => d.availabilityStatus === 'assigned').length,
    unavailable: drivers.filter((d) => d.availabilityStatus === 'unavailable').length,
  };

  const totalDel = allDeliveries.length;
  const completedDel = allDeliveries.filter((d) => d.status === 'delivered').length;
  const cancelledDel = allDeliveries.filter((d) => d.status === 'cancelled').length;
  const activeDel = allDeliveries.filter((d) => d.status === 'assigned' || d.status === 'in_transit').length;
  const pendingDel = allDeliveries.filter((d) => d.status === 'pending').length;

  const completionRate = totalDel > 0 ? Math.round((completedDel / totalDel) * 100) : 0;
  const cancellationRate = totalDel > 0 ? Math.round((cancelledDel / totalDel) * 100) : 0;

  return {
    summary: {
      totalDeliveries: totalDel,
      completedDeliveries: completedDel,
      cancelledDeliveries: cancelledDel,
      activeDeliveries: activeDel,
      pendingDeliveries: pendingDel,
      completionRate,
      cancellationRate,
    },
    statusBreakdown: deliveriesByStatus.map((d) => ({
      status: d.status,
      count: d._count.status,
    })),
    priorityBreakdown: deliveriesByPriority.map((d) => ({
      priority: d.priority,
      count: d._count.priority,
    })),
    vehicleUtilizationByType,
    driverStats,
  };
}

export async function exportDeliveriesCsv(): Promise<string> {
  const deliveries = await prisma.delivery.findMany({
    include: {
      assignments: {
        where: { assignmentStatus: 'active' },
        include: { vehicle: true, driver: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const headers = [
    'Delivery ID',
    'Pickup Location',
    'Drop-off Location',
    'Scheduled Time',
    'Priority',
    'Status',
    'Required Capacity (kg)',
    'Assigned Vehicle ID',
    'Vehicle Registration',
    'Assigned Driver ID',
    'Driver Name',
    'Created At',
  ];

  const rows = deliveries.map((d) => {
    const active = d.assignments[0];
    return [
      `"${d.deliveryId}"`,
      `"${d.pickup.replace(/"/g, '""')}"`,
      `"${d.dropoff.replace(/"/g, '""')}"`,
      `"${d.scheduledTime.toISOString()}"`,
      `"${d.priority}"`,
      `"${d.status}"`,
      d.requiredCapacity ?? '',
      `"${active?.vehicleId || ''}"`,
      `"${active?.vehicle?.registrationNo || ''}"`,
      `"${active?.driverId || ''}"`,
      `"${active?.driver?.name || ''}"`,
      `"${d.createdAt.toISOString()}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

export async function exportVehiclesCsv(): Promise<string> {
  const vehicles = await prisma.vehicle.findMany({
    include: {
      assignments: {
        where: { assignmentStatus: 'active' },
        include: { delivery: true },
      },
    },
    orderBy: { vehicleId: 'asc' },
  });

  const headers = [
    'Vehicle ID',
    'Registration Number',
    'Type',
    'Capacity (kg)',
    'Status',
    'Active Delivery ID',
    'Notes',
    'Created At',
  ];

  const rows = vehicles.map((v) => {
    const active = v.assignments[0];
    return [
      `"${v.vehicleId}"`,
      `"${v.registrationNo}"`,
      `"${v.type}"`,
      v.capacity,
      `"${v.status}"`,
      `"${active?.deliveryId || ''}"`,
      `"${(v.notes || '').replace(/"/g, '""')}"`,
      `"${v.createdAt.toISOString()}"`,
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
