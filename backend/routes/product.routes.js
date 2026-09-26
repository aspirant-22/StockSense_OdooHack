const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate.middleware');
const { protect } = require('../middleware/auth.middleware');
const {
  categorySchema,
  productSchema,
  updateProductSchema,
} = require('../validators/product.schema');
const {
  getCategories,
  createCategory,
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
} = require('../controllers/product.controller');

router.use(protect);

router.route('/categories').get(getCategories).post(validate(categorySchema), createCategory);
router.route('/').get(getProducts).post(validate(productSchema), createProduct);
router.route('/:id').get(getProductById).put(validate(updateProductSchema), updateProduct);

module.exports = router;
