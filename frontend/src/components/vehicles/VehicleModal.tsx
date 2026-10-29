import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { api } from '../../api/client';
import { Vehicle, VehicleStatus } from '../../types';

interface VehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  vehicle?: Vehicle | null;
}

export const VehicleModal: React.FC<VehicleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  vehicle,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [vehicleId, setVehicleId] = useState('');
  const [registrationNo, setRegistrationNo] = useState('');
  const [type, setType] = useState('Delivery Van');
  const [capacity, setCapacity] = useState('1200');
  const [status, setStatus] = useState<VehicleStatus>('available');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (vehicle) {
      setVehicleId(vehicle.vehicleId);
      setRegistrationNo(vehicle.registrationNo);
      setType(vehicle.type);
      setCapacity(String(vehicle.capacity));
      setStatus(vehicle.status);
      setNotes(vehicle.notes || '');
    } else {
      setVehicleId('');
      setRegistrationNo('');
      setType('Delivery Van');
      setCapacity('1200');
      setStatus('available');
      setNotes('');
    }
  }, [vehicle, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationNo.trim() || !capacity) {
      error('Validation Error', 'Registration number and capacity are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (vehicle) {
        await api.updateVehicle(vehicle.vehicleId, {
          registrationNo: registrationNo.trim(),
          type: type.trim(),
          capacity: Number(capacity),
          status,
          notes: notes.trim() || undefined,
        });
        success('Vehicle Updated', `Vehicle ${vehicle.vehicleId} updated successfully.`);
      } else {
        await api.createVehicle({
          vehicleId: vehicleId.trim() || undefined,
          registrationNo: registrationNo.trim(),
          type: type.trim(),
          capacity: Number(capacity),
          status,
          notes: notes.trim() || undefined,
        });
        success('Vehicle Added', `New vehicle added to fleet.`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      error('Operation Failed', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? `Edit Vehicle ${vehicle.vehicleId}` : 'Add New Fleet Vehicle'}
      description="Register fleet assets, payload capacities, and operational status."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!vehicle && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. V-108 (Auto-generated if empty)"
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Registration Number <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. KA-01-EA-5566"
            value={registrationNo}
            onChange={(e) => setRegistrationNo(e.target.value.toUpperCase())}
            className="w-full px-3 py-2 text-sm uppercase font-mono tracking-wider border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Vehicle Type <span className="text-rose-500">*</span>
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
            >
              <option value="Delivery Van">Delivery Van</option>
              <option value="Medium Truck">Medium Truck</option>
              <option value="Heavy Truck">Heavy Truck</option>
              <option value="Refrigerated Van">Refrigerated Van</option>
              <option value="Cargo E-Van">Cargo E-Van</option>
              <option value="Two-Wheeler Express">Two-Wheeler Express</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Payload Capacity (kg) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              required
              min="1"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as VehicleStatus)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="maintenance">Maintenance</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes & Equipment
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Tail lift, GPS tracker, periodic maintenance due"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {vehicle ? 'Save Changes' : 'Add Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
