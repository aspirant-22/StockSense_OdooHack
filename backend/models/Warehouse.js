const mongoose = require('mongoose');

const WarehouseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide warehouse name'],
      trim: true,
      unique: true,
    },
    code: {
      type: String,
      required: [true, 'Please provide warehouse short code (e.g. WH1)'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    address: {
      type: String,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Warehouse', WarehouseSchema);
