const { z } = require('zod');

const warehouseSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Warehouse name must be at least 2 characters'),
    code: z.string().min(2, 'Warehouse code must be at least 2 characters').max(6),
    address: z.string().optional(),
  }),
});

const locationSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Location name must be at least 2 characters'),
    type: z.enum(['supplier', 'customer', 'internal', 'inventory_loss', 'view']),
    warehouseId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid warehouse ID').optional().nullable(),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent location ID').optional().nullable(),
  }),
});

module.exports = {
  warehouseSchema,
  locationSchema,
};
