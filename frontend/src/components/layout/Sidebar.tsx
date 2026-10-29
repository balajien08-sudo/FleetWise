import React from 'react';
import {
  LayoutDashboard,
  Send,
  Truck,
  Users,
  Package,
  Activity,
  BarChart3,
  Settings,
  ShieldCheck,
  Compass,
  ChevronLeft,
  ChevronRight,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavTab =
  | 'dashboard'
  | 'dispatch'
  | 'deliveries'
  | 'vehicles'
  | 'drivers'
  | 'tracking'
  | 'analytics'
  | 'activity'
  | 'users'
  | 'settings';

interface SidebarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  pendingCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  pendingCount = 0,
}) => {
  const { isAdmin } = useAuth();

  const sections = [
    {
      title: 'OPERATIONS',
      items: [
        { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
        { id: 'dispatch', label: 'Smart Dispatch', icon: Send, badge: pendingCount > 0 ? pendingCount : undefined, highlight: true },
        { id: 'deliveries', label: 'Delivery Orders', icon: Package },
        { id: 'tracking', label: 'Live Tracking', icon: Compass },
      ],
    },
    {
      title: 'FLEET & CREW',
      items: [
        { id: 'vehicles', label: 'Vehicle Fleet', icon: Truck },
        { id: 'drivers', label: 'Driver Roster', icon: Users },
      ],
    },
    {
      title: 'INTELLIGENCE & SYSTEM',
      items: [
        { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
        { id: 'activity', label: 'Audit Activity Log', icon: Activity },
        { id: 'settings', label: 'System Settings', icon: Settings },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'ACCESS CONTROL',
            items: [
              { id: 'users', label: 'User Management', icon: UserCheck },
            ],
          },
        ]
      : []),
  ];

  const handleItemClick = (tabId: NavTab) => {
    onSelectTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col bg-navy-950 text-slate-300 border-r border-slate-800/90 transition-all duration-300 select-none shadow-2xl md:shadow-none ${
          isMobileOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
        } ${collapsed ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-800/80 bg-navy-950 flex-shrink-0">
          <div
            className="flex items-center gap-2.5 overflow-hidden cursor-pointer group"
            onClick={() => handleItemClick('dashboard')}
            title="FleetWise — Overview Dashboard"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-500/20 to-brand-cyan/20 border border-brand-cyan/40 flex items-center justify-center p-1.5 shadow-sm shadow-cyan-500/10 flex-shrink-0 group-hover:border-brand-cyan transition-colors">
              <img
                src="/fleetwise-icon.svg"
                alt="FleetWise Icon"
                className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(18,201,244,0.45)]"
              />
            </div>
            {(!collapsed || isMobileOpen) && (
              <div className="flex flex-col min-w-0">
                <span className="font-extrabold text-white tracking-tight text-[15px] leading-tight flex items-center">
                  Fleet<span className="text-brand-cyan">Wise</span>
                </span>
                <span className="text-[8.5px] text-slate-400 font-bold tracking-wider uppercase truncate mt-0.5">
                  SMART FLEET <span className="text-brand-cyan">·</span> EFFICIENT DELIVERIES
                </span>
              </div>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden md:flex text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-smooth cursor-pointer"
            title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile close toggle */}
          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/80 transition-smooth cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {(!collapsed || isMobileOpen) && (
                <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  {section.title}
                </span>
              )}
              {section.items.map((item) => {
                const isActive = currentTab === item.id;
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => handleItemClick(item.id as NavTab)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-medium text-xs sm:text-sm transition-smooth group relative cursor-pointer ${
                      isActive
                        ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                        : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
                    }`}
                    title={collapsed && !isMobileOpen ? item.label : undefined}
                  >
                    <Icon
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-transform ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-brand-400'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />

                    {(!collapsed || isMobileOpen) && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {(!collapsed || isMobileOpen) && item.badge !== undefined && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-brand-500/20 text-brand-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}

                    {/* Active accent pill */}
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-white/90" />
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer Guarantee Badge */}
        {(!collapsed || isMobileOpen) ? (
          <div className="p-3.5 border-t border-slate-800/80 bg-navy-900/60 m-3 rounded-xl flex-shrink-0">
            <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Double-Booking</span>
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Atomic transactional locking protocol active.
            </p>
          </div>
        ) : (
          <div className="p-3 border-t border-slate-800 flex justify-center flex-shrink-0">
            <span title="Zero Double-Booking Active">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </span>
          </div>
        )}
      </aside>
    </>
  );
};
