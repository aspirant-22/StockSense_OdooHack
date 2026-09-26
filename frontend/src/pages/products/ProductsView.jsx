import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Building,
  DollarSign,
  Tag,
  Layers,
  X,
} from 'lucide-react';
import api from '../../api/axiosClient';

export const ProductsView = ({ selectedWarehouse, openAdjustmentModal }) => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal State for New Product Creation
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStockDetailModal, setShowStockDetailModal] = useState(null);
  const [warehouses, setWarehouses] = useState([]);

  // Form inputs
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [uom, setUom] = useState('Units');
  const [minStockAlert, setMinStockAlert] = useState(10);
  const [maxStockRule, setMaxStockRule] = useState(100);
  const [costPrice, setCostPrice] = useState(0);
  const [salesPrice, setSalesPrice] = useState(0);
  const [initialStock, setInitialStock] = useState(0);
  const [initialWarehouseId, setInitialWarehouseId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes, whRes] = await Promise.all([
        api.get('/products', {
          params: {
            search: search || undefined,
            categoryId: selectedCategory || undefined,
            lowStockOnly: lowStockFilter ? 'true' : undefined,
          },
        }),
        api.get('/products/categories'),
        api.get('/warehouses'),
      ]);

      if (prodRes.data.success) setProducts(prodRes.data.data);
      if (catRes.data.success) setCategories(catRes.data.data);
      if (whRes.data.success) {
        setWarehouses(whRes.data.data);
        if (whRes.data.data.length > 0) setInitialWarehouseId(whRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error loading products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, selectedCategory, lowStockFilter]);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        name,
        sku,
        categoryId,
        uom,
        minStockAlert: Number(minStockAlert),
        maxStockRule: Number(maxStockRule),
        costPrice: Number(costPrice),
        salesPrice: Number(salesPrice),
        initialStock: Number(initialStock),
        initialWarehouseId: initialWarehouseId || undefined,
      };

      const res = await api.post('/products', payload);
      if (res.data.success) {
        setShowCreateModal(false);
        // Reset form
        setName('');
        setSku('');
        setMinStockAlert(10);
        setInitialStock(0);
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Action */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Product Master & Inventory</h2>
          <p className="text-sm text-slate-400">
            SKU registry, live location stock availability, and automated reordering rules
          </p>
        </div>
        <button
          onClick={() => {
            if (categories.length > 0 && !categoryId) setCategoryId(categories[0]._id);
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Dynamic Filters Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[300px]">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Product Name or SKU..."
              className="w-full bg-slate-950/60 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Low Stock Toggle Badge */}
        <button
          onClick={() => setLowStockFilter(!lowStockFilter)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition cursor-pointer border ${
            lowStockFilter
              ? 'bg-rose-500/20 border-rose-500 text-rose-300'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Low Stock Alert Only</span>
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Product / SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Available Stock</th>
                <th className="px-6 py-4">Min Stock Rule</th>
                <th className="px-6 py-4">Valuation</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    Loading product catalog...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No products match your search or filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  return (
                    <tr
                      key={p._id}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => setShowStockDetailModal(p)}
                    >
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-100 group-hover:text-purple-300 transition">
                          {p.name}
                        </div>
                        <div className="font-mono text-xs text-slate-400 mt-0.5">{p.sku}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                          {p.categoryId?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-mono font-bold text-base ${
                              p.isOutOfStock
                                ? 'text-rose-400'
                                : p.isLowStock
                                ? 'text-amber-400'
                                : 'text-emerald-400'
                            }`}
                          >
                            {p.totalQuantity} {p.uom}
                          </span>
                          {p.isLowStock && (
                            <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                              {p.isOutOfStock ? 'Empty' : 'Low'}
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {p.stockByLocation?.length || 0} locations recorded
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-300 font-mono text-xs">
                        Min: <span className="text-amber-300 font-bold">{p.minStockAlert}</span> / Max: {p.maxStockRule || 100}
                      </td>
                      <td className="px-6 py-4 text-slate-300 text-xs">
                        <div>Cost: ₹{p.costPrice || 0}</div>
                        <div className="text-slate-400">Sale: ₹{p.salesPrice || 0}</div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => openAdjustmentModal(p)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-medium transition cursor-pointer"
                        >
                          Adjust Count
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE PRODUCT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-purple-400" />
                <span>Create Master Product</span>
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

            <form onSubmit={handleCreateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Steel Pipe 20mm"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    SKU / Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. RAW-STL-020"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 uppercase focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Category *
                  </label>
                  <select
                    required
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Unit of Measure (UOM)
                  </label>
                  <select
                    value={uom}
                    onChange={(e) => setUom(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    <option value="Units">Units (pcs)</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="Meters">Meters (m)</option>
                    <option value="Liters">Liters (L)</option>
                    <option value="Boxes">Boxes</option>
                  </select>
                </div>
              </div>

              {/* Reordering Rules */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-950/40 border border-slate-800/80">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-1">
                    Min Stock Alert Rule
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minStockAlert}
                    onChange={(e) => setMinStockAlert(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Max Stock Target
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={maxStockRule}
                    onChange={(e) => setMaxStockRule(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Initial Stock Intake (Optional) */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-purple-950/20 border border-purple-900/30">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
                    Initial Stock Intake
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={initialStock}
                    onChange={(e) => setInitialStock(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-purple-300 mb-1">
                    Target Warehouse
                  </label>
                  <select
                    value={initialWarehouseId}
                    onChange={(e) => setInitialWarehouseId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
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
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white font-semibold text-sm transition shadow-lg shadow-purple-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STOCK BREAKDOWN PER LOCATION MODAL */}
      {showStockDetailModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">{showStockDetailModal.name}</h3>
                <p className="font-mono text-xs text-purple-400">{showStockDetailModal.sku}</p>
              </div>
              <button
                onClick={() => setShowStockDetailModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider px-2">
                <span>Warehouse Location</span>
                <span>Stock Quant</span>
              </div>
              {showStockDetailModal.stockByLocation?.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 text-center text-xs text-slate-500">
                  No stock records in internal locations.
                </div>
              ) : (
                showStockDetailModal.stockByLocation?.map((loc, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 rounded-xl bg-slate-950/60 border border-slate-800/80"
                  >
                    <div>
                      <span className="font-medium text-sm text-slate-200 block">
                        {loc.locationName}
                      </span>
                      <span className="text-[11px] text-slate-500 uppercase">
                        Warehouse: {loc.warehouseCode}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-sm text-emerald-400">
                      {loc.quantity} {showStockDetailModal.uom}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-slate-800">
              <div className="text-xs text-slate-400">
                Total Available:{' '}
                <span className="font-bold text-white">
                  {showStockDetailModal.totalQuantity} {showStockDetailModal.uom}
                </span>
              </div>
              <button
                onClick={() => {
                  const p = showStockDetailModal;
                  setShowStockDetailModal(null);
                  openAdjustmentModal(p);
                }}
                className="px-4 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/30 text-amber-300 text-xs font-semibold transition"
              >
                Adjust Physical Count
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
