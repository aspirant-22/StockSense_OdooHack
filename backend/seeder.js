const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

const User = require('./models/User');
const Warehouse = require('./models/Warehouse');
const Location = require('./models/Location');
const ProductCategory = require('./models/ProductCategory');
const Product = require('./models/Product');
const StockOperation = require('./models/StockOperation');
const StockMove = require('./models/StockMove');
const StockQuant = require('./models/StockQuant');

dotenv.config();

const seedDefaultData = async () => {
  try {
    await connectDB();

    console.log('[Seeder] Cleaning existing database collections...');
    await Promise.all([
      User.deleteMany(),
      Warehouse.deleteMany(),
      Location.deleteMany(),
      ProductCategory.deleteMany(),
      Product.deleteMany(),
      StockOperation.deleteMany(),
      StockMove.deleteMany(),
      StockQuant.deleteMany(),
    ]);

    console.log('[Seeder] Creating Master Users...');
    const adminUser = await User.create({
      name: 'Odoo Inventory Lead',
      email: 'admin@stocksense.io',
      password: 'password123',
      role: 'manager',
    });

    const staffUser = await User.create({
      name: 'Warehouse Operator',
      email: 'staff@stocksense.io',
      password: 'password123',
      role: 'staff',
    });

    console.log('[Seeder] Creating System Virtual & Physical Locations...');
    // Virtual Partner Locations
    const vendorLoc = await Location.create({
      name: 'Vendors',
      completeName: 'Partner Locations/Vendors',
      type: 'supplier',
      isVirtual: true,
    });

    const customerLoc = await Location.create({
      name: 'Customers',
      completeName: 'Partner Locations/Customers',
      type: 'customer',
      isVirtual: true,
    });

    const lossLoc = await Location.create({
      name: 'Inventory Loss & Damage',
      completeName: 'Virtual Locations/Inventory Loss',
      type: 'inventory_loss',
      isVirtual: true,
    });

    // Warehouses
    const mainWH = await Warehouse.create({
      name: 'Main Central Warehouse',
      code: 'WH',
      address: 'Industrial Area Phase 2, New Delhi, India',
    });

    const secondaryWH = await Warehouse.create({
      name: 'Production Facility Warehouse',
      code: 'WH2',
      address: 'Ludhiana Plant, Punjab, India',
    });

    // Internal Warehouse Locations
    const whStock = await Location.create({
      name: 'Main Store / Stock',
      completeName: 'WH/Stock',
      type: 'internal',
      warehouseId: mainWH._id,
      isVirtual: false,
    });

    const whProductionRack = await Location.create({
      name: 'Production Rack A',
      completeName: 'WH/Production-A',
      type: 'internal',
      warehouseId: mainWH._id,
      isVirtual: false,
    });

    const wh2Stock = await Location.create({
      name: 'WH2 Main Floor',
      completeName: 'WH2/Stock',
      type: 'internal',
      warehouseId: secondaryWH._id,
      isVirtual: false,
    });

    console.log('[Seeder] Creating Product Categories...');
    const rawCat = await ProductCategory.create({
      name: 'Raw Materials & Metals',
      description: 'Industrial bars, plates, fasteners and raw metals',
    });

    const finishedCat = await ProductCategory.create({
      name: 'Finished Products & Furniture',
      description: 'Assembled chairs, tables and structural frames',
    });

    const elecCat = await ProductCategory.create({
      name: 'Electronics & Sensors',
      description: 'Sensors, microcontrollers and circuit components',
    });

    console.log('[Seeder] Creating Products with Reordering Alerts...');
    const steelRods = await Product.create({
      name: 'Steel Rods 10mm (High Tensile)',
      sku: 'RAW-STL-001',
      categoryId: rawCat._id,
      uom: 'kg',
      minStockAlert: 25,
      maxStockRule: 200,
      costPrice: 45.0,
      salesPrice: 75.0,
    });

    const officeChair = await Product.create({
      name: 'Ergonomic Mesh Chair V2',
      sku: 'FURN-CHR-010',
      categoryId: finishedCat._id,
      uom: 'Units',
      minStockAlert: 5,
      maxStockRule: 50,
      costPrice: 1200.0,
      salesPrice: 2499.0,
    });

    const proxSensor = await Product.create({
      name: 'Inductive Proximity Sensor M12',
      sku: 'ELEC-SNSR-007',
      categoryId: elecCat._id,
      uom: 'Units',
      minStockAlert: 15,
      maxStockRule: 100,
      costPrice: 180.0,
      salesPrice: 350.0,
    });

    console.log('[Seeder] Initializing Stock Quants (Availability Layer)...');
    await StockQuant.create([
      {
        productId: steelRods._id,
        locationId: whStock._id,
        warehouseId: mainWH._id,
        quantity: 100,
      },
      {
        productId: officeChair._id,
        locationId: whStock._id,
        warehouseId: mainWH._id,
        quantity: 12,
      },
      {
        productId: proxSensor._id,
        locationId: whStock._id,
        warehouseId: mainWH._id,
        quantity: 3, // Below minStockAlert (15) -> Will trigger LOW STOCK KPI
      },
      {
        productId: steelRods._id,
        locationId: whProductionRack._id,
        warehouseId: mainWH._id,
        quantity: 30,
      },
    ]);

    console.log('[Seeder] Recording Initial Double-Entry Ledger Moves...');
    await StockMove.create([
      {
        reference: 'IN/00001',
        operationType: 'receipt',
        productId: steelRods._id,
        productName: steelRods.name,
        productSku: steelRods.sku,
        srcLocationId: vendorLoc._id,
        srcLocationName: vendorLoc.completeName,
        destLocationId: whStock._id,
        destLocationName: whStock.completeName,
        quantity: 100,
        uom: steelRods.uom,
        status: 'done',
        dateDone: new Date(),
        createdBy: adminUser._id,
        notes: 'Initial opening balance stock receipt from Tata Steel Ltd',
      },
      {
        reference: 'IN/00002',
        operationType: 'receipt',
        productId: officeChair._id,
        productName: officeChair.name,
        productSku: officeChair.sku,
        srcLocationId: vendorLoc._id,
        srcLocationName: vendorLoc.completeName,
        destLocationId: whStock._id,
        destLocationName: whStock.completeName,
        quantity: 12,
        uom: officeChair.uom,
        status: 'done',
        dateDone: new Date(),
        createdBy: adminUser._id,
        notes: 'Batch intake from Prime Furniture Supplies',
      },
      {
        reference: 'INT/00001',
        operationType: 'internal',
        productId: steelRods._id,
        productName: steelRods.name,
        productSku: steelRods.sku,
        srcLocationId: whStock._id,
        srcLocationName: whStock.completeName,
        destLocationId: whProductionRack._id,
        destLocationName: whProductionRack.completeName,
        quantity: 30,
        uom: steelRods.uom,
        status: 'done',
        dateDone: new Date(),
        createdBy: staffUser._id,
        notes: 'Replenishing production floor assembly rack',
      },
    ]);

    console.log('✅ [Seeder] Default Odoo-Style Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [Seeder Error]:', error);
    process.exit(1);
  }
};

seedDefaultData();
