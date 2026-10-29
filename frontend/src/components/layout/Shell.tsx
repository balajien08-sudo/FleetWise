import React, { useState } from 'react';
import { Sidebar, NavTab } from './Sidebar';
import { Header } from './Header';
import { DashboardPage } from '../../pages/DashboardPage';
import { DispatchPage } from '../../pages/DispatchPage';
import { DeliveriesPage } from '../../pages/DeliveriesPage';
import { TrackingPage } from '../../pages/TrackingPage';
import { VehiclesPage } from '../../pages/VehiclesPage';
import { DriversPage } from '../../pages/DriversPage';
import { AnalyticsPage } from '../../pages/AnalyticsPage';
import { ActivityLogPage } from '../../pages/ActivityLogPage';
import { UsersPage } from '../../pages/UsersPage';
import { SettingsPage } from '../../pages/SettingsPage';
import { CreateDeliveryModal } from '../deliveries/CreateDeliveryModal';
import { VehicleModal } from '../vehicles/VehicleModal';
import { DriverModal } from '../drivers/DriverModal';

export const Shell: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [dataRefreshCounter, setDataRefreshCounter] = useState(0);

  // Global modals state
  const [isCreateDeliveryOpen, setIsCreateDeliveryOpen] = useState(false);
  const [isCreateVehicleOpen, setIsCreateVehicleOpen] = useState(false);
  const [isCreateDriverOpen, setIsCreateDriverOpen] = useState(false);

  // Target delivery for dispatch
  const [dispatchDeliveryId, setDispatchDeliveryId] = useState<string | undefined>(undefined);

  const handleDataRefresh = () => {
    setDataRefreshCounter((c) => c + 1);
  };

  const handleNavigateToDispatch = (deliveryId?: string) => {
    setDispatchDeliveryId(deliveryId);
    setCurrentTab('dispatch');
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar with mobile drawer support */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'dispatch') setDispatchDeliveryId(undefined);
          setCurrentTab(tab);
        }}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Viewport */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <Header
          currentTab={currentTab}
          onOpenCreateDelivery={() => setIsCreateDeliveryOpen(true)}
          onDataRefresh={handleDataRefresh}
          onToggleMobileMenu={() => setIsMobileMenuOpen((o) => !o)}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8">
          {currentTab === 'dashboard' && (
            <DashboardPage
              key={dataRefreshCounter}
              onNavigateToDispatch={handleNavigateToDispatch}
              onOpenCreateDelivery={() => setIsCreateDeliveryOpen(true)}
              onOpenCreateVehicle={() => setIsCreateVehicleOpen(true)}
              onOpenCreateDriver={() => setIsCreateDriverOpen(true)}
            />
          )}

          {currentTab === 'dispatch' && (
            <DispatchPage
              key={`${dataRefreshCounter}-${dispatchDeliveryId}`}
              initialDeliveryId={dispatchDeliveryId}
              onRefreshAll={handleDataRefresh}
            />
          )}

          {currentTab === 'deliveries' && (
            <DeliveriesPage
              key={dataRefreshCounter}
              onOpenCreateDelivery={() => setIsCreateDeliveryOpen(true)}
              onNavigateToDispatch={handleNavigateToDispatch}
            />
          )}

          {currentTab === 'tracking' && (
            <TrackingPage
              key={dataRefreshCounter}
              onNavigateToDispatch={handleNavigateToDispatch}
            />
          )}

          {currentTab === 'vehicles' && (
            <VehiclesPage
              key={dataRefreshCounter}
              onOpenCreateVehicle={() => setIsCreateVehicleOpen(true)}
              onNavigateToDispatch={() => setCurrentTab('dispatch')}
            />
          )}

          {currentTab === 'drivers' && (
            <DriversPage
              key={dataRefreshCounter}
              onOpenCreateDriver={() => setIsCreateDriverOpen(true)}
              onNavigateToDispatch={() => setCurrentTab('dispatch')}
            />
          )}

          {currentTab === 'analytics' && <AnalyticsPage key={dataRefreshCounter} />}

          {currentTab === 'activity' && <ActivityLogPage key={dataRefreshCounter} />}

          {currentTab === 'users' && <UsersPage key={dataRefreshCounter} />}

          {currentTab === 'settings' && <SettingsPage key={dataRefreshCounter} onDataRefresh={handleDataRefresh} />}
        </main>
      </div>

      {/* Global Modals */}
      <CreateDeliveryModal
        isOpen={isCreateDeliveryOpen}
        onClose={() => setIsCreateDeliveryOpen(false)}
        onCreated={handleDataRefresh}
      />

      <VehicleModal
        isOpen={isCreateVehicleOpen}
        onClose={() => setIsCreateVehicleOpen(false)}
        onSaved={handleDataRefresh}
      />

      <DriverModal
        isOpen={isCreateDriverOpen}
        onClose={() => setIsCreateDriverOpen(false)}
        onSaved={handleDataRefresh}
      />
    </div>
  );
};
