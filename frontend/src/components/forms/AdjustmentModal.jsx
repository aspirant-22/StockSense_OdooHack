import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, X, AlertCircle } from 'lucide-react';
import api from '../../api/axiosClient';

export const AdjustmentModal = ({ product, onClose, onSuccess, warehouses = [] }) => {
  const [locations, setLocations] = useState([]);
  const [selectedWH, setSelectedWH] = useState(warehouses[0]?._id || '');
  const [selectedLocationId, setSelectedLocationId] = useState('');
  const [countedQty, setCountedQty] = useState(product?.totalQuantity || 0);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchInternalLocations = async () => {
      try {
        const res = await api.get('/warehouses/locations', {
          params: { type: 'internal', warehouseId: selectedWH || undefined },
        });
        if (res.data.success) {
          setLocations(res.data.data);
          if (res.data.data.length > 0) setSelectedLocationId(res.data.data[0]._id);
        }
      } catch (err) {
        console.error('Error loading locations', err);
      }
    };
    fetchInternalLocations();
  }, [selectedWH]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.post('/operations/adjust', {
        productId: product._id,
        warehouseId: selectedWH,
        locationId: selectedLocationId,
        countedQuantity: Number(countedQty),
        reason,
      });

      if (res.data.success) {
        onSuccess(res.data.message);
        onClose();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to apply inventory adjustment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-amber-400" />
              <span>Physical Count Adjustment</span>
            </h3>
            <p className="text-xs text-slate-400">
              Reconciling: <span className="text-purple-300 font-semibold">{product?.name}</span>
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Select Warehouse
            </label>
            <select
              value={selectedWH}
              onChange={(e) => setSelectedWH(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {warehouses.map((w) => (
                <option key={w._id} value={w._id}>
                  {w.name} ({w.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Internal Location / Shelf
            </label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            >
              {locations.map((l) => (
                <option key={l._id} value={l._id}>
                  {l.completeName || l.name}
                </option>
              ))}
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Current Theoretical Stock:</span>
              <span className="font-mono font-bold text-slate-200">
                {product?.totalQuantity || 0} {product?.uom}
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                Actual Physical Count *
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={countedQty}
                onChange={(e) => setCountedQty(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-base font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Adjustment Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Broken packaging / Annual stock audit"
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-purple-600 hover:from-amber-500 hover:to-purple-500 text-white font-semibold text-sm transition shadow-lg disabled:opacity-50"
            >
              {submitting ? 'Applying...' : 'Confirm Reconcile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
