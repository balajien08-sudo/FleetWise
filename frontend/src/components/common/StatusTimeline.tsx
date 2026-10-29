import React from 'react';
import { Check, Clock, Truck, PackageCheck, AlertOctagon } from 'lucide-react';
import { DeliveryStatus } from '../../types';

interface StatusTimelineProps {
  currentStatus: DeliveryStatus;
  scheduledTime?: string;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ currentStatus }) => {
  if (currentStatus === 'cancelled') {
    return (
      <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-sm">
        <AlertOctagon className="w-5 h-5 text-rose-600 flex-shrink-0" />
        <div>
          <span className="font-semibold">Delivery Cancelled</span>
          <p className="text-xs text-rose-600 mt-0.5">Resources have been safely released to the fleet.</p>
        </div>
      </div>
    );
  }

  const steps = [
    { key: 'pending', label: 'Pending', icon: Clock },
    { key: 'assigned', label: 'Assigned', icon: Check },
    { key: 'in_transit', label: 'In Transit', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: PackageCheck },
  ];

  const statusOrder: Record<string, number> = {
    pending: 0,
    assigned: 1,
    in_transit: 2,
    delivered: 3,
  };

  const currentIndex = statusOrder[currentStatus] ?? 0;

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Connecting Progress Bar */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-brand-600 transition-all duration-300 z-0"
          style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
        />

        {steps.map((step, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;
          const StepIcon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-brand-600 text-white'
                    : isCurrent
                    ? 'bg-white border-2 border-brand-600 text-brand-600 ring-4 ring-brand-100'
                    : 'bg-white border-2 border-slate-300 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : <StepIcon className="w-4 h-4" />}
              </div>
              <span
                className={`text-xs mt-2 font-medium tracking-tight whitespace-nowrap ${
                  isCurrent ? 'text-brand-700 font-semibold' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
