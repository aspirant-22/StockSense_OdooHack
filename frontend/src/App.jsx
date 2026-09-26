import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthModal } from './pages/auth/AuthModal';
import { Sidebar } from './components/layout/Sidebar';
import { Topbar } from './components/layout/Topbar';
import { DashboardView } from './pages/dashboard/DashboardView';
import { ProductsView } from './pages/products/ProductsView';
import { OperationsView } from './pages/operations/OperationsView';
import { AdjustmentsView } from './pages/operations/AdjustmentsView';
import { LedgerView } from './pages/ledger/LedgerView';
import { WarehousesView } from './pages/settings/WarehousesView';
import { AdjustmentModal } from './components/forms/AdjustmentModal';
import api from './api/axiosClient';

function MainApp() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [warehouses, setWarehouses] = useState([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');

  // Global adjustment modal
  const [adjustmentProduct, setAdjustmentProduct] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    const loadWarehouses = async () => {
      try {
        const res = await api.get('/warehouses');
        if (res.data.success) {
          setWarehouses(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load global warehouses', err);
      }
    };
    if (user) {
      loadWarehouses();
    }
  }, [user]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  const getPageMeta = () => {
    switch (activeTab) {
      case 'dashboard':
        return { title: 'Operational Dashboard', subtitle: 'Overview of stock metrics & movement ledger' };
      case 'products':
        return { title: 'Products & Reordering Rules', subtitle: 'Manage SKUs, locations & alert thresholds' };
      case 'receipts':
        return { title: 'Incoming Receipts', subtitle: 'Vendor deliveries into Main Stock' };
      case 'deliveries':
        return { title: 'Delivery Orders', subtitle: 'Customer shipments and order dispatch' };
      case 'transfers':
        return { title: 'Internal Transfers', subtitle: 'Warehouse floor and rack-to-rack stock shifts' };
      case 'adjustments':
        return { title: 'Inventory Adjustments', subtitle: 'Physical count mismatch reconciliations' };
      case 'ledger':
        return { title: 'Stock Move History Ledger', subtitle: 'Immutable double-entry audit timeline' };
      case 'warehouses':
        return { title: 'Warehouses & Locations', subtitle: 'Manage nodes and storage locations' };
      default:
        return { title: 'StockSense IMS', subtitle: '' };
    }
  };

  const meta = getPageMeta();

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Topbar
          title={meta.title}
          subtitle={meta.subtitle}
          warehouses={warehouses}
          selectedWarehouse={selectedWarehouse}
          onWarehouseChange={setSelectedWarehouse}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'dashboard' && (
            <DashboardView
              selectedWarehouse={selectedWarehouse}
              setActiveTab={setActiveTab}
              openNewOperationModal={(type) => {
                if (type === 'receipt') setActiveTab('receipts');
                else if (type === 'delivery') setActiveTab('deliveries');
                else if (type === 'internal') setActiveTab('transfers');
                else if (type === 'adjustment') setActiveTab('adjustments');
              }}
            />
          )}

          {activeTab === 'products' && (
            <ProductsView
              selectedWarehouse={selectedWarehouse}
              openAdjustmentModal={(p) => setAdjustmentProduct(p)}
            />
          )}

          {activeTab === 'receipts' && (
            <OperationsView
              type="receipt"
              title="Receipts (Incoming Stock)"
              subtitle="Receive products from vendors into internal warehouse storage"
              selectedWarehouse={selectedWarehouse}
            />
          )}

          {activeTab === 'deliveries' && (
            <OperationsView
              type="delivery"
              title="Delivery Orders (Outgoing Goods)"
              subtitle="Pick, pack, and validate customer shipments from stock"
              selectedWarehouse={selectedWarehouse}
            />
          )}

          {activeTab === 'transfers' && (
            <OperationsView
              type="internal"
              title="Internal Transfers"
              subtitle="Relocate stock between internal locations, racks, or warehouses"
              selectedWarehouse={selectedWarehouse}
            />
          )}

          {activeTab === 'adjustments' && (
            <AdjustmentsView
              selectedWarehouse={selectedWarehouse}
              openAdjustmentModal={(p) => setAdjustmentProduct(p)}
            />
          )}

          {activeTab === 'ledger' && <LedgerView selectedWarehouse={selectedWarehouse} />}

          {activeTab === 'warehouses' && <WarehousesView />}
        </main>
      </div>

      {/* Global Stock Adjustment Modal */}
      {adjustmentProduct && (
        <AdjustmentModal
          product={adjustmentProduct}
          warehouses={warehouses}
          onClose={() => setAdjustmentProduct(null)}
          onSuccess={(msg) => showToast(msg)}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-emerald-500/40 text-emerald-300 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl text-sm font-medium z-50 animate-bounce">
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
