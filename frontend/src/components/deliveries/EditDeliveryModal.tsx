import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { api } from '../../api/client';
import { Delivery, DeliveryPriority } from '../../types';

interface EditDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  delivery: Delivery | null;
}

export const EditDeliveryModal: React.FC<EditDeliveryModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  delivery,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [priority, setPriority] = useState<DeliveryPriority>('medium');
  const [requiredCapacity, setRequiredCapacity] = useState('');
  const [packageDescription, setPackageDescription] = useState('');

  useEffect(() => {
    if (delivery) {
      setPickup(delivery.pickup);
      setDropoff(delivery.dropoff);
      try {
        setScheduledTime(new Date(delivery.scheduledTime).toISOString().slice(0, 16));
      } catch {
        setScheduledTime('');
      }
      setPriority(delivery.priority);
      setRequiredCapacity(delivery.requiredCapacity ? String(delivery.requiredCapacity) : '');
      setPackageDescription(delivery.packageDescription || '');
    }
  }, [delivery, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!delivery) return;
    if (!pickup.trim() || !dropoff.trim()) {
      error('Validation Error', 'Pickup and Drop-off locations are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateDelivery(delivery.deliveryId, {
        pickup: pickup.trim(),
        dropoff: dropoff.trim(),
        scheduledTime: new Date(scheduledTime).toISOString(),
        priority,
        requiredCapacity: requiredCapacity ? Number(requiredCapacity) : undefined,
        packageDescription: packageDescription.trim() || undefined,
      });

      success('Delivery Updated', `Delivery order ${delivery.deliveryId} updated successfully.`);
      onSaved();
      onClose();
    } catch (err: any) {
      error('Update Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!delivery) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Delivery ${delivery.deliveryId}`}
      description="Modify destination route, scheduled dispatch window, or cargo specs."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Delivery ID
            </label>
            <input
              type="text"
              disabled
              value={delivery.deliveryId}
              className="w-full px-3 py-2 text-sm bg-slate-100 border border-slate-300 rounded-lg text-slate-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Priority <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as DeliveryPriority)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
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
            Pickup Origin Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={pickup}
            onChange={(e) => setPickup(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Drop-off Destination Location <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={dropoff}
            onChange={(e) => setDropoff(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Required Cargo Capacity (kg)
            </label>
            <input
              type="number"
              min="1"
              value={requiredCapacity}
              onChange={(e) => setRequiredCapacity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Package / Cargo Description
          </label>
          <textarea
            rows={2}
            value={packageDescription}
            onChange={(e) => setPackageDescription(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
};
