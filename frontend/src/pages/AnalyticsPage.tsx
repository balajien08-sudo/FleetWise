import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AnalyticsData } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import {
  BarChart3,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
  Truck,
  Users,
  RefreshCw,
  TrendingUp,
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

export const AnalyticsPage: React.FC = () => {
  const { error } = useToast();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<'7d' | '30d' | 'all'>('all');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.getAnalytics(range);
      setData(res.data);
    } catch (err: any) {
      error('Failed to load analytics', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

  if (loading && !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[500px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-600 mb-3" />
        <p className="text-sm font-medium">Aggregating database performance analytics...</p>
      </div>
    );
  }

  if (!data) return null;

  const { summary, statusBreakdown, priorityBreakdown, vehicleUtilizationByType, driverStats } = data;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-600" />
            <span>Operational Analytics & Intelligence</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Database-derived delivery performance indicators, fleet utilization, and exportable reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Date range filter */}
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 text-xs shadow-xs">
            <button
              onClick={() => setRange('7d')}
              className={`px-3 py-1 rounded-md font-medium transition-smooth ${
                range === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setRange('30d')}
              className={`px-3 py-1 rounded-md font-medium transition-smooth ${
                range === '30d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last 30 Days
            </button>
            <button
              onClick={() => setRange('all')}
              className={`px-3 py-1 rounded-md font-medium transition-smooth ${
                range === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          <a
            href="/api/analytics/export/deliveries"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-smooth"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Deliveries CSV</span>
          </a>

          <a
            href="/api/analytics/export/vehicles"
            download
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-smooth"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Fleet CSV</span>
          </a>
        </div>
      </div>

      {/* Primary Summary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Total Order Volume
            </span>
            <div className="text-3xl font-extrabold text-slate-900 mt-2">
              {summary.totalDeliveries}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.activeDeliveries} active in fulfillment
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Fulfillment Completion
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 mt-2">
              {summary.completionRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.completedDeliveries} completed deliveries
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Order Cancellation Rate
            </span>
            <div className="text-3xl font-extrabold text-rose-600 mt-2">
              {summary.cancellationRate}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {summary.cancelledDeliveries} cancelled orders
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Driver Roster Utilization
            </span>
            <div className="text-3xl font-extrabold text-brand-600 mt-2">
              {driverStats.total > 0 ? Math.round((driverStats.assigned / driverStats.total) * 100) : 0}%
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {driverStats.available} drivers currently idle & ready
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Breakdown Pie */}
        <Card>
          <CardHeader
            title="Shipment Volume by Lifecycle Status"
            subtitle="Calculated proportions across current database orders"
          />
          <CardBody className="p-5 flex flex-col items-center">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {statusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            <div className="grid grid-cols-3 gap-2 w-full mt-3 pt-3 border-t border-slate-100 text-xs">
              {statusBreakdown.map((s, idx) => (
                <div key={s.status} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="capitalize">{s.status}:</span>
                  <strong className="text-slate-900">{s.count}</strong>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Priority Breakdown Bar */}
        <Card>
          <CardHeader
            title="Order Priority Distribution"
            subtitle="Workload demand by urgency level"
          />
          <CardBody className="p-5">
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priorityBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="priority" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
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
                  <Bar dataKey="count" name="Deliveries" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Fleet Utilization by Vehicle Type Table */}
      <Card>
        <CardHeader
          title="Vehicle Utilization by Vehicle Classification"
          subtitle="Real fleet occupancy, available capacity, and active route assignments"
        />
        <CardBody className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Vehicle Type</th>
                <th className="px-5 py-3">Total Fleet Count</th>
                <th className="px-5 py-3">Assigned to Route</th>
                <th className="px-5 py-3">Available in Yard</th>
                <th className="px-5 py-3">In Maintenance</th>
                <th className="px-5 py-3">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {vehicleUtilizationByType.map((item) => (
                <tr key={item.type} className="hover:bg-slate-50/80 transition-smooth">
                  <td className="px-5 py-3 font-semibold text-slate-900">{item.type}</td>
                  <td className="px-5 py-3 font-bold text-slate-800">{item.total}</td>
                  <td className="px-5 py-3 text-blue-600 font-medium">{item.assigned}</td>
                  <td className="px-5 py-3 text-emerald-600 font-medium">{item.available}</td>
                  <td className="px-5 py-3 text-amber-600 font-medium">{item.maintenance}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-brand-600 h-full rounded-full"
                          style={{ width: `${item.utilizationRate}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900">{item.utilizationRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
};
