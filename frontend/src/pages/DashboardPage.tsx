import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { DashboardSummary } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import {
  DeliveryStatusBadge,
  PriorityBadge,
  VehicleStatusBadge,
  DriverStatusBadge,
} from '../components/common/Badge';
import {
  Truck,
  Users,
  Package,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  TrendingUp,
  Send,
  Plus,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

interface DashboardPageProps {
  onNavigateToDispatch: (deliveryId?: string) => void;
  onOpenCreateDelivery: () => void;
  onOpenCreateVehicle: () => void;
  onOpenCreateDriver: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigateToDispatch,
  onOpenCreateDelivery,
  onOpenCreateVehicle,
  onOpenCreateDriver,
}) => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await api.getDashboardSummary();
      setData(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium">Computing live fleet telemetry from database...</p>
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="p-8">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-6 text-center max-w-lg mx-auto">
          <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
          <h3 className="text-base font-semibold text-rose-900">Failed to load telemetry</h3>
          <p className="text-xs text-rose-600 mt-1 mb-4">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={fetchSummary}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const { metrics, statusDistribution, weeklyTrend, highPriorityPending, recentAssignments, availableResources } = data;

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Welcome with Quick Actions */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-900 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Zero Double-Booking Dispatch Protocol Active</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Fleet Operations Control Hub
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 leading-relaxed">
            Real-time telemetry showing live resource allocations, pending order queues, and instant conflict-free dispatching.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <Button
            variant="primary"
            size="md"
            onClick={() => onNavigateToDispatch()}
            icon={<Send className="w-4 h-4" />}
            className="shadow-lg shadow-brand-600/30 font-semibold text-xs sm:text-sm"
          >
            Smart Dispatch
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={onOpenCreateDelivery}
            icon={<Plus className="w-4 h-4" />}
            className="bg-white/10 text-white border-white/20 hover:bg-white/20 text-xs sm:text-sm"
          >
            New Delivery
          </Button>
        </div>

        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid with Detailed Sub-Counts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vehicles KPI */}
        <Card>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total Fleet Assets
              </span>
              <div className="p-2.5 rounded-xl bg-brand-50 text-brand-600">
                <Truck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {metrics.totalVehicles}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {metrics.availableVehicles} Available
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {metrics.assignedVehicles} Active
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {metrics.maintenanceVehicles} Maint
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Drivers KPI */}
        <Card>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Driver Personnel
              </span>
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {metrics.totalDrivers}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {metrics.availableDrivers} Ready
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {metrics.assignedDrivers} On Route
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {metrics.unavailableDrivers} Off-Duty
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Deliveries KPI */}
        <Card>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Active Deliveries
              </span>
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                <Send className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {metrics.activeDeliveries}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap mt-2.5">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                {metrics.pendingDeliveries} Pending
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                {metrics.deliveredDeliveries} Completed
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {metrics.cancelledDeliveries} Cancelled
              </span>
            </div>
          </CardBody>
        </Card>

        {/* Fleet Utilization KPI */}
        <Card>
          <CardBody className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Fleet Utilization
              </span>
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {metrics.fleetUtilization}%
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 mt-3 overflow-hidden">
              <div
                className="bg-brand-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${metrics.fleetUtilization}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {metrics.assignedVehicles} of {metrics.totalVehicles} assets deployed
            </p>
          </CardBody>
        </Card>
      </div>

      {/* High Priority Pending Deliveries Alert Bar */}
      {highPriorityPending.length > 0 && (
        <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>High & Urgent Priority Orders Awaiting Dispatch ({highPriorityPending.length})</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToDispatch()}
              className="text-amber-900 border-amber-300 hover:bg-amber-100/60 text-xs"
            >
              Dispatch Workspace <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {highPriorityPending.map((del) => (
              <div
                key={del.deliveryId}
                className="bg-white rounded-xl p-3.5 border border-amber-200/80 shadow-xs flex flex-col justify-between hover:border-brand-500 transition-smooth"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{del.deliveryId}</span>
                    <PriorityBadge priority={del.priority} />
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <p className="truncate"><span className="text-slate-400">From:</span> {del.pickup}</p>
                    <p className="truncate"><span className="text-slate-400">To:</span> {del.dropoff}</p>
                    {del.requiredCapacity && (
                      <p className="text-[11px] text-slate-500 font-medium">Cargo: {del.requiredCapacity} kg</p>
                    )}
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {new Date(del.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    onClick={() => onNavigateToDispatch(del.deliveryId)}
                    className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                  >
                    Dispatch Now <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Visual Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Status Distribution Donut Chart */}
        <Card className="lg:col-span-1 flex flex-col">
          <CardHeader
            title="Delivery Status Breakdown"
            subtitle="Total active & completed shipments"
          />
          <CardBody className="flex-1 flex flex-col justify-center items-center p-4">
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-2 pt-2 border-t border-slate-100">
              {statusDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}:</span>
                  <span className="font-bold text-slate-900">{item.count}</span>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Weekly Delivery Activity Chart */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader
            title="Weekly Dispatch & Delivery Activity"
            subtitle="Orders created vs completed in the last 7 days"
          />
          <CardBody className="flex-1 p-4">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: 'none',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar dataKey="dispatched" name="Created Orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delivered" name="Delivered Orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Available Fleet & Drivers Quick Roster */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Vehicles Summary */}
        <Card>
          <CardHeader
            title="Available Vehicles Ready for Dispatch"
            subtitle={`${metrics.availableVehicles} vehicles currently in staging yard`}
            action={
              <Button variant="ghost" size="sm" onClick={onOpenCreateVehicle} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Vehicle
              </Button>
            }
          />
          <CardBody className="p-0">
            {availableResources.vehicles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                All vehicles are currently assigned or in maintenance.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableResources.vehicles.map((v) => (
                  <div key={v.vehicleId} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-smooth">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-slate-900">{v.vehicleId}</span>
                          <span className="text-xs text-slate-500 font-mono">({v.registrationNo})</span>
                        </div>
                        <span className="text-xs text-slate-500">{v.type} • {v.capacity} kg</span>
                      </div>
                    </div>
                    <VehicleStatusBadge status={v.status} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Available Drivers Summary */}
        <Card>
          <CardHeader
            title="Available Drivers on Duty"
            subtitle={`${metrics.availableDrivers} drivers ready for route allocation`}
            action={
              <Button variant="ghost" size="sm" onClick={onOpenCreateDriver} icon={<Plus className="w-3.5 h-3.5" />}>
                Add Driver
              </Button>
            }
          />
          <CardBody className="p-0">
            {availableResources.drivers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                All drivers are currently dispatched or on leave.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {availableResources.drivers.map((d) => (
                  <div key={d.driverId} className="px-5 py-3 flex items-center justify-between hover:bg-slate-50 transition-smooth">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                        {d.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{d.name}</span>
                          <span className="text-xs text-slate-400 font-mono">({d.driverId})</span>
                        </div>
                        <span className="text-xs text-slate-500">{d.phone}</span>
                      </div>
                    </div>
                    <DriverStatusBadge status={d.availabilityStatus} />
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Assignments Table */}
      <Card>
        <CardHeader
          title="Recent Dispatch Operations"
          subtitle="Audit of latest vehicle and driver allocations"
          action={
            <Button variant="outline" size="sm" onClick={() => onNavigateToDispatch()}>
              Dispatch Terminal
            </Button>
          }
        />
        <CardBody className="p-0 overflow-x-auto">
          {recentAssignments.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No assignments recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Delivery ID</th>
                  <th className="px-5 py-3">Vehicle</th>
                  <th className="px-5 py-3">Driver</th>
                  <th className="px-5 py-3">Assigned At</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/80 transition-smooth">
                    <td className="px-5 py-3 font-mono font-bold text-slate-900">
                      {a.deliveryId}
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{a.vehicleId}</span>
                      <span className="text-slate-400 block text-[11px] font-mono">{a.vehicle?.registrationNo}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-medium text-slate-900">{a.driver?.name}</span>
                      <span className="text-slate-400 block text-[11px]">{a.driverId}</span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(a.assignedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          a.assignmentStatus === 'active'
                            ? 'bg-blue-50 text-blue-700'
                            : a.assignmentStatus === 'completed'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {a.assignmentStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
