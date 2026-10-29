export class AppError extends Error {
  statusCode: number;
  code?: string;
  details?: any;

  constructor(message: string, statusCode = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code?: string;
    message: string;
    details?: any;
  };
}

export type DeliveryStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
export type DeliveryPriority = 'low' | 'medium' | 'high' | 'urgent';
export type VehicleStatus = 'available' | 'assigned' | 'maintenance' | 'inactive';
export type DriverStatus = 'available' | 'assigned' | 'unavailable';
export type AssignmentStatus = 'active' | 'completed' | 'cancelled';
