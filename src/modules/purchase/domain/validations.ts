import { z } from "zod";

export const PurchaseOrderItemSchema = z.object({
  variation_id: z.string().uuid("Product variation is required"),
  uom_id: z.string().uuid("UOM is required"),
  quantity_ordered: z.number().min(0.01, "Quantity must be greater than 0"),
  unit_price: z.number().min(0, "Price cannot be negative"),
});

export const PurchaseOrderSchema = z.object({
  supplier_id: z.string().uuid("Supplier is required"),
  po_number: z.string().min(1, "PO Number is required"),
  order_date: z.string().min(1, "Order date is required"),
  expected_delivery_date: z.string().optional().nullable(),
  items: z.array(PurchaseOrderItemSchema).min(1, "At least one item is required"),
});

export const GoodsReceiveItemSchema = z.object({
  po_item_id: z.string().uuid().optional().nullable(),
  variation_id: z.string().uuid("Variation is required"),
  uom_id: z.string().uuid("UOM is required"),
  bin_id: z.string().uuid().optional().nullable(),
  quantity_received: z.number().min(0.01, "Quantity must be > 0"),
  unit_cost: z.number().min(0, "Cost must be >= 0"), // Not in schema directly on receipt item, but needed for FIFO/Stock
});

export const GoodsReceiveSchema = z.object({
  supplier_id: z.string().uuid("Supplier is required"),
  purchase_order_id: z.string().uuid().optional().nullable(),
  warehouse_id: z.string().uuid("Warehouse is required"),
  receipt_number: z.string().min(1, "Receipt number is required"),
  receipt_date: z.string().min(1, "Receipt date is required"),
  items: z.array(GoodsReceiveItemSchema).min(1, "At least one item is required"),
});

export const PurchaseInvoiceSchema = z.object({
  supplier_id: z.string().uuid("Supplier is required"),
  purchase_receipt_id: z.string().uuid().optional().nullable(),
  invoice_number: z.string().min(1, "Internal invoice number is required"),
  supplier_invoice_number: z.string().min(1, "Supplier invoice number is required"),
  invoice_date: z.string().min(1, "Invoice date is required"),
  due_date: z.string().min(1, "Due date is required"),
  total_amount: z.number().min(0),
});
