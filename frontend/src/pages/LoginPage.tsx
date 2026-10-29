import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Truck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage('Please enter your username/email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Authentication failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (role: 'admin' | 'dispatcher') => {
    setErrorMessage(null);
    if (role === 'admin') {
      setIdentifier('admin');
      setPassword('Admin@12345');
    } else {
      setIdentifier('dispatcher');
      setPassword('Dispatch@12345');
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting with FleetWise Brand Blue and Cyan */}
      <div className="absolute top-[-15%] left-[-15%] w-[550px] h-[550px] bg-brand-500/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-15%] w-[550px] h-[550px] bg-brand-cyan/15 rounded-full blur-[140px] pointer-events-none" />
      
      {/* Precision micro-grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, #12C9F4 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="w-full max-w-md relative z-10">
        {/* Full Brand Logo Header maintaining aspect ratio */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <img
              src="/fleetwise-logo.svg"
              alt="FleetWise — Smart Fleet · Efficient Deliveries"
              className="h-16 sm:h-20 w-auto max-w-[320px] object-contain filter drop-shadow-[0_4px_24px_rgba(18,201,244,0.35)]"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-900/90 border border-brand-cyan/30 text-[11px] font-medium text-slate-300 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
            <span>Zero Double-Booking</span>
            <span className="text-slate-600">•</span>
            <span>Complete Visibility</span>
          </div>
        </div>

        {/* Enterprise Login Card */}
        <div className="bg-navy-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl p-7 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-1">
              Authenticate with your credentials to manage fleet operations, live dispatches, and routes.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-800/80 text-red-200 text-xs flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 font-medium leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Username or Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin or dispatcher"
                  required
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full pl-10 pr-11 py-2.5 bg-navy-950 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-cyan/50 focus:border-brand-cyan transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 active:from-brand-700 active:to-brand-800 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to FleetWise</span>
                  <ArrowRight className="w-4 h-4 text-brand-cyan" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Access Bar for Evaluators */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
              <span>Quick Demo Role Provisioning</span>
              <span className="text-brand-cyan text-[10px] flex items-center gap-1 font-normal">
                <CheckCircle2 className="w-3 h-3 text-brand-cyan" /> Ready
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin')}
                className="py-2.5 px-3 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-700/70 hover:border-brand-500/60 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-white group-hover:text-brand-cyan transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-cyan" />
                  Administrator
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">admin / Admin@12345</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('dispatcher')}
                className="py-2.5 px-3 rounded-xl bg-navy-950/80 hover:bg-navy-950 border border-slate-700/70 hover:border-emerald-500/60 text-left transition-all group cursor-pointer"
              >
                <div className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-emerald-400" />
                  Dispatcher
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">dispatcher / Dispatch@12345</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security & Architecture Footer */}
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-slate-400" />
            <span>HttpOnly Session</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-slate-400" />
            <span>Server-Side RBAC</span>
          </div>
          <span>•</span>
          <span className="text-slate-400">v1.3.0 Enterprise</span>
        </div>
      </div>
    </div>
  );
};
