const Warehouse = require('../models/Warehouse');
const Location = require('../models/Location');
const StockQuant = require('../models/StockQuant');

// @desc    Get all warehouses
// @route   GET /api/warehouses
// @access  Private
const getWarehouses = async (req, res, next) => {
  try {
    const warehouses = await Warehouse.find({ active: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: warehouses });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new warehouse
// @route   POST /api/warehouses
// @access  Private
const createWarehouse = async (req, res, next) => {
  try {
    const { name, code, address } = req.body;
    const warehouse = await Warehouse.create({ name, code: code.toUpperCase(), address });

    // Auto-create default internal locations for this warehouse
    const mainLoc = await Location.create({
      name: `${code} Stock Floor`,
      completeName: `${code}/Stock`,
      type: 'internal',
      warehouseId: warehouse._id,
      isVirtual: false,
    });

    res.status(201).json({ success: true, data: warehouse, defaultLocation: mainLoc });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all locations (supports type filter and warehouse filter)
// @route   GET /api/warehouses/locations
// @access  Private
const getLocations = async (req, res, next) => {
  try {
    const { warehouseId, type } = req.query;
    const filter = { active: true };
    if (warehouseId) filter.warehouseId = warehouseId;
    if (type) filter.type = type;

    const locations = await Location.find(filter).populate('warehouseId', 'name code').sort({ name: 1 });
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new location
// @route   POST /api/warehouses/locations
// @access  Private
const createLocation = async (req, res, next) => {
  try {
    const { name, type, warehouseId, parentId } = req.body;

    let completeName = name;
    if (warehouseId) {
      const wh = await Warehouse.findById(warehouseId);
      if (wh) completeName = `${wh.code}/${name}`;
    }

    const location = await Location.create({
      name,
      completeName,
      type,
      warehouseId: warehouseId || null,
      parentId: parentId || null,
      isVirtual: ['supplier', 'customer', 'inventory_loss'].includes(type),
    });

    res.status(201).json({ success: true, data: location });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  createWarehouse,
  getLocations,
  createLocation,
};
