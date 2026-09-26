import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Boxes,
} from 'lucide-react';
import api from '../../api/axiosClient';

export const AdjustmentsView = ({ selectedWarehouse, openAdjustmentModal }) => {
  const [products, setProducts] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, locRes] = await Promise.all([
        api.get('/products', {
          params: { search: search || undefined },
        }),
        api.get('/warehouses/locations', {
          params: { type: 'internal', warehouseId: selectedWarehouse || undefined },
        }),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      console.error('Failed to load products for adjustment', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedWarehouse, search]);

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <SlidersHorizontal className="w-6 h-6 text-amber-400" />
            <span>Physical Inventory Adjustments</span>
          </h2>
          <p className="text-sm text-slate-400">
            Reconcile physical stock counts with theoretical system records (Automates Gain/Loss ledger entries)
          </p>
        </div>
      </div>

      {/* Info Card explaining Odoo Inventory Adjustment mechanics */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-teal-500/10 border border-amber-500/20 text-xs text-slate-300 flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
        <div>
          <span className="font-bold text-amber-300">How Odoo Stock Adjustment works:</span> If
          the physical counted quantity is higher than the recorded balance, a stock gain is booked
          from <code className="text-purple-300">Virtual Loss/Gain &rarr; Internal Location</code>.
          If lower, shrinkage is booked from{' '}
          <code className="text-rose-300">Internal Location &rarr; Virtual Loss</code>.
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product name or SKU to reconcile..."
            className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Product List for Adjustment */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Current Theoretical Stock</th>
                <th className="px-6 py-4">Locations Breakdown</th>
                <th className="px-6 py-4 text-right">Reconcile Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Loading inventory data...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-100">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-purple-300 text-xs">{p.sku}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono font-bold text-base text-white">
                        {p.totalQuantity} {p.uom}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {p.stockByLocation?.length > 0 ? (
                        <div className="space-y-1">
                          {p.stockByLocation.map((loc, idx) => (
                            <div key={idx} className="flex justify-between max-w-xs">
                              <span>{loc.locationName}:</span>
                              <span className="font-mono text-emerald-400 font-semibold">
                                {loc.quantity} {p.uom}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-500">No location quants</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openAdjustmentModal(p)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600/30 to-purple-600/30 hover:from-amber-600/50 hover:to-purple-600/50 border border-amber-500/40 text-amber-300 text-xs font-semibold shadow-sm transition cursor-pointer"
                      >
                        Count & Adjust &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
