const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  createOperationSchema,
  stockAdjustmentSchema,
} = require('../validators/operation.schema');
const {
  getOperations,
  getOperationById,
  createOperation,
  markAsTodo,
  checkAvailability,
  forceDraft,
  validateOperation,
  cancelOperation,
  adjustStockCount,
  getStockLedger,
} = require('../controllers/operation.controller');

router.use(protect);

router.get('/ledger/moves', getStockLedger);
router.post('/adjust', validate(stockAdjustmentSchema), adjustStockCount);

router.route('/').get(getOperations).post(validate(createOperationSchema), createOperation);
router.route('/:id').get(getOperationById);
router.post('/:id/mark-todo', markAsTodo);
router.post('/:id/check-availability', checkAvailability);
router.post('/:id/force-draft', forceDraft);
router.post('/:id/validate', validateOperation);
router.post('/:id/cancel', cancelOperation);

module.exports = router;
