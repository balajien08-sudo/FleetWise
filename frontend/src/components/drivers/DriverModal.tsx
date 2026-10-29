import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { api } from '../../api/client';
import { Driver, DriverStatus } from '../../types';

interface DriverModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  driver?: Driver | null;
}

export const DriverModal: React.FC<DriverModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  driver,
}) => {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [driverId, setDriverId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [availabilityStatus, setAvailabilityStatus] = useState<DriverStatus>('available');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (driver) {
      setDriverId(driver.driverId);
      setName(driver.name);
      setPhone(driver.phone);
      setEmail(driver.email || '');
      setAvailabilityStatus(driver.availabilityStatus);
      setNotes(driver.notes || '');
    } else {
      setDriverId('');
      setName('');
      setPhone('');
      setEmail('');
      setAvailabilityStatus('available');
      setNotes('');
    }
  }, [driver, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      error('Validation Error', 'Driver name and phone number are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (driver) {
        await api.updateDriver(driver.driverId, {
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          availabilityStatus,
          notes: notes.trim() || undefined,
        });
        success('Driver Updated', `Driver ${driver.name} updated successfully.`);
      } else {
        await api.createDriver({
          driverId: driverId.trim() || undefined,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          availabilityStatus,
          notes: notes.trim() || undefined,
        });
        success('Driver Added', `New driver added to roster.`);
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
      title={driver ? `Edit Driver ${driver.name}` : 'Add New Driver'}
      description="Register driver credentials, contact telephone, and availability."
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {!driver && (
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Driver ID (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. D-07 (Auto-generated if empty)"
              value={driverId}
              onChange={(e) => setDriverId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Full Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. +91 98765 43210"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="e.g. ramesh.k@fleetwise.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Availability Status <span className="text-rose-500">*</span>
          </label>
          <select
            value={availabilityStatus}
            onChange={(e) => setAvailabilityStatus(e.target.value as DriverStatus)}
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
          >
            <option value="available">Available</option>
            <option value="assigned">Assigned</option>
            <option value="unavailable">Unavailable (Leave / Off-duty)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
            Notes / License Details
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Commercial HGV License, Hazmat certification, city route expert"
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
            {driver ? 'Save Changes' : 'Add Driver'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
