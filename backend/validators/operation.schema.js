const { z } = require('zod');

const operationItemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  demandQty: z.number().positive('Quantity must be greater than 0'),
  doneQty: z.number().min(0).optional(),
});

const createOperationSchema = z.object({
  body: z.object({
    type: z.enum(['receipt', 'delivery', 'internal', 'adjustment']),
    warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    partner: z.string().optional(),
    srcLocationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid source location ID'),
    destLocationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid destination location ID'),
    scheduledDate: z.string().optional(),
    items: z.array(operationItemSchema).min(1, 'At least 1 product item is required'),
    notes: z.string().optional(),
  }),
});

const stockAdjustmentSchema = z.object({
  body: z.object({
    productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
    warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID'),
    locationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid location ID'),
    countedQuantity: z.number().min(0, 'Counted quantity must be >= 0'),
    reason: z.string().optional(),
  }),
});

module.exports = {
  createOperationSchema,
  stockAdjustmentSchema,
};
