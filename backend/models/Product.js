const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide product name'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Please provide product SKU / Code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProductCategory',
      required: [true, 'Please assign a category'],
    },
    uom: {
      type: String,
      required: [true, 'Please provide Unit of Measure (UOM)'],
      default: 'Units',
      trim: true,
    },
    minStockAlert: {
      type: Number,
      default: 10,
      min: [0, 'Min stock threshold cannot be negative'],
    },
    maxStockRule: {
      type: Number,
      default: 100,
    },
    costPrice: {
      type: Number,
      default: 0,
    },
    salesPrice: {
      type: Number,
      default: 0,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', ProductSchema);
