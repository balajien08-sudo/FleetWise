import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { api } from '../../api/client';
import { DeliveryPriority } from '../../types';

interface CreateDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateDeliveryModal: React.FC<CreateDeliveryModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [deliveryId, setDeliveryId] = useState('');
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [scheduledTime, setScheduledTime] = useState(() => {
    const d = new Date();
    d.setHours(d.getHours() + 3);
    return d.toISOString().slice(0, 16);
  });
  const [priority, setPriority] = useState<DeliveryPriority>('medium');
  const [requiredCapacity, setRequiredCapacity] = useState('');
  const [packageDescription, setPackageDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickup.trim() || !dropoff.trim()) {
      error('Validation Error', 'Pickup and Drop-off locations are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createDelivery({
        deliveryId: deliveryId.trim() || undefined,
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        scheduledTime: new Date(scheduledTime).toISOString(),
        priority,
        requiredCapacity: requiredCapacity ? Number(requiredCapacity) : undefined,
        packageDescription: packageDescription.trim() || undefined,
      });

      success('Delivery Created', `Delivery successfully scheduled.`);
      onCreated();
      onClose();
      // Reset form
      setDeliveryId('');
      setPickup('');
      setDropoff('');
      setRequiredCapacity('');
      setPackageDescription('');
    } catch (err: any) {
      error('Creation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Delivery Order"
      description="Enter delivery details, scheduled dispatch window, and cargo capacity."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Delivery ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. DEL-208 (Auto-generated if empty)"
              value={deliveryId}
              onChange={(e) => setDeliveryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DeliveryPriority)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Pickup Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Amazon Fulfillment Center, Peenya, Bangalore"
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Drop-Off Destination <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Kempegowda International Airport (Cargo Terminal)"
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Scheduled Date & Time <span className="text-rose-500">*</span>
            </label>
            <input
              type="datetime-local"
              required
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Required Capacity (kg)
            </label>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="e.g. 500"
              value={requiredCapacity}
              onChange={(e) => setRequiredCapacity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Package / Cargo Description
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Electronics, server hardware, temperature-sensitive medicine, etc."
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Create Delivery
          </Button>
        </div>
      </form>
    </Modal>
  );
};
