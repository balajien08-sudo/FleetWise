import React from 'react';
import { ToastProvider } from './components/common/Toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Shell } from './components/layout/Shell';
import { LoginPage } from './pages/LoginPage';
import { Truck, Loader2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-brand-500/10 border border-brand-cyan/30 flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/10 p-2.5">
          <img src="/fleetwise-icon.svg" alt="FleetWise" className="w-full h-full object-contain animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-brand-cyan" />
          <span>Verifying security session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <Shell />;
};

export const App: React.FC = () => {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ToastProvider>
  );
};

export default App;
