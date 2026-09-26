const Product = require('../models/Product');
const StockQuant = require('../models/StockQuant');
const StockOperation = require('../models/StockOperation');
const StockMove = require('../models/StockMove');
const Location = require('../models/Location');

// @desc    Get 5 Dynamic Dashboard KPIs and Recent Operations
// @route   GET /api/dashboard/kpis
// @access  Private
const getDashboardKPIs = async (req, res, next) => {
  try {
    const { warehouseId } = req.query;

    // 1. Get internal locations
    const locFilter = { type: 'internal', active: true };
    if (warehouseId) locFilter.warehouseId = warehouseId;
    const internalLocations = await Location.find(locFilter).select('_id');
    const internalLocIds = internalLocations.map((l) => l._id);

    // 2. Fetch Quants in internal locations
    const quantFilter = { locationId: { $in: internalLocIds } };
    if (warehouseId) quantFilter.warehouseId = warehouseId;
    const quants = await StockQuant.find(quantFilter);

    // Group quantity by product
    const productStockMap = {};
    let totalStockCount = 0;

    quants.forEach((q) => {
      const pId = q.productId.toString();
      productStockMap[pId] = (productStockMap[pId] || 0) + q.quantity;
      totalStockCount += q.quantity;
    });

    // 3. Fetch all active products to determine Low Stock and Total Active Product count
    const allProducts = await Product.find({ active: true }).lean();
    let lowStockCount = 0;
    let outOfStockCount = 0;

    const lowStockItems = [];

    allProducts.forEach((prod) => {
      const stock = productStockMap[prod._id.toString()] || 0;
      if (stock === 0) {
        outOfStockCount++;
        lowStockCount++;
        lowStockItems.push({
          _id: prod._id,
          name: prod.name,
          sku: prod.sku,
          currentStock: 0,
          minStockAlert: prod.minStockAlert,
          uom: prod.uom,
          status: 'Out of Stock',
        });
      } else if (stock <= prod.minStockAlert) {
        lowStockCount++;
        lowStockItems.push({
          _id: prod._id,
          name: prod.name,
          sku: prod.sku,
          currentStock: stock,
          minStockAlert: prod.minStockAlert,
          uom: prod.uom,
          status: 'Low Stock Alert',
        });
      }
    });

    // 4. Pending Operations (Status 'ready' or 'waiting')
    const opFilter = {};
    if (warehouseId) opFilter.warehouseId = warehouseId;

    const [pendingReceipts, pendingDeliveries, scheduledTransfers] = await Promise.all([
      StockOperation.countDocuments({
        ...opFilter,
        type: 'receipt',
        status: { $in: ['ready', 'waiting'] },
      }),
      StockOperation.countDocuments({
        ...opFilter,
        type: 'delivery',
        status: { $in: ['ready', 'waiting'] },
      }),
      StockOperation.countDocuments({
        ...opFilter,
        type: 'internal',
        status: { $in: ['ready', 'waiting'] },
      }),
    ]);

    // 5. Recent Activity Feed (Latest 6 Stock Moves)
    const recentMoves = await StockMove.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(6);

    res.json({
      success: true,
      data: {
        kpis: {
          totalProductsInStock: totalStockCount,
          totalUniqueProducts: allProducts.length,
          lowStockCount,
          outOfStockCount,
          pendingReceipts,
          pendingDeliveries,
          scheduledTransfers,
        },
        lowStockItems: lowStockItems.slice(0, 5),
        recentMoves,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardKPIs,
};
