import {
  Vehicle,
  Driver,
  Delivery,
  Assignment,
  ActivityLog,
  DashboardSummary,
  AnalyticsData,
  SystemHealth,
  User,
  UserRole,
} from '../types';

const BASE_URL = '/api';

export class ApiError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('fleetwise_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {}),
  };

  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send and receive HttpOnly session cookies
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = json?.error?.message || `Request failed with status ${res.status}`;
      const errorCode = json?.error?.code;
      const errorDetails = json?.error?.details;
      throw new ApiError(errorMsg, res.status, errorCode, errorDetails);
    }

    return json;
  } catch (error: any) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error.message || 'Unable to connect to FleetWise backend server.',
      0,
      'NETWORK_ERROR'
    );
  }
}

export const api = {
  // Authentication
  auth: {
    login: (credentials: { identifier: string; password: string }) =>
      request<{ success: boolean; data: { user: User; token: string; expiresAt: string }; message: string }>(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(credentials),
        }
      ),
    logout: () =>
      request<{ success: boolean; message: string }>('/auth/logout', {
        method: 'POST',
      }),
    getMe: () =>
      request<{ success: boolean; data: { user: User } }>('/auth/me'),
  },

  // User Management (Admin Only)
  users: {
    getAll: () => request<{ success: boolean; data: User[] }>('/users'),
    create: (data: { email: string; username: string; name: string; password: string; role: UserRole }) =>
      request<{ success: boolean; data: User; message: string }>('/users', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { name?: string; role?: UserRole; isActive?: boolean; password?: string }) =>
      request<{ success: boolean; data: User; message: string }>(`/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<{ success: boolean; message: string }>(`/users/${id}`, {
        method: 'DELETE',
      }),
  },

  // System Health
  getHealth: () => request<SystemHealth>('/health'),
  resetDemoData: () => request<{ success: boolean; message: string; data: any }>('/system/reset-demo', { method: 'POST' }),

  // Dashboard
  getDashboardSummary: () => request<{ success: boolean; data: DashboardSummary }>('/dashboard/summary'),

  // Vehicles
  getVehicles: (params?: { status?: string; type?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.type) q.append('type', params.type);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ success: boolean; total: number; page: number; limit: number; totalPages: number; vehicles: Vehicle[] }>(
      `/vehicles?${q.toString()}`
    );
  },
  getVehicleById: (id: string) => request<{ success: boolean; data: Vehicle }>(`/vehicles/${id}`),
  createVehicle: (data: Partial<Vehicle>) => request<{ success: boolean; message: string; data: Vehicle }>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateVehicle: (id: string, data: Partial<Vehicle>) => request<{ success: boolean; message: string; data: Vehicle }>(`/vehicles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteVehicle: (id: string) => request<{ success: boolean; message: string }>(`/vehicles/${id}`, {
    method: 'DELETE',
  }),

  // Drivers
  getDrivers: (params?: { availabilityStatus?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.availabilityStatus) q.append('availabilityStatus', params.availabilityStatus);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ success: boolean; total: number; page: number; limit: number; totalPages: number; drivers: Driver[] }>(
      `/drivers?${q.toString()}`
    );
  },
  getDriverById: (id: string) => request<{ success: boolean; data: Driver }>(`/drivers/${id}`),
  createDriver: (data: Partial<Driver>) => request<{ success: boolean; message: string; data: Driver }>('/drivers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDriver: (id: string, data: Partial<Driver>) => request<{ success: boolean; message: string; data: Driver }>(`/drivers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  deleteDriver: (id: string) => request<{ success: boolean; message: string }>(`/drivers/${id}`, {
    method: 'DELETE',
  }),

  // Deliveries
  getDeliveries: (params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.priority) q.append('priority', params.priority);
    if (params?.search) q.append('search', params.search);
    if (params?.page) q.append('page', String(params.page));
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ success: boolean; total: number; page: number; limit: number; totalPages: number; deliveries: Delivery[] }>(
      `/deliveries?${q.toString()}`
    );
  },
  getDeliveryById: (id: string) => request<{ success: boolean; data: Delivery }>(`/deliveries/${id}`),
  createDelivery: (data: Partial<Delivery>) => request<{ success: boolean; message: string; data: Delivery }>('/deliveries', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDelivery: (id: string, data: Partial<Delivery>) => request<{ success: boolean; message: string; data: Delivery }>(`/deliveries/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  }),
  assignDelivery: (deliveryId: string, vehicleId: string, driverId: string) =>
    request<{ success: boolean; message: string; data: any }>(`/deliveries/${deliveryId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ vehicleId, driverId }),
    }),
  updateDeliveryStatus: (deliveryId: string, status: string) =>
    request<{ success: boolean; message: string; data: Delivery }>(`/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
  deleteDelivery: (id: string) => request<{ success: boolean; message: string }>(`/deliveries/${id}`, {
    method: 'DELETE',
  }),

  // Assignments
  getAssignments: (params?: { status?: string; vehicleId?: string; driverId?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.status) q.append('status', params.status);
    if (params?.vehicleId) q.append('vehicleId', params.vehicleId);
    if (params?.driverId) q.append('driverId', params.driverId);
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ success: boolean; total: number; assignments: Assignment[] }>(`/assignments?${q.toString()}`);
  },

  // Activity Log
  getActivityLogs: (params?: { action?: string; entityType?: string; search?: string; limit?: number }) => {
    const q = new URLSearchParams();
    if (params?.action) q.append('action', params.action);
    if (params?.entityType) q.append('entityType', params.entityType);
    if (params?.search) q.append('search', params.search);
    if (params?.limit) q.append('limit', String(params.limit));
    return request<{ success: boolean; total: number; logs: ActivityLog[] }>(`/activity?${q.toString()}`);
  },

  // Analytics
  getAnalytics: (range?: string) => {
    const q = range ? `?range=${range}` : '';
    return request<{ success: boolean; data: AnalyticsData }>(`/analytics${q}`);
  },
};
