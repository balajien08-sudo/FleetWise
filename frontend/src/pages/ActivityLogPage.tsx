import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { ActivityLog } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  Truck,
  Users,
  Package,
} from 'lucide-react';

export const ActivityLogPage: React.FC = () => {
  const { error } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getActivityLogs({
        action: actionFilter !== 'all' ? actionFilter : undefined,
        entityType: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
        search: searchQuery.trim() || undefined,
        limit: 100,
      });
      setLogs(res.logs);
    } catch (err: any) {
      error('Failed to load activity logs', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter, entityTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'ASSIGNMENT_CREATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">ASSIGNED</span>;
      case 'ASSIGNMENT_REJECTED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">REJECTED (409)</span>;
      case 'RESOURCES_RELEASED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">RELEASED</span>;
      case 'STATUS_UPDATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">STATUS</span>;
      case 'DELIVERY_CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">CANCELLED</span>;
      case 'DELIVERY_CREATED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">ORDER NEW</span>;
      case 'DEMO_DATA_RESET':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-300">DEMO RESET</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">{action}</span>;
    }
  };

  const formatDetails = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object') {
        return (
          <div className="space-y-0.5 text-xs">
            {parsed.reason && <p className="text-rose-600 font-semibold">{parsed.reason}</p>}
            {parsed.message && <p className="text-slate-700">{parsed.message}</p>}
            {parsed.pickup && (
              <p className="text-slate-600">
                Route: {parsed.pickup} → {parsed.dropoff}
              </p>
            )}
            {parsed.vehicleId && (
              <p className="text-slate-500 font-mono text-[11px]">
                Vehicle: {parsed.vehicleId} | Driver: {parsed.driverId || parsed.driverName}
              </p>
            )}
            {parsed.releasedVehicleId && (
              <p className="text-emerald-700 text-[11px]">
                Released Vehicle: {parsed.releasedVehicleId} & Driver: {parsed.releasedDriverId}
              </p>
            )}
          </div>
        );
      }
    } catch {
      return <p className="text-slate-600 text-xs">{raw}</p>;
    }
    return <p className="text-slate-600 text-xs">{raw}</p>;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-600" />
            <span>Immutable System Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit logging of every creation, dispatch, status change, resource release, and conflict prevention.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Refresh Logs
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card>
        <CardBody className="p-4">
          <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search audit entries, entity IDs, reasons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Actions</option>
                <option value="ASSIGNMENT_CREATED">Assignments Created</option>
                <option value="ASSIGNMENT_REJECTED">Assignments Rejected (Conflicts)</option>
                <option value="RESOURCES_RELEASED">Resources Released</option>
                <option value="STATUS_UPDATED">Status Updates</option>
                <option value="DELIVERY_CANCELLED">Cancellations</option>
                <option value="DELIVERY_CREATED">Deliveries Created</option>
              </select>

              <select
                value={entityTypeFilter}
                onChange={(e) => setEntityTypeFilter(e.target.value)}
                className="px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
              >
                <option value="all">All Entity Types</option>
                <option value="ASSIGNMENT">Assignment</option>
                <option value="DELIVERY">Delivery</option>
                <option value="VEHICLE">Vehicle</option>
                <option value="DRIVER">Driver</option>
                <option value="SYSTEM">System</option>
              </select>

              <Button type="submit" variant="secondary" size="sm">
                Filter
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {/* Log Feed Table */}
      <Card>
        <CardBody className="p-0 overflow-x-auto">
          {loading && logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs flex flex-col items-center justify-center">
              <RefreshCw className="w-6 h-6 animate-spin text-brand-600 mb-2" />
              <span>Querying activity logs...</span>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No audit logs recorded matching this filter.
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Type</th>
                  <th className="px-5 py-3">Entity ID</th>
                  <th className="px-5 py-3">Operational Details</th>
                  <th className="px-5 py-3">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-smooth">
                    <td className="px-5 py-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>

                    <td className="px-5 py-3 whitespace-nowrap">
                      {getActionBadge(log.action)}
                    </td>

                    <td className="px-5 py-3 font-semibold text-slate-700 whitespace-nowrap">
                      {log.entityType}
                    </td>

                    <td className="px-5 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {log.entityId}
                    </td>

                    <td className="px-5 py-3 max-w-md">
                      {formatDetails(log.details)}
                    </td>

                    <td className="px-5 py-3 text-slate-500 whitespace-nowrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-[11px] font-medium text-slate-700">
                        {log.actorId || 'Dispatcher'}
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
