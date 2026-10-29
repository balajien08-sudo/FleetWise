import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Driver } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { DriverModal } from '../components/drivers/DriverModal';
import { DriverStatusBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Users,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface DriversPageProps {
  onOpenCreateDriver: () => void;
  onNavigateToDispatch: () => void;
}

export const DriversPage: React.FC<DriversPageProps> = ({
  onOpenCreateDriver,
  onNavigateToDispatch,
}) => {
  const { success, error } = useToast();

  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [viewingDriver, setViewingDriver] = useState<Driver | null>(null);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await api.getDrivers({
        availabilityStatus: statusFilter,
        search: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });
      setDrivers(res.drivers);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      error('Failed to load drivers', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDrivers();
  };

  const handleDelete = async (driver: Driver) => {
    if (driver.availabilityStatus === 'assigned') {
      error(
        'Deletion Blocked',
        `Driver ${driver.name} is currently assigned to an active delivery. Resolve the delivery first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete driver ${driver.name} (${driver.driverId})?`)) {
      return;
    }

    try {
      await api.deleteDriver(driver.driverId);
      success('Driver Deleted', `Driver ${driver.name} removed from roster.`);
      await fetchDrivers();
      if (viewingDriver?.driverId === driver.driverId) setViewingDriver(null);
    } catch (err: any) {
      error('Deletion Failed', err.message);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Driver Personnel Roster</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage commercial drivers, license credentials, contact phone numbers, and availability.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingDriver(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Driver
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Driver ID, Name, Phone, Email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Availabilities</option>
                <option value="available">Available (On-Duty)</option>
                <option value="assigned">Assigned (In-Transit)</option>
                <option value="unavailable">Unavailable (Leave / Off-Duty)</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Drivers Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading && drivers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-2" />
              <span>Loading drivers...</span>
            </div>
          ) : drivers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No drivers found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Driver ID</th>
                  <th className="px-5 py-3">Driver Name</th>
                  <th className="px-5 py-3">Telephone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">Availability</th>
                  <th className="px-5 py-3">Current Active Delivery</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drivers.map((d) => (
                  <tr key={d.driverId} className="hover:bg-slate-50/80 transition-smooth">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {d.driverId}
                    </td>

                    <td className="px-5 py-3 font-bold text-slate-900">
                      {d.name}
                    </td>

                    <td className="px-5 py-3 text-slate-700">
                      {d.phone}
                    </td>

                    <td className="px-5 py-3 text-slate-500">
                      {d.email || '—'}
                    </td>

                    <td className="px-5 py-3">
                      <DriverStatusBadge status={d.availabilityStatus} />
                    </td>

                    <td className="px-5 py-3">
                      {d.activeAssignment ? (
                        <span className="font-mono font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {d.activeAssignment.deliveryId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None (Idle)</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            const full = await api.getDriverById(d.driverId);
                            setViewingDriver(full.data);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-smooth"
                          title="View Details & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingDriver(d);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-smooth"
                          title="Edit Driver"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(d)}
                          disabled={d.availabilityStatus === 'assigned'}
                          className={`p-1.5 rounded-lg transition-smooth ${
                            d.availabilityStatus === 'assigned'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={d.availabilityStatus === 'assigned' ? 'Cannot delete assigned driver' : 'Delete Driver'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <span>Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} drivers</span>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <DriverModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingDriver(null);
        }}
        onSaved={fetchDrivers}
        driver={editingDriver}
      />

      {/* Driver Details Modal */}
      {viewingDriver && (
        <Modal
          isOpen={true}
          onClose={() => setViewingDriver(null)}
          title={`Driver Profile: ${viewingDriver.name} (${viewingDriver.driverId})`}
          description="Driver qualification, contact details, and past delivery track record."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Contact Phone</span>
                <span className="font-semibold text-slate-900">{viewingDriver.phone}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Email Address</span>
                <span className="font-semibold text-slate-900">{viewingDriver.email || 'None'}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Availability</span>
                <DriverStatusBadge status={viewingDriver.availabilityStatus} />
              </div>
            </div>

            {viewingDriver.notes && (
              <div className="text-xs p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">License & Qualifications</span>
                <p className="text-slate-700">{viewingDriver.notes}</p>
              </div>
            )}

            {/* Assignment History */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Completed Routes ({viewingDriver.assignments?.length || 0})
              </h4>
              {!viewingDriver.assignments || viewingDriver.assignments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No historical dispatches recorded.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingDriver.assignments.map((a) => (
                    <div key={a.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{a.deliveryId}</span>
                          <span className="text-slate-500">with vehicle {a.vehicleId}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {new Date(a.assignedAt).toLocaleString()}
                        </span>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                        a.assignmentStatus === 'active' ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {a.assignmentStatus}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
