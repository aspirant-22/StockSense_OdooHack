import React, { useState, useEffect } from 'react';
import {
  ArrowUpFromLine,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Printer,
  LayoutList,
  Kanban,
  FileText,
  Calendar,
  User,
  Building,
  AlertTriangle,
  X,
  RefreshCw,
  Layers,
} from 'lucide-react';
import api from '../../api/axiosClient';
import { useAuth } from '../../context/AuthContext';

export const DeliveriesView = ({ selectedWarehouse }) => {
  const { user } = useAuth();

  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'

  // Selected Detail View (Odoo Form Voucher)
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  // Modal State for New Delivery
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);

  // Form fields
  const [selectedWH, setSelectedWH] = useState(selectedWarehouse || '');
  const [partner, setPartner] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split('T')[0]);
  const [srcLocationId, setSrcLocationId] = useState('');
  const [destLocationId, setDestLocationId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [demandQty, setDemandQty] = useState(1);
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDeliveries = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operations', {
        params: {
          type: 'delivery',
          status: statusFilter || undefined,
          warehouseId: selectedWarehouse || undefined,
          search: search || undefined,
        },
      });
      if (res.data.success) {
        setOperations(res.data.data);
        if (selectedDelivery) {
          const updated = res.data.data.find((o) => o._id === selectedDelivery._id);
          if (updated) setSelectedDelivery(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch delivery orders', err);
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
    fetchDeliveries();
  }, [statusFilter, selectedWarehouse, search]);

  useEffect(() => {
    fetchDependencies();
  }, []);

  // Default Source (Warehouse Main Stock) & Destination (Customer)
  useEffect(() => {
    if (locations.length > 0) {
      const customerLoc = locations.find((l) => l.type === 'customer');
      const internalLocs = locations.filter((l) => l.type === 'internal');

      if (internalLocs.length > 0) setSrcLocationId(internalLocs[0]._id);
      if (customerLoc) setDestLocationId(customerLoc._id);
    }
  }, [locations, showCreateModal]);

  // Helper to get available stock of selected product in current warehouse
  const getProductStock = (prodId) => {
    const p = products.find((prod) => prod._id === prodId);
    return p ? p.totalQuantity : 0;
  };

  const isCurrentSelectionOutOfStock = () => {
    if (!selectedProductId) return false;
    const stock = getProductStock(selectedProductId);
    return Number(demandQty) > stock;
  };

  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setActionLoading(true);

    try {
      const payload = {
        type: 'delivery',
        warehouseId: selectedWH || warehouses[0]?._id,
        partner,
        scheduledDate,
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
        setShowCreateModal(false);
        setPartner('');
        setDemandQty(1);
        fetchDeliveries();
        setSelectedDelivery(res.data.data);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create delivery order');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckAvailability = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/operations/${id}/check-availability`);
      if (res.data.success) {
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not verify stock availability');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceDraft = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/operations/${id}/force-draft`);
      if (res.data.success) {
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not reset delivery to Draft');
    } finally {
      setActionLoading(false);
    }
  };

  const handleValidate = async (id) => {
    setActionLoading(true);
    try {
      const res = await api.post(`/operations/${id}/validate`);
      if (res.data.success) {
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Validation failed due to stock shortage');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this delivery order?')) return;
    try {
      const res = await api.post(`/operations/${id}/cancel`);
      if (res.data.success) {
        fetchDeliveries();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not cancel delivery order');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const kanbanColumns = [
    { id: 'draft', label: 'Draft', color: 'border-slate-700 bg-slate-900/40 text-slate-300' },
    { id: 'waiting', label: 'Waiting (Shortage)', color: 'border-rose-500/40 bg-rose-950/20 text-rose-300' },
    { id: 'ready', label: 'Ready (To Ship)', color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300' },
    { id: 'done', label: 'Done (Shipped)', color: 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' },
  ];

  /* -------------------------------------------------------------------------- */
  /* DETAIL / VOUCHER VIEW (When a Delivery Order is clicked)                   */
  /* -------------------------------------------------------------------------- */
  if (selectedDelivery) {
    const isDraft = selectedDelivery.status === 'draft';
    const isWaiting = selectedDelivery.status === 'waiting';
    const isReady = selectedDelivery.status === 'ready';
    const isDone = selectedDelivery.status === 'done';
    const isCanceled = selectedDelivery.status === 'canceled';

    return (
      <div className="p-8 space-y-6 max-w-6xl mx-auto">
        {/* Back and Navigation Actions */}
        <div className="flex justify-between items-center print:hidden">
          <button
            onClick={() => setSelectedDelivery(null)}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            &larr; Back to Delivery Orders List
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Viewing Delivery:</span>
            <span className="font-mono font-bold text-white text-sm bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              {selectedDelivery.reference}
            </span>
          </div>
        </div>

        {/* DELIVERY VOUCHER CARD (PRINTABLE AREA) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl space-y-6 print:border-none print:shadow-none print:p-0 print:bg-white print:text-black">
          {/* Top Bar: Action Buttons (Left) & Odoo Status Ribbon (Right) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-800 print:border-slate-300">
            {/* Conditional Action Buttons */}
            <div className="flex items-center gap-2.5 print:hidden">
              {isDraft && (
                <>
                  <button
                    onClick={() => handleCheckAvailability(selectedDelivery._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-semibold text-xs transition shadow-md shadow-purple-600/20 cursor-pointer disabled:opacity-50"
                  >
                    Check Availability
                  </button>
                  <button
                    onClick={() => handleCancel(selectedDelivery._id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer border border-slate-700"
                  >
                    Cancel
                  </button>
                </>
              )}

              {isWaiting && (
                <>
                  <button
                    onClick={() => handleCheckAvailability(selectedDelivery._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs transition shadow-md shadow-amber-600/20 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${actionLoading ? 'animate-spin' : ''}`} />
                    <span>Re-Check Stock</span>
                  </button>
                  <button
                    onClick={() => handleForceDraft(selectedDelivery._id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer border border-slate-700"
                  >
                    Force Draft
                  </button>
                  <button
                    onClick={() => handleCancel(selectedDelivery._id)}
                    className="px-3.5 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs transition cursor-pointer border border-rose-500/30"
                  >
                    Cancel
                  </button>
                </>
              )}

              {isReady && (
                <>
                  <button
                    onClick={() => handleValidate(selectedDelivery._id)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition shadow-md shadow-emerald-600/20 cursor-pointer disabled:opacity-50"
                  >
                    Validate Delivery
                  </button>
                  <button
                    onClick={() => handleCancel(selectedDelivery._id)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition cursor-pointer border border-slate-700"
                  >
                    Cancel
                  </button>
                </>
              )}

              {isDone && (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 font-semibold text-xs transition cursor-pointer shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Delivery Slip</span>
                </button>
              )}

              {isCanceled && (
                <span className="text-xs text-rose-400 font-semibold px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  Delivery Order Canceled
                </span>
              )}
            </div>

            {/* Odoo 4-Stage Progression Ribbon: Draft ➔ Waiting ➔ Ready ➔ Done */}
            <div className="flex items-center bg-slate-950/80 border border-slate-800 rounded-xl p-1 text-xs font-semibold print:border-slate-400">
              <div
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                  isDraft
                    ? 'bg-purple-600 text-white shadow-sm'
                    : isWaiting || isReady || isDone
                    ? 'text-slate-400 font-medium'
                    : 'text-slate-600'
                }`}
              >
                <span>Draft</span>
              </div>
              <span className="text-slate-600 mx-1">&rarr;</span>
              <div
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                  isWaiting
                    ? 'bg-rose-600 text-white shadow-sm animate-pulse'
                    : isReady || isDone
                    ? 'text-slate-400 font-medium'
                    : 'text-slate-600'
                }`}
              >
                <span>Waiting</span>
              </div>
              <span className="text-slate-600 mx-1">&rarr;</span>
              <div
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                  isReady
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : isDone
                    ? 'text-slate-400 font-medium'
                    : 'text-slate-600'
                }`}
              >
                <span>Ready</span>
              </div>
              <span className="text-slate-600 mx-1">&rarr;</span>
              <div
                className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition ${
                  isDone ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                <span>Done</span>
              </div>
            </div>
          </div>

          {/* Out of Stock Alert Banner */}
          {isWaiting && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold block">Insufficient Stock in Warehouse!</span>
                The demanded item quantity exceeds available stock in location (
                <span className="font-semibold text-rose-200">
                  {selectedDelivery.srcLocationId?.completeName || selectedDelivery.srcLocationId?.name}
                </span>
                ). The order is locked in <span className="font-bold underline">Waiting</span> status until replenished.
              </div>
            </div>
          )}

          {/* Reference Heading */}
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 print:text-slate-700">
              Outgoing Delivery Order
            </span>
            <h1 className="text-3xl font-black font-mono text-purple-300 tracking-tight print:text-black">
              {selectedDelivery.reference}
            </h1>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-950/50 p-6 rounded-2xl border border-slate-800/80 print:bg-slate-50 print:border-slate-300 print:text-black">
            <div className="space-y-3">
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 print:text-slate-600">
                  Delivery Address / Customer:
                </span>
                <span className="text-base font-semibold text-slate-100 print:text-black">
                  {selectedDelivery.partner || 'Tata Motors / Azure Interior'}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 print:text-slate-600">
                  Responsible Officer:
                </span>
                <span className="text-sm font-medium text-purple-300 flex items-center gap-1.5 print:text-purple-800">
                  <User className="w-4 h-4" />
                  {selectedDelivery.createdBy?.name || user?.name || 'Garima'}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 print:text-slate-600">
                  Scheduled Shipping Date:
                </span>
                <span className="text-sm text-slate-200 flex items-center gap-1.5 print:text-black">
                  <Calendar className="w-4 h-4 text-slate-500 print:text-black" />
                  {new Date(selectedDelivery.scheduledDate || selectedDelivery.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="block text-xs uppercase font-bold text-slate-400 print:text-slate-600">
                  Source Stock Location:
                </span>
                <span className="text-sm font-semibold text-purple-300 print:text-purple-800">
                  {selectedDelivery.srcLocationId?.completeName || selectedDelivery.srcLocationId?.name || 'WH/Stock'}
                </span>
              </div>
            </div>
          </div>

          {/* Products Lines Table (With In-Line Bright Red Row Highlight Rule) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 print:text-black">
              Items to Deliver
            </h3>
            <div className="border border-slate-800 rounded-2xl overflow-hidden print:border-slate-300">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-950/80 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800 print:bg-slate-100 print:text-black print:border-slate-300">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">SKU</th>
                    <th className="px-6 py-3">Demanded Qty</th>
                    <th className="px-6 py-3">In-Stock Available</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">UOM</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 print:divide-slate-200 print:text-black">
                  {selectedDelivery.items?.map((item, idx) => {
                    const availableInStock = getProductStock(item.productId);
                    const hasShortage = item.demandQty > availableInStock && !isDone;

                    return (
                      <tr
                        key={idx}
                        className={`transition ${
                          hasShortage
                            ? 'bg-rose-950/50 text-rose-300 border-y-2 border-rose-500 font-semibold'
                            : 'bg-slate-950/30 text-slate-200 print:bg-white print:text-black'
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {hasShortage && <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />}
                            <span className={hasShortage ? 'text-rose-200 font-bold' : 'text-slate-100'}>
                              {item.productName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          {item.sku}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          {item.demandQty}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          <span className={hasShortage ? 'text-rose-400 underline font-extrabold' : 'text-emerald-400'}>
                            {availableInStock}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {hasShortage ? (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-rose-500/30 text-rose-200 border border-rose-500">
                              Out of Stock
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                              Available
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-400 print:text-black">
                          {item.uom || 'Units'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {selectedDelivery.notes && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-400 print:text-black print:border-slate-300">
              <span className="font-bold text-slate-300 print:text-black block mb-1">Notes:</span>
              {selectedDelivery.notes}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* MAIN LIST / KANBAN VIEW (When no delivery is selected)                     */
  /* -------------------------------------------------------------------------- */
  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <ArrowUpFromLine className="w-6 h-6 text-purple-400" />
            <span>Delivery Orders (Outgoing Goods)</span>
          </h2>
          <p className="text-sm text-slate-400">
            Pick, pack, and validate customer order dispatch with automated availability checks
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* List / Kanban View Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode('list')}
              title="List View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span>List</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
              className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                viewMode === 'kanban'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Kanban className="w-4 h-4" />
              <span>Kanban</span>
            </button>
          </div>

          <button
            onClick={() => {
              if (products.length > 0 && !selectedProductId) setSelectedProductId(products[0]._id);
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>NEW Delivery</span>
          </button>
        </div>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference or customer name..."
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
            <option value="draft">Draft</option>
            <option value="waiting">Waiting (Shortage)</option>
            <option value="ready">Ready (Available)</option>
            <option value="done">Done (Shipped)</option>
          </select>
        </div>
      </div>

      {/* -------------------------------------------------------------------------- */}
      {/* 1. LIST VIEW RENDERING (Default per wireframe)                            */}
      {/* -------------------------------------------------------------------------- */}
      {viewMode === 'list' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-6 py-4">Reference</th>
                  <th className="px-6 py-4">From (Location)</th>
                  <th className="px-6 py-4">To (Customer)</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4">Schedule Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      Loading delivery orders...
                    </td>
                  </tr>
                ) : operations.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                      No delivery orders found.
                    </td>
                  </tr>
                ) : (
                  operations.map((op) => {
                    const isDraft = op.status === 'draft';
                    const isWaiting = op.status === 'waiting';
                    const isReady = op.status === 'ready';
                    const isDone = op.status === 'done';

                    return (
                      <tr
                        key={op._id}
                        onClick={() => setSelectedDelivery(op)}
                        className="hover:bg-slate-800/40 transition cursor-pointer group"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-purple-300 text-sm group-hover:text-purple-200">
                          {op.reference}
                        </td>
                        <td className="px-6 py-4 text-slate-200 text-xs font-medium">
                          {op.srcLocationId?.completeName || 'WH/Stock1'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {op.destLocationId?.completeName || 'Customer'}
                        </td>
                        <td className="px-6 py-4 text-slate-200 font-medium">
                          {op.partner || 'Azure Interior'}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(op.scheduledDate || op.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                              isDone
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : isReady
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : isWaiting
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                : 'bg-slate-700/30 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : isReady ? (
                              <Clock className="w-3.5 h-3.5" />
                            ) : isWaiting ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                            ) : (
                              <FileText className="w-3.5 h-3.5" />
                            )}
                            <span>{op.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                          {isDraft && (
                            <button
                              onClick={() => handleCheckAvailability(op._id)}
                              className="px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/30 text-purple-300 text-xs font-semibold transition"
                            >
                              Check Stock
                            </button>
                          )}
                          {isWaiting && (
                            <button
                              onClick={() => handleCheckAvailability(op._id)}
                              className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
                            >
                              Re-check
                            </button>
                          )}
                          {isReady && (
                            <button
                              onClick={() => handleValidate(op._id)}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition"
                            >
                              Validate
                            </button>
                          )}
                          {isDone && (
                            <button
                              onClick={() => {
                                setSelectedDelivery(op);
                                setTimeout(() => window.print(), 200);
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                            >
                              Print
                            </button>
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
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* 2. KANBAN VIEW RENDERING (4 Columns: Draft, Waiting, Ready, Done)         */}
      {/* -------------------------------------------------------------------------- */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kanbanColumns.map((col) => {
            const colItems = operations.filter((op) => op.status === col.id);

            return (
              <div
                key={col.id}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4 backdrop-blur-xl flex flex-col h-full min-h-[400px]"
              >
                {/* Column Header */}
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <h3 className="font-bold text-sm text-slate-200">{col.label}</h3>
                  <span className="font-mono text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                    {colItems.length}
                  </span>
                </div>

                {/* Items in Lane */}
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {colItems.length === 0 ? (
                    <div className="h-32 flex items-center justify-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                      No {col.id} orders
                    </div>
                  ) : (
                    colItems.map((op) => (
                      <div
                        key={op._id}
                        onClick={() => setSelectedDelivery(op)}
                        className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-purple-500/40 transition cursor-pointer space-y-2.5 shadow-sm group"
                      >
                        <div className="flex justify-between items-start">
                          <span className="font-mono font-bold text-purple-300 text-xs group-hover:text-purple-200">
                            {op.reference}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(op.scheduledDate || op.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div>
                          <p className="font-semibold text-sm text-slate-100">{op.partner || 'Customer'}</p>
                          <p className="text-xs text-slate-400">
                            From: {op.srcLocationId?.completeName || 'WH/Stock'}
                          </p>
                        </div>

                        {op.items?.length > 0 && (
                          <div className="pt-2 border-t border-slate-800/80 flex justify-between text-xs text-slate-400">
                            <span className="truncate max-w-[140px]">{op.items[0].productName}</span>
                            <span className="font-mono text-purple-400 font-bold">
                              {op.items[0].demandQty} {op.items[0].uom}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -------------------------------------------------------------------------- */}
      {/* CREATE DELIVERY MODAL (With Live In-Stock Indicator & Red Alert)          */}
      {/* -------------------------------------------------------------------------- */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ArrowUpFromLine className="w-5 h-5 text-purple-400" />
                <span>Create Delivery Orders (Outgoing Goods)</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
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

            <form onSubmit={handleCreateDelivery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Customer / Delivery Address *
                </label>
                <input
                  type="text"
                  required
                  value={partner}
                  onChange={(e) => setPartner(e.target.value)}
                  placeholder="e.g. Tata Motors / Azure Interior"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Responsible Officer (Auto-fill from AuthContext & Read-only) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
                    Responsible Officer
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-purple-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      readOnly
                      value={user?.name || 'Garima'}
                      className="w-full bg-slate-950/90 border border-purple-500/30 rounded-xl pl-9 pr-3 py-2 text-sm font-semibold text-purple-200 cursor-not-allowed"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Schedule Date
                  </label>
                  <input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Warehouse Source
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
                        {p.name} ({p.sku}) [Stock: {p.totalQuantity}]
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Quantity and In-Stock Live Comparison Alert */}
              <div
                className={`p-3.5 rounded-xl border transition ${
                  isCurrentSelectionOutOfStock()
                    ? 'bg-rose-950/40 border-rose-500'
                    : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Quantity to Ship *
                    </label>
                    <input
                      type="number"
                      min="0.01"
                      step="any"
                      required
                      value={demandQty}
                      onChange={(e) => setDemandQty(e.target.value)}
                      className={`w-full bg-slate-900 border rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none ${
                        isCurrentSelectionOutOfStock()
                          ? 'border-rose-500 text-rose-300'
                          : 'border-slate-700 text-slate-200 focus:border-purple-500'
                      }`}
                    />
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Current In-Stock Available
                    </span>
                    <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 font-mono text-sm font-bold flex items-center justify-between">
                      <span className={isCurrentSelectionOutOfStock() ? 'text-rose-400' : 'text-emerald-400'}>
                        {getProductStock(selectedProductId)} Units
                      </span>
                    </div>
                  </div>
                </div>

                {/* Wireframe Rule Insufficient Stock Alert */}
                {isCurrentSelectionOutOfStock() && (
                  <div className="mt-2 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>Alert: Demanded quantity exceeds stock! Order will enter Waiting status.</span>
                  </div>
                )}
              </div>

              {/* Source (Warehouse Stock) and Destination (Customer) */}
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
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/20 disabled:opacity-50 cursor-pointer"
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
