import React, { useState, useEffect } from 'react';
import { Building2, MapPin, Plus, X, Layers, AlertCircle } from 'lucide-react';
import api from '../../api/axiosClient';

export const WarehousesView = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [showWHModal, setShowWHModal] = useState(false);
  const [showLocModal, setShowLocModal] = useState(false);

  // Form States
  const [whName, setWhName] = useState('');
  const [whCode, setWhCode] = useState('');
  const [whAddress, setWhAddress] = useState('');

  const [locName, setLocName] = useState('');
  const [locType, setLocType] = useState('internal');
  const [locWHId, setLocWHId] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [whRes, locRes] = await Promise.all([
        api.get('/warehouses'),
        api.get('/warehouses/locations'),
      ]);
      if (whRes.data.success) setWarehouses(whRes.data.data);
      if (locRes.data.success) {
        setLocations(locRes.data.data);
        if (whRes.data.data.length > 0 && !locWHId) setLocWHId(whRes.data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching warehouse configuration', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateWarehouse = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/warehouses', {
        name: whName,
        code: whCode.toUpperCase(),
        address: whAddress,
      });
      if (res.data.success) {
        setShowWHModal(false);
        setWhName('');
        setWhCode('');
        setWhAddress('');
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create warehouse');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateLocation = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await api.post('/warehouses/locations', {
        name: locName,
        type: locType,
        warehouseId: locType === 'internal' ? locWHId : null,
      });
      if (res.data.success) {
        setShowLocModal(false);
        setLocName('');
        fetchData();
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create location');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-purple-400" />
            <span>Warehouses & Hierarchical Locations</span>
          </h2>
          <p className="text-sm text-slate-400">
            Multi-warehouse configuration and Odoo double-entry location topology
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowLocModal(true)}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
          >
            + New Location
          </button>
          <button
            onClick={() => setShowWHModal(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-500 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Warehouse</span>
          </button>
        </div>
      </div>

      {/* Warehouses Grid */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Active Warehouses ({warehouses.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {warehouses.map((wh) => (
            <div
              key={wh._id}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl space-y-3"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-base text-white">{wh.name}</h4>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {wh.code}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                  <Building2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400">{wh.address || 'No physical address specified'}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Locations Table */}
      <div>
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 mb-4">
          Stock Locations Structure ({locations.length})
        </h3>
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-xl">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Location Name</th>
                <th className="px-6 py-4">Complete Hierarchical Path</th>
                <th className="px-6 py-4">Location Type</th>
                <th className="px-6 py-4">Warehouse</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {locations.map((loc) => {
                const isInternal = loc.type === 'internal';
                return (
                  <tr key={loc._id} className="hover:bg-slate-800/40 transition">
                    <td className="px-6 py-4 font-semibold text-slate-200">{loc.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-purple-300">
                      {loc.completeName || loc.name}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                          isInternal
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : loc.type === 'supplier'
                            ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                            : loc.type === 'customer'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {loc.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400">
                      {loc.warehouseId ? `${loc.warehouseId.name} (${loc.warehouseId.code})` : 'Virtual / External'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE WAREHOUSE MODAL */}
      {showWHModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Warehouse</h3>
              <button onClick={() => setShowWHModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && <div className="mb-3 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{errorMsg}</div>}
            <form onSubmit={handleCreateWarehouse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Warehouse Name *
                </label>
                <input
                  type="text"
                  required
                  value={whName}
                  onChange={(e) => setWhName(e.target.value)}
                  placeholder="e.g. South Distribution Hub"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Code * (2-6 Chars)
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={whCode}
                  onChange={(e) => setWhCode(e.target.value)}
                  placeholder="e.g. WH3"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 uppercase focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={whAddress}
                  onChange={(e) => setWhAddress(e.target.value)}
                  placeholder="Street / City / Region"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowWHModal(false)} className="px-4 py-2 text-sm text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm transition"
                >
                  Save Warehouse
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE LOCATION MODAL */}
      {showLocModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">Add Location Node</h3>
              <button onClick={() => setShowLocModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {errorMsg && <div className="mb-3 p-3 rounded-xl bg-red-500/10 text-red-400 text-xs">{errorMsg}</div>}
            <form onSubmit={handleCreateLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Location Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Shelf B4 / Rack 2"
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Location Type *
                </label>
                <select
                  value={locType}
                  onChange={(e) => setLocType(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                >
                  <option value="internal">Internal Warehouse Location</option>
                  <option value="supplier">Vendor / Supplier (Virtual)</option>
                  <option value="customer">Customer / Outgoing (Virtual)</option>
                  <option value="inventory_loss">Inventory Loss & Gain (Virtual)</option>
                </select>
              </div>
              {locType === 'internal' && (
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Assign to Warehouse *
                  </label>
                  <select
                    value={locWHId}
                    onChange={(e) => setLocWHId(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {warehouses.map((w) => (
                      <option key={w._id} value={w._id}>
                        {w.name} ({w.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setShowLocModal(false)} className="px-4 py-2 text-sm text-slate-400">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-sm transition"
                >
                  Save Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
