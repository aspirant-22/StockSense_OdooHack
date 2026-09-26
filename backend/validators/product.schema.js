const { z } = require('zod');

const categorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Category name must be at least 2 characters'),
    description: z.string().optional(),
  }),
});

const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name must be at least 2 characters'),
    sku: z.string().min(2, 'SKU must be at least 2 characters'),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    uom: z.string().default('Units'),
    minStockAlert: z.number().min(0, 'Min stock alert must be >= 0').default(10),
    maxStockRule: z.number().min(0, 'Max stock rule must be >= 0').optional(),
    costPrice: z.number().min(0).optional(),
    salesPrice: z.number().min(0).optional(),
    initialStock: z.number().min(0).optional(),
    initialWarehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    sku: z.string().min(2).optional(),
    categoryId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    uom: z.string().optional(),
    minStockAlert: z.number().min(0).optional(),
    maxStockRule: z.number().min(0).optional(),
    costPrice: z.number().min(0).optional(),
    salesPrice: z.number().min(0).optional(),
  }),
});

module.exports = {
  categorySchema,
  productSchema,
  updateProductSchema,
};
