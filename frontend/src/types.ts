export type VehicleStatus = 'available' | 'assigned' | 'maintenance' | 'inactive';
export type DriverStatus = 'available' | 'assigned' | 'unavailable';
export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
export type DeliveryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type AssignmentStatus = 'active' | 'completed' | 'cancelled';

export interface Vehicle {
  id: number;
  vehicleId: string;
  registrationNo: string;
  type: string;
  capacity: number;
  status: VehicleStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  activeAssignment?: Assignment | null;
  assignments?: Assignment[];
}

export interface Driver {
  id: number;
  driverId: string;
  name: string;
  phone: string;
  email?: string | null;
  availabilityStatus: DriverStatus;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  activeAssignment?: Assignment | null;
  assignments?: Assignment[];
}

export interface Delivery {
  id: number;
  deliveryId: string;
  pickup: string;
  dropoff: string;
  scheduledTime: string;
  priority: DeliveryPriority;
  status: DeliveryStatus;
  packageDescription?: string | null;
  requiredCapacity?: number | null;
  createdAt: string;
  updatedAt: string;
  activeAssignment?: Assignment | null;
  assignments?: Assignment[];
}

export interface Assignment {
  id: number;
  deliveryId: string;
  vehicleId: string;
  driverId: string;
  assignedAt: string;
  endedAt?: string | null;
  assignmentStatus: AssignmentStatus;
  delivery?: Delivery;
  vehicle?: Vehicle;
  driver?: Driver;
}

export interface ActivityLog {
  id: number;
  action: string;
  entityType: 'VEHICLE' | 'DRIVER' | 'DELIVERY' | 'ASSIGNMENT' | 'SYSTEM';
  entityId: string;
  details: string;
  actorId?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalVehicles: number;
  availableVehicles: number;
  assignedVehicles: number;
  maintenanceVehicles: number;
  inactiveVehicles: number;
  totalDrivers: number;
  availableDrivers: number;
  assignedDrivers: number;
  unavailableDrivers: number;
  totalDeliveries: number;
  activeDeliveries: number;
  pendingDeliveries: number;
  deliveredDeliveries: number;
  cancelledDeliveries: number;
  fleetUtilization: number;
  driverUtilization: number;
}

export interface DashboardSummary {
  metrics: DashboardMetrics;
  statusDistribution: { name: string; count: number; color: string }[];
  weeklyTrend: { day: string; date: string; dispatched: number; delivered: number }[];
  highPriorityPending: Delivery[];
  recentDeliveries: Delivery[];
  recentAssignments: Assignment[];
  availableResources: {
    vehicles: Vehicle[];
    drivers: Driver[];
  };
}

export interface AnalyticsData {
  summary: {
    totalDeliveries: number;
    completedDeliveries: number;
    cancelledDeliveries: number;
    activeDeliveries: number;
    pendingDeliveries: number;
    completionRate: number;
    cancellationRate: number;
  };
  statusBreakdown: { status: string; count: number }[];
  priorityBreakdown: { priority: string; count: number }[];
  vehicleUtilizationByType: {
    type: string;
    total: number;
    assigned: number;
    available: number;
    maintenance: number;
    utilizationRate: number;
  }[];
  driverStats: {
    total: number;
    available: number;
    assigned: number;
    unavailable: number;
  };
}

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  service: string;
  version: string;
  timestamp: string;
  uptimeSeconds: number;
  database: {
    status: string;
    latencyMs: number;
    provider: string;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
  };
}

export type UserRole = 'ADMIN' | 'DISPATCHER';

export interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt?: string;
}

