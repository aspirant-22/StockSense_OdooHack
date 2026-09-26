const mongoose = require('mongoose');

const StockOperationSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['receipt', 'delivery', 'internal', 'adjustment'],
      required: true,
      index: true,
    },
    partner: {
      type: String, // Supplier name for receipts, Customer name for deliveries
      default: '',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      required: true,
      index: true,
    },
    srcLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    destLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    scheduledDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
      default: 'draft',
      index: true,
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: {
          type: String,
          required: true,
        },
        sku: {
          type: String,
          required: true,
        },
        demandQty: {
          type: Number,
          required: true,
          min: [0.0001, 'Quantity must be positive'],
        },
        doneQty: {
          type: Number,
          default: 0,
        },
        uom: {
          type: String,
          default: 'Units',
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockOperation', StockOperationSchema);
