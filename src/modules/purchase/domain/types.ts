import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

// Purchase Orders
export type PurchaseOrder = PublicSchema["purchase_orders"]["Row"] & {
  suppliers?: PublicSchema["suppliers"]["Row"];
  purchase_order_items?: PurchaseOrderItem[];
};
export type PurchaseOrderItem = PublicSchema["purchase_order_items"]["Row"] & {
  product_variations?: any; // Simplified for UI
  units_of_measure?: any;
};

export type CreatePurchaseOrderDTO = Omit<PublicSchema["purchase_orders"]["Insert"], "id" | "created_at" | "updated_at">;
export type CreatePurchaseOrderItemDTO = Omit<PublicSchema["purchase_order_items"]["Insert"], "id" | "created_at" | "updated_at" | "purchase_order_id">;

// Receipts (Goods Receive)
export type PurchaseReceipt = PublicSchema["purchase_receipts"]["Row"] & {
  suppliers?: PublicSchema["suppliers"]["Row"];
  warehouses?: PublicSchema["warehouses"]["Row"];
  purchase_orders?: PublicSchema["purchase_orders"]["Row"];
  purchase_receipt_items?: PurchaseReceiptItem[];
};
export type PurchaseReceiptItem = PublicSchema["purchase_receipt_items"]["Row"];

export type CreatePurchaseReceiptDTO = Omit<PublicSchema["purchase_receipts"]["Insert"], "id" | "created_at" | "updated_at">;
export type CreatePurchaseReceiptItemDTO = Omit<PublicSchema["purchase_receipt_items"]["Insert"], "id" | "created_at" | "updated_at" | "purchase_receipt_id">;

// Invoices (Supplier Due)
export type PurchaseInvoice = PublicSchema["purchase_invoices"]["Row"] & {
  suppliers?: PublicSchema["suppliers"]["Row"];
  purchase_receipts?: PublicSchema["purchase_receipts"]["Row"];
  purchase_invoice_items?: PurchaseInvoiceItem[];
};
export type PurchaseInvoiceItem = PublicSchema["purchase_invoice_items"]["Row"];

export type CreatePurchaseInvoiceDTO = Omit<PublicSchema["purchase_invoices"]["Insert"], "id" | "created_at" | "updated_at">;
export type CreatePurchaseInvoiceItemDTO = Omit<PublicSchema["purchase_invoice_items"]["Insert"], "id" | "created_at" | "updated_at" | "purchase_invoice_id">;

// FIFO Ledgers
export type FifoLedger = PublicSchema["fifo_ledgers"]["Row"];
export type CreateFifoLedgerDTO = Omit<PublicSchema["fifo_ledgers"]["Insert"], "id" | "created_at" | "updated_at">;
