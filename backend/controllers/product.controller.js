const Product = require('../models/Product');
const ProductCategory = require('../models/ProductCategory');
const StockQuant = require('../models/StockQuant');
const Location = require('../models/Location');
const StockEngineService = require('../services/stock.service');

// @desc    Get all product categories
// @route   GET /api/products/categories
// @access  Private
const getCategories = async (req, res, next) => {
  try {
    const categories = await ProductCategory.find().sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

// @desc    Create product category
// @route   POST /api/products/categories
// @access  Private
const createCategory = async (req, res, next) => {
  try {
    const { name, description } = req.body;
    const category = await ProductCategory.create({ name, description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products with total stock availability and low stock alert flag
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const { categoryId, search, lowStockOnly } = req.query;
    const filter = { active: true };

    if (categoryId) filter.categoryId = categoryId;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
      ];
    }

    const products = await Product.find(filter)
      .populate('categoryId', 'name')
      .sort({ createdAt: -1 })
      .lean();

    // Attach total quantity and per-location breakdowns
    const productIds = products.map((p) => p._id);
    const quants = await StockQuant.find({ productId: { $in: productIds } })
      .populate('locationId', 'name completeName type')
      .populate('warehouseId', 'name code')
      .lean();

    const enrichedProducts = products.map((product) => {
      const productQuants = quants.filter(
        (q) => q.productId.toString() === product._id.toString()
      );
      
      // Calculate total stock in internal locations
      const totalAvailable = productQuants
        .filter((q) => q.locationId && q.locationId.type === 'internal')
        .reduce((sum, q) => sum + (q.quantity || 0), 0);

      const isLowStock = totalAvailable <= product.minStockAlert;
      const isOutOfStock = totalAvailable === 0;

      return {
        ...product,
        totalQuantity: totalAvailable,
        isLowStock,
        isOutOfStock,
        stockByLocation: productQuants.map((q) => ({
          locationId: q.locationId?._id,
          locationName: q.locationId?.completeName || q.locationId?.name || 'Unknown',
          warehouseCode: q.warehouseId?.code || 'N/A',
          quantity: q.quantity,
        })),
      };
    });

    const finalResults = lowStockOnly === 'true'
      ? enrichedProducts.filter((p) => p.isLowStock)
      : enrichedProducts;

    res.json({ success: true, count: finalResults.length, data: finalResults });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('categoryId', 'name')
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const quants = await StockQuant.find({ productId: product._id })
      .populate('locationId', 'name completeName type')
      .populate('warehouseId', 'name code')
      .lean();

    const totalAvailable = quants
      .filter((q) => q.locationId && q.locationId.type === 'internal')
      .reduce((sum, q) => sum + (q.quantity || 0), 0);

    res.json({
      success: true,
      data: {
        ...product,
        totalQuantity: totalAvailable,
        isLowStock: totalAvailable <= product.minStockAlert,
        isOutOfStock: totalAvailable === 0,
        quants,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new product with optional initial stock intake
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      categoryId,
      uom,
      minStockAlert,
      maxStockRule,
      costPrice,
      salesPrice,
      initialStock,
      initialWarehouseId,
    } = req.body;

    const product = await Product.create({
      name,
      sku: sku.toUpperCase(),
      categoryId,
      uom: uom || 'Units',
      minStockAlert: minStockAlert !== undefined ? minStockAlert : 10,
      maxStockRule: maxStockRule || 100,
      costPrice: costPrice || 0,
      salesPrice: salesPrice || 0,
    });

    // If initial stock is specified, execute opening balance receipt
    if (initialStock && initialStock > 0) {
      let destLoc;
      if (initialWarehouseId) {
        destLoc = await Location.findOne({ warehouseId: initialWarehouseId, type: 'internal' });
      }
      if (!destLoc) {
        destLoc = await Location.findOne({ type: 'internal' });
      }

      let vendorLoc = await Location.findOne({ type: 'supplier' });
      if (!vendorLoc) {
        vendorLoc = await Location.create({
          name: 'Vendors',
          completeName: 'Partner Locations/Vendors',
          type: 'supplier',
          isVirtual: true,
        });
      }

      if (destLoc) {
        await StockEngineService.executeMove({
          reference: `INIT/${product.sku}`,
          operationType: 'receipt',
          productId: product._id,
          srcLocationId: vendorLoc._id,
          destLocationId: destLoc._id,
          quantity: Number(initialStock),
          uom: product.uom,
          userId: req.user?._id,
          notes: 'Initial opening stock upon product creation',
        });
      }
    }

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product details
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('categoryId', 'name');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  createCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
};
