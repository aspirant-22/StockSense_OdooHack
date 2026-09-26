const mongoose = require('mongoose');

const StockMoveSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      index: true,
    },
    operationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'StockOperation',
      default: null,
      index: true,
    },
    operationType: {
      type: String,
      enum: ['receipt', 'delivery', 'internal', 'adjustment'],
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productSku: {
      type: String,
      required: true,
    },
    srcLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    srcLocationName: {
      type: String,
      required: true,
    },
    destLocationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: true,
    },
    destLocationName: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [0.0001, 'Quantity must be greater than zero'],
    },
    uom: {
      type: String,
      default: 'Units',
    },
    status: {
      type: String,
      enum: ['draft', 'waiting', 'ready', 'done', 'canceled'],
      default: 'draft',
      index: true,
    },
    dateDone: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMove', StockMoveSchema);
