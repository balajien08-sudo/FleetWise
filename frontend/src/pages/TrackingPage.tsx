import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Delivery } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { StatusTimeline } from '../components/common/StatusTimeline';
import { DeliveryStatusBadge, PriorityBadge } from '../components/common/Badge';
import { useToast } from '../components/common/Toast';
import {
  Compass,
  Search,
  Filter,
  Truck,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Package,
  Send,
} from 'lucide-react';

interface TrackingPageProps {
  onNavigateToDispatch: (deliveryId?: string) => void;
}

export const TrackingPage: React.FC<TrackingPageProps> = ({ onNavigateToDispatch }) => {
  const { success, error } = useToast();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const res = await api.getDeliveries({
        limit: 50,
        search: searchQuery.trim() || undefined,
      });

      let items = res.deliveries;
      if (filterActiveOnly) {
        items = items.filter((d) => d.status === 'assigned' || d.status === 'in_transit' || d.status === 'pending');
      }

      setDeliveries(items);
    } catch (err: any) {
      error('Tracking Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackingData();
  }, [filterActiveOnly]);

  const handleUpdateStatus = async (deliveryId: string, targetStatus: string) => {
    setUpdatingId(deliveryId);
    try {
      await api.updateDeliveryStatus(deliveryId, targetStatus);
      success('Status Updated', `Delivery ${deliveryId} moved to '${targetStatus}'.`);
      await fetchTrackingData();
    } catch (err: any) {
      error('Transition Error', err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-brand-600" />
            <span>Operational Route Tracking</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time status progression, delivery timeline milestones, and safe transition actions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-medium text-slate-700 flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs cursor-pointer">
            <input
              type="checkbox"
              checked={filterActiveOnly}
              onChange={(e) => setFilterActiveOnly(e.target.checked)}
              className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
            />
            <span>Active & Pending Only</span>
          </label>

          <Button variant="outline" size="sm" onClick={fetchTrackingData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Deliveries Cards Stream */}
      {loading && deliveries.length === 0 ? (
        <div className="p-16 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
          <RefreshCw className="w-7 h-7 animate-spin text-brand-600 mb-3" />
          <span>Synchronizing operational tracking board...</span>
        </div>
      ) : deliveries.length === 0 ? (
        <Card>
          <CardBody className="p-12 text-center text-slate-400 text-xs">
            No active shipments currently on route.
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-4">
          {deliveries.map((del) => {
            const activeAssignment = del.assignments?.find((a) => a.assignmentStatus === 'active') || null;

            return (
              <Card key={del.deliveryId} className="border-slate-200/90 shadow-sm hover:border-slate-300">
                <CardBody className="p-5 space-y-4">
                  {/* Top Bar: ID, Priority, Badges, Timestamps */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-2.5 py-1 rounded-md">
                        {del.deliveryId}
                      </span>
                      <PriorityBadge priority={del.priority} />
                      <DeliveryStatusBadge status={del.status} />
                    </div>

                    <div className="text-xs text-slate-500 flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        Target: {new Date(del.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Updated: {new Date(del.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Route & Cargo Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Origin / Pickup
                      </span>
                      <p className="font-semibold text-slate-800 leading-snug">{del.pickup}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Destination / Drop-off
                      </span>
                      <p className="font-semibold text-slate-800 leading-snug">{del.dropoff}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Assigned Resources
                      </span>
                      {activeAssignment ? (
                        <div className="text-slate-700">
                          <p className="font-semibold">
                            {activeAssignment.vehicleId} ({activeAssignment.vehicle?.registrationNo})
                          </p>
                          <p className="text-slate-500 text-[11px]">
                            Driver: {activeAssignment.driver?.name} ({activeAssignment.driver?.phone})
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 italic">None (Awaiting Dispatch)</p>
                      )}
                    </div>
                  </div>

                  {/* Visual Status Progression Timeline */}
                  <div className="pt-2">
                    <StatusTimeline currentStatus={del.status} scheduledTime={del.scheduledTime} />
                  </div>

                  {/* Action Bar for Status Transitions */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-xs text-slate-500 font-medium">
                      {del.status === 'pending' && 'Order ready for vehicle & driver allocation.'}
                      {del.status === 'assigned' && 'Resources committed. Ready to commence transit.'}
                      {del.status === 'in_transit' && 'Vehicle currently on route towards drop-off.'}
                      {del.status === 'delivered' && 'Order successfully delivered. Fleet resources released.'}
                      {del.status === 'cancelled' && 'Order cancelled. Resources released.'}
                    </div>

                    <div className="flex items-center gap-2">
                      {del.status === 'pending' && (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => onNavigateToDispatch(del.deliveryId)}
                          icon={<Send className="w-3.5 h-3.5" />}
                        >
                          Dispatch in Workspace
                        </Button>
                      )}

                      {del.status === 'assigned' && (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={updatingId === del.deliveryId}
                          onClick={() => handleUpdateStatus(del.deliveryId, 'in_transit')}
                          icon={<Truck className="w-3.5 h-3.5" />}
                          className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                        >
                          Dispatch to Transit
                        </Button>
                      )}

                      {del.status === 'in_transit' && (
                        <Button
                          variant="success"
                          size="sm"
                          isLoading={updatingId === del.deliveryId}
                          onClick={() => handleUpdateStatus(del.deliveryId, 'delivered')}
                          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          Mark as Delivered
                        </Button>
                      )}

                      {(del.status === 'pending' || del.status === 'assigned') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(del.deliveryId, 'cancelled')}
                          className="text-rose-600 hover:bg-rose-50 border-rose-200"
                        >
                          Cancel Order
                        </Button>
                      )}
                    </div>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
