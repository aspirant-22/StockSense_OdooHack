const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const { warehouseSchema, locationSchema } = require('../validators/warehouse.schema');
const {
  getWarehouses,
  createWarehouse,
  getLocations,
  createLocation,
} = require('../controllers/warehouse.controller');

router.use(protect);

router.route('/').get(getWarehouses).post(validate(warehouseSchema), createWarehouse);
router.route('/locations').get(getLocations).post(validate(locationSchema), createLocation);

module.exports = router;
