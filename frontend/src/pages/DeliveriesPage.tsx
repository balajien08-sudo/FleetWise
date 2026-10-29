import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Delivery, DeliveryStatus, DeliveryPriority } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { StatusTimeline } from '../components/common/StatusTimeline';
import { EditDeliveryModal } from '../components/deliveries/EditDeliveryModal';
import { DeliveryStatusBadge, PriorityBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Package,
  Search,
  Plus,
  Download,
  Eye,
  Edit,
  Send,
  Truck,
  CheckCircle,
  XCircle,
  Trash2,
  Clock,
  ArrowRight,
  RefreshCw,
  ArrowUpDown,
} from 'lucide-react';

interface DeliveriesPageProps {
  onOpenCreateDelivery: () => void;
  onNavigateToDispatch: (deliveryId: string) => void;
}

export const DeliveriesPage: React.FC<DeliveriesPageProps> = ({
  onOpenCreateDelivery,
  onNavigateToDispatch,
}) => {
  const { success, error } = useToast();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Filters & Sorting
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('scheduledTime');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Selected for view drawer/modal & edit modal
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [editingDelivery, setEditingDelivery] = useState<Delivery | null>(null);

  // Cancel Confirmation Modal
  const [cancelTarget, setCancelTarget] = useState<Delivery | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Status updating
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveries({
        status: statusFilter,
        priority: priorityFilter,
        search: searchQuery.trim() || undefined,
        page,
        limit,
      });
      setDeliveries(res.deliveries);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (err: any) {
      error('Failed to load deliveries', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [page, limit, statusFilter, priorityFilter, sortBy, sortOrder]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchDeliveries();
  };

  const handleUpdateStatus = async (deliveryId: string, nextStatus: string) => {
    setUpdatingId(deliveryId);
    try {
      await api.updateDeliveryStatus(deliveryId, nextStatus);
      success('Status Updated', `Delivery ${deliveryId} is now '${nextStatus}'.`);
      await fetchDeliveries();
      if (selectedDelivery?.deliveryId === deliveryId) {
        const updated = await api.getDeliveryById(deliveryId);
        setSelectedDelivery(updated.data);
      }
    } catch (err: any) {
      error('Status Update Failed', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    try {
      await api.updateDeliveryStatus(cancelTarget.deliveryId, 'cancelled');
      success('Delivery Cancelled', `Delivery ${cancelTarget.deliveryId} cancelled and resources released.`);
      setCancelTarget(null);
      await fetchDeliveries();
      if (selectedDelivery?.deliveryId === cancelTarget.deliveryId) {
        setSelectedDelivery(null);
      }
    } catch (err: any) {
      error('Cancellation Failed', err.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async (deliveryId: string) => {
    if (!window.confirm(`Are you sure you want to delete delivery ${deliveryId}?`)) return;
    try {
      await api.deleteDelivery(deliveryId);
      success('Delivery Deleted', `Delivery ${deliveryId} deleted.`);
      await fetchDeliveries();
      if (selectedDelivery?.deliveryId === deliveryId) setSelectedDelivery(null);
    } catch (err: any) {
      error('Deletion Failed', err.message);
    }
  };

  const handleExportCsv = () => {
    window.location.href = '/api/analytics/export/deliveries';
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-600" />
            <span>Delivery Orders Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor route fulfillment, inspect cargo specifications, and schedule assignments.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            icon={<Download className="w-4 h-4 text-slate-600" />}
            className="text-xs"
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onOpenCreateDelivery}
            icon={<Plus className="w-4 h-4" />}
            className="text-xs font-semibold"
          >
            Create Delivery
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
                placeholder="Search by ID, pickup origin, drop-off, cargo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap sm:flex-nowrap">
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="in_transit">In Transit</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => {
                  setPriorityFilter(e.target.value);
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>

              <select
                value={limit}
                onChange={(e) => {
                  setLimit(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white hidden sm:block"
                title="Page size"
              >
                <option value="10">10 / page</option>
                <option value="15">15 / page</option>
                <option value="25">25 / page</option>
                <option value="50">50 / page</option>
              </select>

              <Button type="submit" variant="secondary" size="sm" className="text-xs">
                Search
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Delivery Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading && deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-2" />
              <span>Loading deliveries...</span>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No delivery orders match your criteria.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Delivery ID</th>
                  <th className="px-5 py-3">Route (Pickup → Drop-off)</th>
                  <th className="px-5 py-3">Scheduled Time</th>
                  <th className="px-5 py-3">Priority</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Assigned Vehicle & Driver</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {deliveries.map((del) => {
                  const activeAssignment = del.assignments?.find((a) => a.assignmentStatus === 'active') || null;

                  return (
                    <tr key={del.deliveryId} className="hover:bg-slate-50/80 transition-smooth">
                      <td className="px-5 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        {del.deliveryId}
                      </td>

                      <td className="px-5 py-3 max-w-xs">
                        <div className="truncate font-medium text-slate-800">{del.pickup}</div>
                        <div className="truncate text-slate-400 text-[11px] flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-slate-300" />
                          <span>{del.dropoff}</span>
                        </div>
                      </td>

                      <td className="px-5 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(del.scheduledTime).toLocaleDateString([], { month: 'short', day: 'numeric' })}{' '}
                        <span className="text-slate-400">
                          {new Date(del.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="px-5 py-3">
                        <PriorityBadge priority={del.priority} />
                      </td>

                      <td className="px-5 py-3">
                        <DeliveryStatusBadge status={del.status} />
                      </td>

                      <td className="px-5 py-3">
                        {activeAssignment ? (
                          <div>
                            <span className="font-semibold text-slate-900">
                              {activeAssignment.vehicleId} ({activeAssignment.vehicle?.registrationNo})
                            </span>
                            <span className="block text-[11px] text-slate-400">
                              {activeAssignment.driver?.name} ({activeAssignment.driverId})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => setSelectedDelivery(del)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-smooth"
                            title="View Delivery Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Edit button (if pending) */}
                          {del.status === 'pending' && (
                            <button
                              onClick={() => setEditingDelivery(del)}
                              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-smooth"
                              title="Edit Delivery Details"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick dispatch shortcut if pending */}
                          {del.status === 'pending' && (
                            <button
                              onClick={() => onNavigateToDispatch(del.deliveryId)}
                              className="p-1.5 text-brand-600 hover:text-brand-800 hover:bg-brand-50 rounded-lg transition-smooth font-semibold text-xs flex items-center gap-1"
                              title="Dispatch Now"
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Dispatch</span>
                            </button>
                          )}

                          {/* Step status: Assigned -> In Transit */}
                          {del.status === 'assigned' && (
                            <button
                              onClick={() => handleUpdateStatus(del.deliveryId, 'in_transit')}
                              disabled={updatingId === del.deliveryId}
                              className="px-2 py-1 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg border border-purple-200 transition-smooth"
                            >
                              Start Transit
                            </button>
                          )}

                          {/* Step status: In Transit -> Delivered */}
                          {del.status === 'in_transit' && (
                            <button
                              onClick={() => handleUpdateStatus(del.deliveryId, 'delivered')}
                              disabled={updatingId === del.deliveryId}
                              className="px-2 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-smooth"
                            >
                              Mark Delivered
                            </button>
                          )}

                          {/* Cancel button if pending or assigned */}
                          {(del.status === 'pending' || del.status === 'assigned') && (
                            <button
                              onClick={() => setCancelTarget(del)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-smooth"
                              title="Cancel Delivery"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete button (only if terminal or pending) */}
                          {(del.status === 'delivered' || del.status === 'cancelled' || del.status === 'pending') && (
                            <button
                              onClick={() => handleDelete(del.deliveryId)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-smooth"
                              title="Delete Delivery"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-2 text-xs text-slate-500">
          <span>
            Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} deliveries
          </span>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Previous
            </Button>
            <span className="px-3 py-1 font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Delivery Modal */}
      <EditDeliveryModal
        isOpen={!!editingDelivery}
        onClose={() => setEditingDelivery(null)}
        onSaved={fetchDeliveries}
        delivery={editingDelivery}
      />

      {/* Delivery Details Modal */}
      {selectedDelivery && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedDelivery(null)}
          title={`Delivery Order: ${selectedDelivery.deliveryId}`}
          description="Detailed delivery route, payload specs, and live assignment history."
          maxWidth="lg"
        >
          <div className="space-y-5">
            {/* Timeline */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <StatusTimeline currentStatus={selectedDelivery.status} />
            </div>

            {/* Route & Cargo Specs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Route Details</span>
                <div>
                  <span className="text-slate-400 block">Pickup Location:</span>
                  <span className="font-semibold text-slate-900">{selectedDelivery.pickup}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Destination:</span>
                  <span className="font-semibold text-slate-900">{selectedDelivery.dropoff}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Scheduled Window:</span>
                  <span className="font-medium text-slate-800">{new Date(selectedDelivery.scheduledTime).toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-400 uppercase tracking-wider block text-[10px]">Cargo & Priority</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Priority:</span>
                  <PriorityBadge priority={selectedDelivery.priority} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Required Capacity:</span>
                  <span className="font-semibold text-slate-900">
                    {selectedDelivery.requiredCapacity ? `${selectedDelivery.requiredCapacity} kg` : 'Standard'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Cargo Description:</span>
                  <span className="text-slate-700 italic">
                    {selectedDelivery.packageDescription || 'No description provided.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Assigned Resources Card */}
            {selectedDelivery.activeAssignment ? (
              <div className="bg-brand-50/60 p-4 rounded-xl border border-brand-200 text-xs">
                <span className="font-bold text-brand-900 uppercase tracking-wider block text-[10px] mb-2">
                  Active Resource Allocation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-brand-700 block font-medium">Assigned Vehicle:</span>
                    <span className="font-bold text-slate-900">
                      {selectedDelivery.activeAssignment.vehicleId} ({selectedDelivery.activeAssignment.vehicle?.registrationNo})
                    </span>
                    <span className="text-slate-500 block text-[11px]">
                      {selectedDelivery.activeAssignment.vehicle?.type} • Cap: {selectedDelivery.activeAssignment.vehicle?.capacity} kg
                    </span>
                  </div>

                  <div>
                    <span className="text-brand-700 block font-medium">Assigned Driver:</span>
                    <span className="font-bold text-slate-900">{selectedDelivery.activeAssignment.driver?.name}</span>
                    <span className="text-slate-500 block text-[11px]">
                      {selectedDelivery.activeAssignment.driver?.phone} ({selectedDelivery.activeAssignment.driverId})
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                No active assignment. Order is awaiting dispatch.
              </div>
            )}

            {/* Action Bar inside Modal */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">Order ID: {selectedDelivery.deliveryId}</span>
              <div className="flex items-center gap-2">
                {selectedDelivery.status === 'pending' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const id = selectedDelivery.deliveryId;
                      setSelectedDelivery(null);
                      onNavigateToDispatch(id);
                    }}
                    icon={<Send className="w-3.5 h-3.5" />}
                  >
                    Dispatch Now
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={() => setSelectedDelivery(null)}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelTarget && (
        <Modal
          isOpen={true}
          onClose={() => setCancelTarget(null)}
          title="Cancel Delivery Order"
          description={`Are you sure you want to cancel delivery order ${cancelTarget.deliveryId}?`}
          maxWidth="sm"
        >
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              Cancelling this delivery will atomically terminate its assignment and immediately release the assigned vehicle and driver back to the available pool.
            </p>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <Button variant="outline" size="sm" onClick={() => setCancelTarget(null)}>
                Keep Delivery
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isCancelling}
                onClick={handleConfirmCancel}
              >
                Yes, Cancel & Release
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
