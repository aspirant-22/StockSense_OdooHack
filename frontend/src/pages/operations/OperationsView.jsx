import React, { useState, useEffect } from 'react';
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Calendar,
  Layers,
  X,
  AlertCircle,
} from 'lucide-react';
import api from '../../api/axiosClient';

export const OperationsView = ({ type, title, subtitle, selectedWarehouse }) => {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form fields
  const [selectedWH, setSelectedWH] = useState(selectedWarehouse || '');
  const [partner, setPartner] = useState('');
  const [srcLocationId, setSrcLocationId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [demandQty, setDemandQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOperations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operations', {
        params: {
          type,
          status: statusFilter || undefined,
          warehouseId: selectedWarehouse || undefined,
          search: search || undefined,
        },
      });
      if (res.data.success) setOperations(res.data.data);
    } catch (err) {
      console.error('Failed to fetch operations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [prodRes, whRes, locRes] = await Promise.all([
        api.get('/products'),
        api.get('/warehouses'),
        api.get('/warehouses/locations'),
      ]);
      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (whRes.data.success) {
        setWarehouses(whRes.data.data);
        if (whRes.data.data.length > 0 && !selectedWH) setSelectedWH(whRes.data.data[0]._id);
      }
      if (locRes.data.success) setLocations(locRes.data.data);
    } catch (err) {
      console.error('Failed to load dependencies', err);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, [type, statusFilter, selectedWarehouse, search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Pre-fill smart defaults for Source & Destination based on operation type
  useEffect(() => {
    if (locations.length > 0) {
      const vendorLoc = locations.find((l) => l.type === 'supplier');
      const customerLoc = locations.find((l) => l.type === 'customer');
      const internalLocs = locations.filter((l) => l.type === 'internal');

      if (type === 'receipt') {
        if (vendorLoc) setSrcLocationId(vendorLoc._id);
        if (internalLocs.length > 0) setDestLocationId(internalLocs[0]._id);
      } else if (type === 'delivery') {
        if (internalLocs.length > 0) setSrcLocationId(internalLocs[0]._id);
        if (customerLoc) setDestLocationId(customerLoc._id);
      } else if (type === 'internal') {
        if (internalLocs.length > 0) setSrcLocationId(internalLocs[0]._id);
        if (internalLocs.length > 1) setDestLocationId(internalLocs[1]._id);
        else if (internalLocs.length > 0) setDestLocationId(internalLocs[0]._id);
      }
    }
  }, [type, locations, showModal]);

  const handleCreateOperation = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);

    try {
      const payload = {
        type,
        warehouseId: selectedWH || warehouses[0]?._id,
        partner,
        srcLocationId,
        destLocationId,
        items: [
          {
            productId: selectedProductId || products[0]?._id,
            demandQty: Number(demandQty),
          },
        ],
        notes,
      };

      const res = await api.post('/operations', payload);
      if (res.data.success) {
        setShowModal(false);
        setPartner('');
        setDemandQty(1);
        fetchOperations();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create operation');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        fetchOperations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Validation failed due to insufficient stock');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this operation?')) return;
    try {
      const res = await api.post(`/operations/${id}/cancel`);
      if (res.data.success) {
        fetchOperations();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel operation');
    }
  };

  const TypeIcon =
    type === 'receipt'
      ? ArrowDownToLine
      : type === 'delivery'
      ? ArrowUpFromLine
      : ArrowLeftRight;

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <TypeIcon className="w-6 h-6 text-purple-400" />
            <span>{title}</span>
          </h2>
          <p className="text-sm text-slate-400">{subtitle}</p>
        </div>
        <button
          onClick={() => {
            if (products.length > 0 && !selectedProductId) setSelectedProductId(products[0]._id);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New {title.split(' ')[0]}</span>
        </button>
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
              placeholder="Search reference or partner..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
          >
            <option value="">All Statuses</option>
            <option value="ready">Ready for Validation</option>
            <option value="done">Completed (Done)</option>
            <option value="canceled">Canceled</option>
          </select>
        </div>
      </div>

      {/* Operations Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Reference</th>
                <th className="px-6 py-4">
                  {type === 'receipt' ? 'Vendor / Supplier' : type === 'delivery' ? 'Customer' : 'Route'}
                </th>
                <th className="px-6 py-4">Products / Qty</th>
                <th className="px-6 py-4">Source &rarr; Destination</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading operations...
                  </td>
                </tr>
              ) : operations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No {type} operations found.
                  </td>
                </tr>
              ) : (
                operations.map((op) => {
                  const isDone = op.status === 'done';
                  const isReady = op.status === 'ready';
                  const isCanceled = op.status === 'canceled';

                  return (
                    <tr key={op._id} className="hover:bg-slate-800/40 transition">
                      <td className="px-6 py-4 font-mono font-bold text-purple-300 text-sm">
                        {op.reference}
                      </td>
                      <td className="px-6 py-4 text-slate-200 font-medium">
                        {op.partner || (type === 'internal' ? 'Internal Movement' : 'General')}
                      </td>
                      <td className="px-6 py-4">
                        {op.items?.map((it, idx) => (
                          <div key={idx} className="flex items-center gap-2">
                            <span className="font-semibold text-slate-200">{it.productName}</span>
                            <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                              {it.demandQty} {it.uom}
                            </span>
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400">
                        <div className="font-medium text-slate-300">
                          {op.srcLocationId?.completeName || op.srcLocationId?.name}
                        </div>
                        <div className="text-purple-400 font-bold">&darr;</div>
                        <div className="font-medium text-slate-300">
                          {op.destLocationId?.completeName || op.destLocationId?.name}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                            isDone
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : isReady
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : isReady ? (
                            <Clock className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )}
                          <span>{op.status}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isReady && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleValidate(op._id)}
                              disabled={actionLoading}
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition cursor-pointer shadow-sm disabled:opacity-50"
                            >
                              Validate
                            </button>
                            <button
                              onClick={() => handleCancel(op._id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                        {isDone && (
                          <span className="text-xs text-slate-500 font-mono">Ledger Posted</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE OPERATION MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-purple-400" />
                <span>Create {title}</span>
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateOperation} className="space-y-4">
              {type !== 'internal' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    {type === 'receipt' ? 'Vendor / Supplier Name *' : 'Customer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={partner}
                    onChange={(e) => setPartner(e.target.value)}
                    placeholder={type === 'receipt' ? 'e.g. Tata Steel Ltd' : 'e.g. Acme Corp Industries'}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Warehouse
                  </label>
                  <select
                    value={selectedWH}
                    onChange={(e) => setSelectedWH(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
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
                    Product Item *
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={demandQty}
                    onChange={(e) => setDemandQty(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Notes / Remarks
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Batch info / PO ref"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Source and Destination Location selectors */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Source Location
                  </label>
                  <select
                    value={srcLocationId}
                    onChange={(e) => setSrcLocationId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.completeName || l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Destination Location
                  </label>
                  <select
                    value={destLocationId}
                    onChange={(e) => setDestLocationId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {locations.map((l) => (
                      <option key={l._id} value={l._id}>
                        {l.completeName || l.name} ({l.type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {actionLoading ? 'Creating...' : 'Create Operation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
