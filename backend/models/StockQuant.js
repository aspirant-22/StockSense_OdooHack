const mongoose = require('mongoose');

const StockQuantSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    locationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
      index: true,
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null,
      index: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    reservedQuantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Compound index to guarantee 1 quant record per product per location
StockQuantSchema.index({ productId: 1, locationId: 1 }, { unique: true });

module.exports = mongoose.model('StockQuant', StockQuantSchema);
