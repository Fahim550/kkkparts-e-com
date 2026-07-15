import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type PosRegister = PublicSchema["pos_registers"]["Row"];
export type PosShift = PublicSchema["pos_shifts"]["Row"];
export type PosReceipt = PublicSchema["pos_receipts"]["Row"];
export type PosReceiptItem = PublicSchema["pos_receipt_items"]["Row"];
export type PosPayment = PublicSchema["pos_payments"]["Row"];

export type CartItem = {
  variation_id: string;
  sku: string;
  name: string;
  uom_id: string;
  uom_abbreviation: string;
  quantity: number;
  unit_price: number;
  discount_amount: number;
  total_price: number;
  applied_rules?: string[];
};

export type CheckoutPayload = {
  shift_id: string;
  customer_id?: string | null;
  items: CartItem[];
  payments: {
    method: "Cash" | "Card" | "Bank Transfer";
    amount: number;
    reference_code?: string;
  }[];
  total_amount: number;
  tax_amount: number;
  discount_amount: number;
  warehouse_id: string;
};
