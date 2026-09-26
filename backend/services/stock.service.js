const StockQuant = require('../models/StockQuant');
const StockMove = require('../models/StockMove');
const Location = require('../models/Location');
const Product = require('../models/Product');

/**
 * Core Stock Movement Execution Service
 * Handles Odoo double-entry inventory logic:
 * - Increases or decreases location quants based on location types (supplier, internal, customer, inventory_loss)
 * - Records an immutable StockMove ledger row with status 'done'
 */
class StockEngineService {
  /**
   * Process a confirmed stock move between two locations
   */
  static async executeMove({
    reference,
    operationId = null,
    operationType,
    productId,
    srcLocationId,
    destLocationId,
    quantity,
    uom = 'Units',
    userId = null,
    notes = '',
  }) {
    if (quantity <= 0) {
      throw new Error('Move quantity must be greater than zero');
    }

    const [product, srcLoc, destLoc] = await Promise.all([
      Product.findById(productId),
      Location.findById(srcLocationId),
      Location.findById(destLocationId),
    ]);

    if (!product) throw new Error(`Product not found: ${productId}`);
    if (!srcLoc) throw new Error(`Source location not found: ${srcLocationId}`);
    if (!destLoc) throw new Error(`Destination location not found: ${destLocationId}`);

    // If source is an INTERNAL location, verify sufficient stock availability
    if (srcLoc.type === 'internal') {
      const srcQuant = await StockQuant.findOne({
        productId: product._id,
        locationId: srcLoc._id,
      });

      const currentQty = srcQuant ? srcQuant.quantity : 0;
      if (currentQty < quantity) {
        throw new Error(
          `Insufficient stock at ${srcLoc.completeName || srcLoc.name}. Available: ${currentQty}, Requested: ${quantity}`
        );
      }

      // Deduct from source quant
      await StockQuant.findOneAndUpdate(
        { productId: product._id, locationId: srcLoc._id },
        { $inc: { quantity: -quantity }, warehouseId: srcLoc.warehouseId },
        { upsert: true, new: true }
      );
    }

    // If destination is an INTERNAL location, increase destination quant
    if (destLoc.type === 'internal') {
      await StockQuant.findOneAndUpdate(
        { productId: product._id, locationId: destLoc._id },
        { $inc: { quantity: quantity }, warehouseId: destLoc.warehouseId },
        { upsert: true, new: true }
      );
    }

    // Record immutable move in ledger
    const move = await StockMove.create({
      reference,
      operationId,
      operationType,
      productId: product._id,
      productName: product.name,
      productSku: product.sku,
      srcLocationId: srcLoc._id,
      srcLocationName: srcLoc.completeName || srcLoc.name,
      destLocationId: destLoc._id,
      destLocationName: destLoc.completeName || destLoc.name,
      quantity,
      uom: uom || product.uom,
      status: 'done',
      dateDone: new Date(),
      createdBy: userId,
      notes,
    });

    return move;
  }

  /**
   * Adjust inventory directly for a product at a specific location
   */
  static async adjustStock({ productId, warehouseId, locationId, countedQuantity, userId, reason = '' }) {
    const [product, location] = await Promise.all([
      Product.findById(productId),
      Location.findById(locationId),
    ]);

    if (!product) throw new Error('Product not found');
    if (!location) throw new Error('Location not found');

    const quant = await StockQuant.findOne({ productId: product._id, locationId: location._id });
    const currentQty = quant ? quant.quantity : 0;
    const diff = countedQuantity - currentQty;

    if (diff === 0) {
      return { message: 'Stock already matches physical count. No adjustment required.', diff: 0 };
    }

    // Find or create Virtual Inventory Loss location
    let lossLoc = await Location.findOne({ type: 'inventory_loss' });
    if (!lossLoc) {
      lossLoc = await Location.create({
        name: 'Inventory Adjustment Loss/Gain',
        completeName: 'Virtual Locations/Inventory Adjustment',
        type: 'inventory_loss',
        isVirtual: true,
      });
    }

    const ref = `ADJ/${Date.now().toString().slice(-6)}`;

    if (diff > 0) {
      // Physical count is higher -> Stock Gain (Virtual Loss/Gain -> Internal Location)
      await this.executeMove({
        reference: ref,
        operationType: 'adjustment',
        productId: product._id,
        srcLocationId: lossLoc._id,
        destLocationId: location._id,
        quantity: diff,
        uom: product.uom,
        userId,
        notes: reason || `Inventory Count Reconciliation (+${diff})`,
      });
    } else {
      // Physical count is lower -> Stock Loss / Damage (Internal Location -> Virtual Loss)
      const absDiff = Math.abs(diff);
      await this.executeMove({
        reference: ref,
        operationType: 'adjustment',
        productId: product._id,
        srcLocationId: location._id,
        destLocationId: lossLoc._id,
        quantity: absDiff,
        uom: product.uom,
        userId,
        notes: reason || `Inventory Shrinkage / Damage Reconciliation (-${absDiff})`,
      });
    }

    return {
      message: 'Stock adjustment applied and ledger updated successfully',
      previousQty: currentQty,
      countedQty: countedQuantity,
      difference: diff,
    };
  }
}

module.exports = StockEngineService;
