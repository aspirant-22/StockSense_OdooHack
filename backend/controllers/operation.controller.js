const StockOperation = require('../models/StockOperation');
const StockMove = require('../models/StockMove');
const StockQuant = require('../models/StockQuant');
const Location = require('../models/Location');
const Product = require('../models/Product');
const StockEngineService = require('../services/stock.service');

const Warehouse = require('../models/Warehouse');

// Helper to generate sequential Odoo references
const generateSequence = async (type, warehouseId) => {
  let whCode = 'WH';
  if (warehouseId) {
    const wh = await Warehouse.findById(warehouseId);
    if (wh && wh.code) whCode = wh.code;
  }

  if (type === 'receipt') {
    const count = await StockOperation.countDocuments({ type: 'receipt', warehouseId });
    const nextSeq = String(count + 1).padStart(5, '0');
    return `${whCode}/IN/${nextSeq}`;
  }

  if (type === 'delivery') {
    const count = await StockOperation.countDocuments({ type: 'delivery', warehouseId });
    const nextSeq = String(count + 1).padStart(5, '0');
    return `${whCode}/OUT/${nextSeq}`;
  }

  const prefixMap = {
    internal: 'INT',
    adjustment: 'ADJ',
  };
  const prefix = prefixMap[type] || 'WH';
  const rand = Math.floor(10000 + Math.random() * 90000);
  return `${prefix}/${rand}`;
};

// @desc    Get all stock operations with dynamic filters (type, status, warehouse)
// @route   GET /api/operations
// @access  Private
const getOperations = async (req, res, next) => {
  try {
    const { type, status, warehouseId, search } = req.query;
    const filter = {};

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (warehouseId) filter.warehouseId = warehouseId;
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { partner: { $regex: search, $options: 'i' } },
      ];
    }

    const operations = await StockOperation.find(filter)
      .populate('warehouseId', 'name code')
      .populate('srcLocationId', 'name completeName type')
      .populate('destLocationId', 'name completeName type')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: operations.length, data: operations });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single stock operation by ID
// @route   GET /api/operations/:id
// @access  Private
const getOperationById = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id)
      .populate('warehouseId', 'name code')
      .populate('srcLocationId', 'name completeName type')
      .populate('destLocationId', 'name completeName type')
      .populate('createdBy', 'name email');

    if (!operation) {
      return res.status(404).json({ success: false, message: 'Stock operation not found' });
    }

    // Also fetch associated moves from ledger
    const moves = await StockMove.find({ operationId: operation._id });

    res.json({ success: true, data: operation, moves });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new Stock Operation (Draft state for receipts, ready for direct internal transfers)
// @route   POST /api/operations
// @access  Private
const createOperation = async (req, res, next) => {
  try {
    const {
      type,
      warehouseId,
      partner,
      srcLocationId,
      destLocationId,
      scheduledDate,
      items,
      notes,
      status: requestedStatus,
    } = req.body;

    const reference = await generateSequence(type, warehouseId);

    // Populate item details with snapshot names
    const populatedItems = await Promise.all(
      items.map(async (item) => {
        const prod = await Product.findById(item.productId);
        if (!prod) throw new Error(`Product ${item.productId} does not exist`);
        return {
          productId: prod._id,
          productName: prod.name,
          sku: prod.sku,
          demandQty: item.demandQty,
          doneQty: item.doneQty || item.demandQty,
          uom: prod.uom,
        };
      })
    );

    // Receipts and Deliveries default to 'draft' state as per Odoo lifecycle; others default to 'ready'
    let defaultStatus = ['receipt', 'delivery'].includes(type) ? 'draft' : 'ready';

    const operation = await StockOperation.create({
      reference,
      type,
      partner: partner || '',
      warehouseId,
      srcLocationId,
      destLocationId,
      scheduledDate: scheduledDate || new Date(),
      status: requestedStatus || defaultStatus,
      items: populatedItems,
      notes: notes || '',
      createdBy: req.user?._id,
    });

    res.status(201).json({ success: true, data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a draft operation as 'Ready' (To Do)
// @route   POST /api/operations/:id/mark-todo
// @access  Private
const markAsTodo = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }
    if (operation.status !== 'draft') {
      return res.status(400).json({ success: false, message: 'Only draft operations can be marked as To Do' });
    }

    operation.status = 'ready';
    await operation.save();

    res.json({ success: true, message: 'Operation state updated to Ready', data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Check Stock Availability for Delivery Orders (Evaluates Waiting vs Ready)
// @route   POST /api/operations/:id/check-availability
// @access  Private
const checkAvailability = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id)
      .populate('srcLocationId');

    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'done' || operation.status === 'canceled') {
      return res.status(400).json({ success: false, message: `Cannot check availability for ${operation.status} operation` });
    }

    // Check availability against StockQuant for each item in source location
    let allAvailable = true;
    const availabilityDetails = [];

    for (const item of operation.items) {
      const quant = await StockQuant.findOne({
        productId: item.productId,
        locationId: operation.srcLocationId._id,
      });

      const availableQty = quant ? quant.quantity : 0;
      const isShortage = availableQty < item.demandQty;

      if (isShortage) {
        allAvailable = false;
      }

      availabilityDetails.push({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        demanded: item.demandQty,
        available: availableQty,
        isAvailable: !isShortage,
      });
    }

    operation.status = allAvailable ? 'ready' : 'waiting';
    await operation.save();

    res.json({
      success: true,
      message: allAvailable
        ? 'Products available. Delivery order is READY to pick & pack.'
        : 'Insufficient stock in warehouse. Delivery marked as WAITING.',
      data: operation,
      availabilityDetails,
      allAvailable,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force a Waiting Delivery back to Draft
// @route   POST /api/operations/:id/force-draft
// @access  Private
const forceDraft = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    operation.status = 'draft';
    await operation.save();

    res.json({ success: true, message: 'Operation reset to Draft', data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Validate / Confirm a Stock Operation (Executes atomic StockMoves & Quants)
// @route   POST /api/operations/:id/validate
// @access  Private
const validateOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id)
      .populate('srcLocationId')
      .populate('destLocationId');

    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }

    if (operation.status === 'done') {
      return res.status(400).json({ success: false, message: 'Operation is already completed' });
    }
    if (operation.status === 'canceled') {
      return res.status(400).json({ success: false, message: 'Cannot validate a canceled operation' });
    }

    // Execute atomic move for each item in the operation
    for (const item of operation.items) {
      const qtyToMove = item.doneQty > 0 ? item.doneQty : item.demandQty;
      await StockEngineService.executeMove({
        reference: operation.reference,
        operationId: operation._id,
        operationType: operation.type,
        productId: item.productId,
        srcLocationId: operation.srcLocationId._id,
        destLocationId: operation.destLocationId._id,
        quantity: qtyToMove,
        uom: item.uom,
        userId: req.user?._id,
        notes: `Validated operation ${operation.reference}`,
      });
    }

    operation.status = 'done';
    await operation.save();

    res.json({
      success: true,
      message: `Operation ${operation.reference} validated successfully! Stock ledger updated.`,
      data: operation,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a stock operation
// @route   POST /api/operations/:id/cancel
// @access  Private
const cancelOperation = async (req, res, next) => {
  try {
    const operation = await StockOperation.findById(req.params.id);
    if (!operation) {
      return res.status(404).json({ success: false, message: 'Operation not found' });
    }
    if (operation.status === 'done') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed operation. Please create a reversal move or adjustment.',
      });
    }

    operation.status = 'canceled';
    await operation.save();

    res.json({ success: true, message: 'Operation canceled', data: operation });
  } catch (error) {
    next(error);
  }
};

// @desc    Reconcile stock count via direct Inventory Adjustment
// @route   POST /api/operations/adjust
// @access  Private
const adjustStockCount = async (req, res, next) => {
  try {
    const { productId, warehouseId, locationId, countedQuantity, reason } = req.body;
    const result = await StockEngineService.adjustStock({
      productId,
      warehouseId,
      locationId,
      countedQuantity,
      userId: req.user?._id,
      reason,
    });

    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock History Move Ledger (Full chronological audit trail)
// @route   GET /api/operations/ledger/moves
// @access  Private
const getStockLedger = async (req, res, next) => {
  try {
    const { operationType, productId, locationId, search } = req.query;
    const filter = {};

    if (operationType) filter.operationType = operationType;
    if (productId) filter.productId = productId;
    if (locationId) {
      filter.$or = [{ srcLocationId: locationId }, { destLocationId: locationId }];
    }
    if (search) {
      filter.$or = [
        { reference: { $regex: search, $options: 'i' } },
        { productName: { $regex: search, $options: 'i' } },
        { productSku: { $regex: search, $options: 'i' } },
      ];
    }

    const moves = await StockMove.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: moves.length, data: moves });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOperations,
  getOperationById,
  createOperation,
  markAsTodo,
  checkAvailability,
  forceDraft,
  validateOperation,
  cancelOperation,
  adjustStockCount,
  getStockLedger,
};
