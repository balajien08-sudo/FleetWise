import React from 'react';
import { DeliveryStatus, DeliveryPriority, VehicleStatus, DriverStatus } from '../../types';

interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'neutral' | 'purple';
  size?: 'sm' | 'md';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) => {
  const variantStyles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  const dotColors = {
    default: 'bg-slate-400',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    info: 'bg-blue-500',
    danger: 'bg-rose-500',
    neutral: 'bg-slate-400',
    purple: 'bg-purple-500',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />}
      {children}
    </span>
  );
};

export const DeliveryStatusBadge: React.FC<{ status: DeliveryStatus }> = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge variant="warning" dot>Pending</Badge>;
    case 'assigned':
      return <Badge variant="info" dot>Assigned</Badge>;
    case 'in_transit':
      return <Badge variant="purple" dot>In Transit</Badge>;
    case 'delivered':
      return <Badge variant="success" dot>Delivered</Badge>;
    case 'cancelled':
      return <Badge variant="danger" dot>Cancelled</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const PriorityBadge: React.FC<{ priority: DeliveryPriority }> = ({ priority }) => {
  switch (priority) {
    case 'urgent':
      return <Badge variant="danger" dot>Urgent</Badge>;
    case 'high':
      return <Badge variant="warning" dot>High</Badge>;
    case 'medium':
      return <Badge variant="info">Medium</Badge>;
    case 'low':
      return <Badge variant="neutral">Low</Badge>;
    default:
      return <Badge variant="neutral">{priority}</Badge>;
  }
};

export const VehicleStatusBadge: React.FC<{ status: VehicleStatus }> = ({ status }) => {
  switch (status) {
    case 'available':
      return <Badge variant="success" dot>Available</Badge>;
    case 'assigned':
      return <Badge variant="info" dot>Assigned</Badge>;
    case 'maintenance':
      return <Badge variant="warning" dot>Maintenance</Badge>;
    case 'inactive':
      return <Badge variant="neutral" dot>Inactive</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};

export const DriverStatusBadge: React.FC<{ status: DriverStatus }> = ({ status }) => {
  switch (status) {
    case 'available':
      return <Badge variant="success" dot>Available</Badge>;
    case 'assigned':
      return <Badge variant="info" dot>Assigned</Badge>;
    case 'unavailable':
      return <Badge variant="danger" dot>Unavailable</Badge>;
    default:
      return <Badge variant="neutral">{status}</Badge>;
  }
};
