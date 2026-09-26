import React from 'react';
import {
  LayoutDashboard,
  Boxes,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  History,
  Building2,
  LogOut,
  User,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'Overview' },
    { id: 'products', label: 'Products & Stock', icon: Boxes, section: 'Master Data' },
    { id: 'receipts', label: 'Receipts (Incoming)', icon: ArrowDownToLine, section: 'Operations' },
    { id: 'deliveries', label: 'Delivery Orders (Outgoing)', icon: ArrowUpFromLine, section: 'Operations' },
    { id: 'transfers', label: 'Internal Transfers', icon: ArrowLeftRight, section: 'Operations' },
    { id: 'adjustments', label: 'Stock Adjustments', icon: SlidersHorizontal, section: 'Operations' },
    { id: 'ledger', label: 'Move History Ledger', icon: History, section: 'Auditing' },
    { id: 'warehouses', label: 'Warehouses & Locations', icon: Building2, section: 'Settings' },
  ];

  return (
    <aside className="w-64 bg-slate-900/90 border-r border-slate-800 flex flex-col h-screen sticky top-0 backdrop-blur-xl z-30 print:hidden">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-teal-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
            StockSense <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">Odoo</span>
          </h1>
          <p className="text-xs text-slate-400">Enterprise IMS Engine</p>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
        {['Overview', 'Master Data', 'Operations', 'Auditing', 'Settings'].map((sectionName) => {
          const items = navigationItems.filter((i) => i.section === sectionName);
          if (items.length === 0) return null;

          return (
            <div key={sectionName} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {sectionName}
              </p>
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-purple-600/30 to-teal-600/20 text-white border border-purple-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                      <span>{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 text-purple-400" />}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-purple-400 font-semibold text-sm">
              {user?.name ? user.name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div className="truncate">
              <p className="text-sm font-medium text-slate-200 truncate">{user?.name || 'Manager'}</p>
              <p className="text-xs text-slate-400 capitalize">{user?.role || 'User'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800/80 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
