const mongoose = require('mongoose');

const LocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide location name'],
      trim: true,
    },
    completeName: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ['supplier', 'customer', 'internal', 'inventory_loss', 'view'],
      required: true,
      default: 'internal',
    },
    warehouseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Warehouse',
      default: null, // null for virtual locations like Vendor or Customer
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      default: null,
    },
    isVirtual: {
      type: Boolean,
      default: false,
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Compound index for uniqueness within warehouse
LocationSchema.index({ name: 1, warehouseId: 1 }, { unique: true });

module.exports = mongoose.model('Location', LocationSchema);
