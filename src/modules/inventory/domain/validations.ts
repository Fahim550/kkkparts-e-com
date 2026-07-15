import { z } from "zod";

export const InventoryAdjustmentSchema = z.object({
  variation_id: z.string().uuid("Variation is required"),
  warehouse_id: z.string().uuid("Warehouse is required"),
  quantity: z.number().refine(val => val !== 0, "Quantity cannot be zero"),
  unit_cost: z.number().min(0, "Cost cannot be negative").optional(),
  reason: z.string().min(1, "Reason is required"),
});

export const DamagedStockSchema = z.object({
  variation_id: z.string().uuid("Variation is required"),
  warehouse_id: z.string().uuid("Warehouse is required"),
  quantity: z.number().min(0.01, "Quantity must be greater than zero"), // We will invert this to negative in the engine
  reason: z.string().min(1, "Reason is required"),
});
