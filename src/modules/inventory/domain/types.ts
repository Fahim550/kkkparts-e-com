import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type StockLedger = PublicSchema["stock_ledgers"]["Row"] & {
  product_variations?: any;
  warehouses?: any;
  units_of_measure?: any;
};

export type FifoLedger = PublicSchema["fifo_ledgers"]["Row"] & {
  product_variations?: any;
  warehouses?: any;
};

export type StockMovementPayload = {
  variation_id: string;
  warehouse_id: string;
  bin_id?: string | null;
  uom_id: string;
  quantity: number; // positive for inbound, negative for outbound
  reference_type: string; // e.g. 'INVENTORY_ADJUSTMENT', 'DAMAGE_WRITE_OFF', 'PURCHASE_RECEIPT'
  reference_id: string;
  unit_cost?: number; // Needed for positive adjustments / inbound
};
