import prisma from '../prisma';

export async function getDashboardSummary() {
  const [
    totalVehicles,
    availableVehicles,
    assignedVehicles,
    maintenanceVehicles,
    inactiveVehicles,
    totalDrivers,
    availableDrivers,
    assignedDrivers,
    unavailableDrivers,
    totalDeliveries,
    pendingDeliveries,
    assignedDeliveries,
    inTransitDeliveries,
    deliveredDeliveries,
    cancelledDeliveries,
    highPriorityPending,
    recentDeliveries,
    recentAssignments,
    availableVehicleList,
    availableDriverList,
  ] = await Promise.all([
    // Vehicles
    prisma.vehicle.count(),
    prisma.vehicle.count({ where: { status: 'available' } }),
    prisma.vehicle.count({ where: { status: 'assigned' } }),
    prisma.vehicle.count({ where: { status: 'maintenance' } }),
    prisma.vehicle.count({ where: { status: 'inactive' } }),

    // Drivers
    prisma.driver.count(),
    prisma.driver.count({ where: { availabilityStatus: 'available' } }),
    prisma.driver.count({ where: { availabilityStatus: 'assigned' } }),
    prisma.driver.count({ where: { availabilityStatus: 'unavailable' } }),

    // Deliveries
    prisma.delivery.count(),
    prisma.delivery.count({ where: { status: 'pending' } }),
    prisma.delivery.count({ where: { status: 'assigned' } }),
    prisma.delivery.count({ where: { status: 'in_transit' } }),
    prisma.delivery.count({ where: { status: 'delivered' } }),
    prisma.delivery.count({ where: { status: 'cancelled' } }),

    // High/Urgent priority pending deliveries
    prisma.delivery.findMany({
      where: {
        status: 'pending',
        priority: { in: ['urgent', 'high'] },
      },
      orderBy: { scheduledTime: 'asc' },
      take: 5,
    }),

    // Recent deliveries
    prisma.delivery.findMany({
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        assignments: {
          where: { assignmentStatus: 'active' },
          include: { vehicle: true, driver: true },
        },
      },
    }),

    // Recent assignments
    prisma.assignment.findMany({
      orderBy: { assignedAt: 'desc' },
      take: 5,
      include: {
        delivery: true,
        vehicle: true,
        driver: true,
      },
    }),

    // Available vehicles list (for quick dispatch preview)
    prisma.vehicle.findMany({
      where: { status: 'available' },
      take: 6,
      orderBy: { capacity: 'desc' },
    }),

    // Available drivers list (for quick dispatch preview)
    prisma.driver.findMany({
      where: { availabilityStatus: 'available' },
      take: 6,
      orderBy: { name: 'asc' },
    }),
  ]);

  const activeDeliveries = assignedDeliveries + inTransitDeliveries;
  const fleetUtilization = totalVehicles > 0
    ? Math.round((assignedVehicles / totalVehicles) * 100)
    : 0;

  const driverUtilization = totalDrivers > 0
    ? Math.round((assignedDrivers / totalDrivers) * 100)
    : 0;

  // Status distribution for charts
  const statusDistribution = [
    { name: 'Pending', count: pendingDeliveries, color: '#f59e0b' },
    { name: 'Assigned', count: assignedDeliveries, color: '#3b82f6' },
    { name: 'In Transit', count: inTransitDeliveries, color: '#8b5cf6' },
    { name: 'Delivered', count: deliveredDeliveries, color: '#10b981' },
    { name: 'Cancelled', count: cancelledDeliveries, color: '#ef4444' },
  ];

  // Generate 7-day delivery activity trend
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const weeklyTrend = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const nextD = new Date(d);
    nextD.setDate(nextD.getDate() + 1);

    const dayName = daysOfWeek[d.getDay()];

    const [deliveredOnDay, createdOnDay] = await Promise.all([
      prisma.delivery.count({
        where: {
          status: 'delivered',
          updatedAt: { gte: d, lt: nextD },
        },
      }),
      prisma.delivery.count({
        where: {
          createdAt: { gte: d, lt: nextD },
        },
      }),
    ]);

    weeklyTrend.push({
      day: dayName,
      date: d.toISOString().split('T')[0],
      dispatched: createdOnDay,
      delivered: deliveredOnDay,
    });
  }

  return {
    metrics: {
      totalVehicles,
      availableVehicles,
      assignedVehicles,
      maintenanceVehicles,
      inactiveVehicles,
      totalDrivers,
      availableDrivers,
      assignedDrivers,
      unavailableDrivers,
      totalDeliveries,
      activeDeliveries,
      pendingDeliveries,
      deliveredDeliveries,
      cancelledDeliveries,
      fleetUtilization,
      driverUtilization,
    },
    statusDistribution,
    weeklyTrend,
    highPriorityPending,
    recentDeliveries: recentDeliveries.map((d) => ({
      ...d,
      activeAssignment: d.assignments[0] || null,
    })),
    recentAssignments,
    availableResources: {
      vehicles: availableVehicleList,
      drivers: availableDriverList,
    },
  };
}
