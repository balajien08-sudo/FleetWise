import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { SystemHealth } from '../types';
import { Card, CardHeader, CardBody } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { useAuth } from '../context/AuthContext';
import {
  Settings,
  Database,
  Server,
  Cpu,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  HardDrive,
  Clock,
} from 'lucide-react';

interface SettingsPageProps {
  onDataRefresh: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onDataRefresh }) => {
  const { isAdmin } = useAuth();
  const { success, error } = useToast();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);

  // Display preferences
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);
  const [concurrencyLockMode, setConcurrencyLockMode] = useState('atomic-serializable');

  const fetchHealth = async () => {
    try {
      setLoading(true);
      const res = await api.getHealth();
      setHealth(res);
    } catch (err: any) {
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset database to clean judge demo scenario (V-101 available, D-01 available, D-204 pending)?')) {
      return;
    }

    setIsResetting(true);
    try {
      await api.resetDemoData();
      success('Database Reset Complete', 'Clean baseline data loaded. Ready for evaluation demonstration.');
      await fetchHealth();
      onDataRefresh();
    } catch (err: any) {
      error('Reset Failed', err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-brand-600" />
          <span>System Diagnostics & Preferences</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Backend operational health, SQLite database connectivity status, and demo reset controls.
        </p>
      </div>

      {/* Backend & Database Health Status Card */}
      <Card>
        <CardHeader
          title="Backend & Persistence Diagnostics"
          subtitle="Real-time connectivity verification"
          action={
            <Button variant="outline" size="sm" onClick={fetchHealth} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Probe Health
            </Button>
          }
        />
        <CardBody className="p-5 space-y-4">
          {loading && !health ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-brand-600" />
              Checking service diagnostics...
            </div>
          ) : health ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* API Service */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">REST API</span>
                  <Server className="w-4 h-4 text-brand-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-bold text-sm text-slate-900">Online</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">v{health.version}</span>
              </div>

              {/* Database */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Database</span>
                  <Database className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${health.database.status === 'connected' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  <span className="font-bold text-sm text-slate-900 capitalize">{health.database.status}</span>
                </div>
                <span className="text-[11px] text-slate-500 block mt-1">
                  SQLite ({health.database.latencyMs}ms latency)
                </span>
              </div>

              {/* Uptime */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Process Uptime</span>
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <span className="font-bold text-sm text-slate-900">
                  {Math.floor(health.uptimeSeconds / 60)} min {health.uptimeSeconds % 60} sec
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">Continuous uptime</span>
              </div>

              {/* Memory Heap */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Memory Allocation</span>
                  <Cpu className="w-4 h-4 text-blue-600" />
                </div>
                <span className="font-bold text-sm text-slate-900">
                  {Math.round(health.memory.heapUsed / 1024 / 1024)} MB
                </span>
                <span className="text-[11px] text-slate-500 block mt-1">
                  of {Math.round(health.memory.heapTotal / 1024 / 1024)} MB heap
                </span>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center text-xs text-rose-700">
              <AlertTriangle className="w-6 h-6 text-rose-600 mx-auto mb-2" />
              <strong>Backend Disconnected</strong> — Unable to reach <code>/api/health</code> endpoint.
            </div>
          )}
        </CardBody>
      </Card>

      {/* Demo Reset Management for Judges */}
      <Card className="border-brand-200 bg-brand-50/20">
        <CardHeader
          title="Demonstration Environment Reset"
          subtitle="Non-destructive development reset tool for judge evaluation"
        />
        <CardBody className="p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-600 max-w-xl space-y-1">
              <p className="font-semibold text-slate-900">
                Restore Baseline Judge Demo Scenario
              </p>
              <p>
                Resets the SQLite database and reseeds clean records:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500">
                <li>Pending delivery: <strong>D-204</strong> (Whitefield → Airport, 500kg cargo)</li>
                <li>Available vehicle: <strong>V-101</strong> (KA-01-EA-1234, 1200kg)</li>
                <li>Available driver: <strong>D-01</strong> (Rajesh Kumar)</li>
                <li>Occupied vehicle & driver: <strong>V-107</strong> & <strong>D-06</strong> (on active route D-201)</li>
                <li>Maintenance vehicle: <strong>V-106</strong> (Brake overhaul)</li>
              </ul>
            </div>

            {isAdmin ? (
              <Button
                variant="outline"
                size="md"
                onClick={handleResetDemoData}
                isLoading={isResetting}
                icon={<RotateCcw className="w-4 h-4 text-brand-600" />}
                className="border-brand-300 text-brand-700 hover:bg-brand-50 shadow-xs font-semibold whitespace-nowrap cursor-pointer"
              >
                Reset to Judge Scenario
              </Button>
            ) : (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-center gap-2 max-w-xs">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Administrator privileges required to perform a demo database reset.</span>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Operational Preferences */}
      <Card>
        <CardHeader
          title="Operational Dispatch Preferences"
          subtitle="Client-side UI tuning and safety validation thresholds"
        />
        <CardBody className="p-5 space-y-4">
          <div className="space-y-4 text-xs divide-y divide-slate-100">
            <div className="flex items-center justify-between pt-2">
              <div>
                <span className="font-semibold text-slate-900 block">Telemetry Auto-Refresh</span>
                <span className="text-slate-500">Poll live dashboard metrics and tracking updates every 30 seconds</span>
              </div>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="font-semibold text-slate-900 block">Concurrency Control Mode</span>
                <span className="text-slate-500">Database transactional isolation mode for dispatch operations</span>
              </div>
              <select
                value={concurrencyLockMode}
                onChange={(e) => setConcurrencyLockMode(e.target.value)}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="atomic-serializable">Atomic Transaction (Serializable Check)</option>
                <option value="immediate-lock">Immediate Lock (Strict Mutual Exclusion)</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div>
                <span className="font-semibold text-slate-900 block">Audio & Visual Conflict Alerts</span>
                <span className="text-slate-500">Provide high-contrast warning banner when assignment conflicts (409) occur</span>
              </div>
              <input
                type="checkbox"
                checked={notificationSound}
                onChange={(e) => setNotificationSound(e.target.checked)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
              />
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
