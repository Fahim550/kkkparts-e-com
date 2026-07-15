import { z } from "zod";

export const WarehouseSchema = z.object({
  code: z.string().min(1, "Warehouse code is required"),
  name: z.string().min(1, "Warehouse name is required"),
  is_active: z.boolean().default(true),
  address: z.string().optional().nullable(),
});

export const WarehouseZoneSchema = z.object({
  warehouse_id: z.string().uuid("Invalid warehouse ID"),
  code: z.string().min(1, "Zone code is required"),
  name: z.string().min(1, "Zone name is required"),
});

export const WarehouseBinSchema = z.object({
  zone_id: z.string().uuid("Invalid zone ID"),
  code: z.string().min(1, "Bin code is required"),
  name: z.string().min(1, "Bin name is required"),
  barcode: z.string().optional().nullable(),
});

export const StockTransferSchema = z
  .object({
    from_warehouse_id: z.string().uuid("Source warehouse ID is required"),
    to_warehouse_id: z.string().uuid("Destination warehouse ID is required"),
    from_bin_id: z.string().uuid().optional(),
    to_bin_id: z.string().uuid().optional(),
    variation_id: z.string().uuid("Product variation ID is required"),
    quantity: z.number().positive("Quantity must be greater than zero"),
    reference_type: z.string().min(1, "Reference type is required"),
    reference_id: z.string().min(1, "Reference ID is required"),
    batch_number: z.string().optional(),
  })
  .refine(
    (data) => {
      if (
        data.from_warehouse_id === data.to_warehouse_id &&
        data.from_bin_id === data.to_bin_id
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Source and destination cannot be the same.",
      path: ["to_warehouse_id"],
    },
  );
