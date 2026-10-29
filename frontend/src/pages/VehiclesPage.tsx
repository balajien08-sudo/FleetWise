import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Vehicle } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { VehicleModal } from '../components/vehicles/VehicleModal';
import { VehicleStatusBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Truck,
  Search,
  Filter,
  Plus,
  Download,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  RefreshCw,
  Package,
} from 'lucide-react';

interface VehiclesPageProps {
  onOpenCreateVehicle: () => void;
  onNavigateToDispatch: () => void;
}

export const VehiclesPage: React.FC<VehiclesPageProps> = ({
  onOpenCreateVehicle,
  onNavigateToDispatch,
}) => {
  const { success, error } = useToast();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [viewingVehicle, setViewingVehicle] = useState<Vehicle | null>(null);

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await api.getVehicles({
        status: statusFilter,
        type: typeFilter,
        search: searchQuery.trim() || undefined,
        page,
        limit: 15,
      });
      setVehicles(res.vehicles);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      error('Failed to load vehicles', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [page, statusFilter, typeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchVehicles();
  };

  const handleDelete = async (vehicle: Vehicle) => {
    if (vehicle.status === 'assigned') {
      error(
        'Deletion Blocked',
        `Vehicle ${vehicle.vehicleId} is currently assigned to an active delivery. Resolve the delivery first.`
      );
      return;
    }

    if (!window.confirm(`Are you sure you want to delete vehicle ${vehicle.vehicleId} (${vehicle.registrationNo})?`)) {
      return;
    }

    try {
      await api.deleteVehicle(vehicle.vehicleId);
      success('Vehicle Deleted', `Vehicle ${vehicle.vehicleId} removed from fleet.`);
      await fetchVehicles();
      if (viewingVehicle?.vehicleId === vehicle.vehicleId) setViewingVehicle(null);
    } catch (err: any) {
      error('Deletion Failed', err.message);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/analytics/export/vehicles';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Fleet Asset Management</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage commercial vehicles, payload capacities, maintenance status, and assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4 text-slate-600" />}
          >
            Export Fleet CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingVehicle(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Vehicle
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
                placeholder="Search by Vehicle ID, Registration, Type, Notes..."
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
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="assigned">Assigned</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactive</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Types</option>
                <option value="Delivery Van">Delivery Van</option>
                <option value="Medium Truck">Medium Truck</option>
                <option value="Heavy Truck">Heavy Truck</option>
                <option value="Refrigerated Van">Refrigerated Van</option>
                <option value="Cargo E-Van">Cargo E-Van</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Search
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Vehicles Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading && vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-2" />
              <span>Loading vehicles...</span>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No vehicles found matching criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Vehicle ID</th>
                  <th className="px-5 py-3">Registration Number</th>
                  <th className="px-5 py-3">Type</th>
                  <th className="px-5 py-3">Capacity (kg)</th>
                  <th className="px-5 py-3">Operational Status</th>
                  <th className="px-5 py-3">Current Active Delivery</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <tr key={v.vehicleId} className="hover:bg-slate-50/80 transition-smooth">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {v.vehicleId}
                    </td>

                    <td className="px-5 py-3 font-mono font-semibold text-slate-800 tracking-wider">
                      {v.registrationNo}
                    </td>

                    <td className="px-5 py-3 text-slate-700">
                      {v.type}
                    </td>

                    <td className="px-5 py-3 font-bold text-slate-900">
                      {v.capacity.toLocaleString()} kg
                    </td>

                    <td className="px-5 py-3">
                      <VehicleStatusBadge status={v.status} />
                    </td>

                    <td className="px-5 py-3">
                      {v.activeAssignment ? (
                        <span className="font-mono font-semibold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                          {v.activeAssignment.deliveryId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">None (Idle)</span>
                      )}
                    </td>

                    <td className="px-5 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={async () => {
                            const full = await api.getVehicleById(v.vehicleId);
                            setViewingVehicle(full.data);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-smooth"
                          title="View Details & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingVehicle(v);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-smooth"
                          title="Edit Vehicle"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(v)}
                          disabled={v.status === 'assigned'}
                          className={`p-1.5 rounded-lg transition-smooth ${
                            v.status === 'assigned'
                              ? 'text-slate-300 cursor-not-allowed'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title={v.status === 'assigned' ? 'Cannot delete assigned vehicle' : 'Delete Vehicle'}
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
          <span>Showing {(page - 1) * 15 + 1} to {Math.min(page * 15, total)} of {total} vehicles</span>
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
      <VehicleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVehicle(null);
        }}
        onSaved={fetchVehicles}
        vehicle={editingVehicle}
      />

      {/* Vehicle Details Modal */}
      {viewingVehicle && (
        <Modal
          isOpen={true}
          onClose={() => setViewingVehicle(null)}
          title={`Vehicle ${viewingVehicle.vehicleId} (${viewingVehicle.registrationNo})`}
          description="Detailed asset specification and historical dispatch records."
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Type</span>
                <span className="font-semibold text-slate-900">{viewingVehicle.type}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Capacity</span>
                <span className="font-semibold text-slate-900">{viewingVehicle.capacity} kg</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                <VehicleStatusBadge status={viewingVehicle.status} />
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Registered</span>
                <span className="text-slate-600">{new Date(viewingVehicle.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {viewingVehicle.notes && (
              <div className="text-xs p-3 bg-white rounded-lg border border-slate-200">
                <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Asset Notes</span>
                <p className="text-slate-700">{viewingVehicle.notes}</p>
              </div>
            )}

            {/* Assignment History */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Assignment History ({viewingVehicle.assignments?.length || 0})
              </h4>
              {!viewingVehicle.assignments || viewingVehicle.assignments.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No historical dispatches recorded.</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {viewingVehicle.assignments.map((a) => (
                    <div key={a.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{a.deliveryId}</span>
                          <span className="text-slate-500">with driver {a.driver?.name}</span>
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
