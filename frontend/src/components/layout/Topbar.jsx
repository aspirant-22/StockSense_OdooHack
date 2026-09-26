import React from 'react';
import { Bell, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Topbar = ({ title, subtitle, warehouses, selectedWarehouse, onWarehouseChange }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-slate-900/60 border-b border-slate-800 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Title / Breadcrumb */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
      </div>

      {/* Global Warehouse Filter & User Status */}
      <div className="flex items-center gap-4">
        {/* Warehouse Selector */}
        <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-xl px-3 py-1.5">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Warehouse:</span>
          <select
            value={selectedWarehouse}
            onChange={(e) => onWarehouseChange(e.target.value)}
            className="bg-transparent text-sm font-medium text-slate-200 focus:outline-none cursor-pointer"
          >
            <option value="" className="bg-slate-900 text-slate-200">
              All Warehouses (Global)
            </option>
            {warehouses?.map((wh) => (
              <option key={wh._id} value={wh._id} className="bg-slate-900 text-slate-200">
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        {/* Live Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Ledger Live</span>
        </div>
      </div>
    </header>
  );
};
