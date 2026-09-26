import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  Filter,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  SlidersHorizontal,
  Calendar,
  Layers,
} from 'lucide-react';
import api from '../../api/axiosClient';

export const LedgerView = ({ selectedWarehouse }) => {
  const [moves, setMoves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [opTypeFilter, setOpTypeFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operations/ledger/moves', {
        params: {
          operationType: opTypeFilter || undefined,
          search: search || undefined,
        },
      });
      if (res.data.success) setMoves(res.data.data);
    } catch (err) {
      console.error('Failed to load ledger history', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [opTypeFilter, search]);

  const getTypeBadge = (type) => {
    switch (type) {
      case 'receipt':
        return {
          label: 'Receipt (Vendor IN)',
          color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
          icon: ArrowDownToLine,
          prefix: '+',
          qtyColor: 'text-emerald-400',
        };
      case 'delivery':
        return {
          label: 'Delivery (Customer OUT)',
          color: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
          icon: ArrowUpFromLine,
          prefix: '-',
          qtyColor: 'text-purple-400',
        };
      case 'internal':
        return {
          label: 'Internal Transfer',
          color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
          icon: ArrowLeftRight,
          prefix: '',
          qtyColor: 'text-cyan-400',
        };
      case 'adjustment':
        return {
          label: 'Count Adjustment',
          color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
          icon: SlidersHorizontal,
          prefix: '±',
          qtyColor: 'text-amber-400',
        };
      default:
        return {
          label: type,
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: Layers,
          prefix: '',
          qtyColor: 'text-slate-300',
        };
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-teal-400" />
            <span>Stock Move History Ledger</span>
          </h2>
          <p className="text-sm text-slate-400">
            Immutable, double-entry transaction record tracking all stock movements across nodes
          </p>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, product name or SKU..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Document / Operation Type Filter */}
          <select
            value={opTypeFilter}
            onChange={(e) => setOpTypeFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-teal-500"
          >
            <option value="">All Movement Types</option>
            <option value="receipt">Receipts (Incoming)</option>
            <option value="delivery">Deliveries (Outgoing)</option>
            <option value="internal">Internal Transfers</option>
            <option value="adjustment">Count Adjustments</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Source Node &rarr; Destination Node</th>
                <th className="px-6 py-4 text-right">Quantity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading ledger entries...
                  </td>
                </tr>
              ) : moves.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No stock movements found in ledger.
                  </td>
                </tr>
              ) : (
                moves.map((m) => {
                  const badge = getTypeBadge(m.operationType);
                  const Icon = badge.icon;
                  const dateStr = new Date(m.dateDone || m.createdAt).toLocaleString();

                  return (
                    <tr key={m._id} className="hover:bg-slate-800/40 transition font-sans">
                      <td className="px-6 py-4 font-mono font-bold text-teal-300 text-xs">
                        {m.reference}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 flex items-center gap-1.5 pt-5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{dateStr}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${badge.color}`}
                        >
                          <Icon className="w-3 h-3" />
                          <span>{badge.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-200">{m.productName}</div>
                        <div className="font-mono text-xs text-slate-400">{m.productSku}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        <span className="text-slate-400">{m.srcLocationName}</span>
                        <span className="text-teal-400 font-bold mx-2">&rarr;</span>
                        <span className="text-slate-200 font-medium">{m.destLocationName}</span>
                      </td>
                      <td className="px-6 py-4 text-right font-mono font-bold text-sm">
                        <span className={badge.qtyColor}>
                          {badge.prefix}
                          {m.quantity} {m.uom}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
