import React, { useState, useEffect } from 'react';
import {
  Boxes,
  AlertTriangle,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  TrendingUp,
  History,
  Plus,
  RefreshCw,
} from 'lucide-react';
import api from '../../api/axiosClient';

export const DashboardView = ({ selectedWarehouse, setActiveTab, openNewOperationModal }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const url = selectedWarehouse
        ? `/dashboard/kpis?warehouseId=${selectedWarehouse}`
        : '/dashboard/kpis';
      const res = await api.get(url);
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard KPIs', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedWarehouse]);

  const kpis = data?.kpis || {
    totalProductsInStock: 0,
    totalUniqueProducts: 0,
    lowStockCount: 0,
    outOfStockCount: 0,
    pendingReceipts: 0,
    pendingDeliveries: 0,
    scheduledTransfers: 0,
  };

  const kpiCards = [
    {
      title: 'Total Units in Stock',
      value: kpis.totalProductsInStock,
      subtitle: `${kpis.totalUniqueProducts} Unique Catalog SKUs`,
      icon: Boxes,
      color: 'from-blue-600 to-indigo-600',
      tab: 'products',
    },
    {
      title: 'Low / Out of Stock',
      value: kpis.lowStockCount,
      subtitle: `${kpis.outOfStockCount} zero stock alerts`,
      icon: AlertTriangle,
      color: 'from-amber-500 to-rose-600',
      alert: kpis.lowStockCount > 0,
      tab: 'products',
    },
    {
      title: 'Pending Receipts',
      value: kpis.pendingReceipts,
      subtitle: 'Incoming goods from vendors',
      icon: ArrowDownToLine,
      color: 'from-emerald-600 to-teal-600',
      tab: 'receipts',
    },
    {
      title: 'Pending Deliveries',
      value: kpis.pendingDeliveries,
      subtitle: 'Outgoing customer shipments',
      icon: ArrowUpFromLine,
      color: 'from-purple-600 to-pink-600',
      tab: 'deliveries',
    },
    {
      title: 'Scheduled Transfers',
      value: kpis.scheduledTransfers,
      subtitle: 'Internal floor & rack shifts',
      icon: ArrowLeftRight,
      color: 'from-cyan-600 to-blue-600',
      tab: 'transfers',
    },
  ];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Executive Inventory Overview</h2>
          <p className="text-sm text-slate-400">
            Real-time stock ledger synchronization & automated Odoo threshold alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-sm font-medium transition cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh KPIs</span>
          </button>
        </div>
      </div>

      {/* 5 Dynamic KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => setActiveTab(card.tab)}
              className="group relative bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/50 rounded-2xl p-5 backdrop-blur-xl transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer overflow-hidden"
            >
              {/* Top Accent Gradient Line */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${card.color}`}
              />

              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 group-hover:text-slate-200 transition">
                  {card.title}
                </span>
                <div
                  className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white tracking-tight">
                    {card.value}
                  </span>
                  {card.alert && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                      Alert
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 group-hover:text-slate-300 transition">{card.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Action Dock */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-teal-950/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-purple-400" />
          <span>Quick Stock Operations</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => openNewOperationModal('receipt')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-sm font-semibold transition cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>+ New Receipt</span>
          </button>
          <button
            onClick={() => openNewOperationModal('delivery')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-sm font-semibold transition cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <ArrowUpFromLine className="w-4 h-4" />
            <span>+ Delivery Order</span>
          </button>
          <button
            onClick={() => openNewOperationModal('internal')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 text-cyan-300 text-sm font-semibold transition cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <ArrowLeftRight className="w-4 h-4" />
            <span>+ Internal Transfer</span>
          </button>
          <button
            onClick={() => openNewOperationModal('adjustment')}
            className="flex items-center justify-center gap-2.5 px-4 py-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-sm font-semibold transition cursor-pointer shadow-sm hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Count Adjustment</span>
          </button>
        </div>
      </div>

      {/* Two Column Layout: Low Stock Watchlist & Recent Movement Ledger Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Watchlist */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Low Stock Alerts (Reorder Triggers)</span>
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
            >
              View All Catalog &rarr;
            </button>
          </div>

          {data?.lowStockItems?.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              All product stock levels are healthy and above min thresholds.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.lowStockItems?.map((item) => (
                <div
                  key={item._id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-amber-500/30 transition"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200">{item.name}</span>
                      <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                        {item.sku}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Min Alert Rule: {item.minStockAlert} {item.uom}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-bold ${
                        item.currentStock === 0 ? 'text-rose-400' : 'text-amber-400'
                      }`}
                    >
                      {item.currentStock} {item.uom}
                    </span>
                    <span className="block text-[11px] font-medium text-slate-500">
                      {item.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Ledger Audit Stream */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-teal-400" />
              <span>Real-Time Stock Movements</span>
            </h3>
            <button
              onClick={() => setActiveTab('ledger')}
              className="text-xs font-semibold text-teal-400 hover:text-teal-300 transition"
            >
              Full Ledger History &rarr;
            </button>
          </div>

          {data?.recentMoves?.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-sm">
              No inventory movements recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {data?.recentMoves?.map((move) => {
                const isIncoming = move.operationType === 'receipt';
                const isOutgoing = move.operationType === 'delivery';

                return (
                  <div
                    key={move._id}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-sm"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-400">
                          {move.reference}
                        </span>
                        <span className="font-medium text-slate-200">{move.productName}</span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {move.srcLocationName} &rarr; {move.destLocationName}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold ${
                          isIncoming
                            ? 'text-emerald-400'
                            : isOutgoing
                            ? 'text-purple-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        {isIncoming ? '+' : isOutgoing ? '-' : ''}
                        {move.quantity} {move.uom}
                      </span>
                      <span className="block text-[11px] text-slate-500 uppercase">
                        {move.operationType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
