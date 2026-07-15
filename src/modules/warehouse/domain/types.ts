import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

// Base Entities
export type Warehouse = PublicSchema["warehouses"]["Row"];
export type WarehouseZone = PublicSchema["warehouse_zones"]["Row"];
export type WarehouseBin = PublicSchema["warehouse_bins"]["Row"];
export type StockBalance = PublicSchema["stock_balances"]["Row"];
export type StockLedger = PublicSchema["stock_ledgers"]["Row"];

// Extended Entities
export type WarehouseZoneWithBins = WarehouseZone & {
  bins: WarehouseBin[];
};

export type WarehouseWithZones = Warehouse & {
  zones: WarehouseZoneWithBins[];
};

// DTOs for Create/Update
export type CreateWarehouseDTO = Omit<
  Warehouse,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWarehouseDTO = Partial<CreateWarehouseDTO> & { id: string };

export type CreateWarehouseZoneDTO = Omit<
  WarehouseZone,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWarehouseZoneDTO = Partial<CreateWarehouseZoneDTO> & {
  id: string;
};

export type CreateWarehouseBinDTO = Omit<
  WarehouseBin,
  "id" | "created_at" | "updated_at"
>;
export type UpdateWarehouseBinDTO = Partial<CreateWarehouseBinDTO> & {
  id: string;
};

// DTOs for Stock operations
export type StockTransferDTO = {
  from_warehouse_id: string;
  to_warehouse_id: string;
  from_bin_id?: string;
  to_bin_id?: string;
  variation_id: string;
  quantity: number;
  reference_type: string;
  reference_id: string;
  batch_number?: string;
};
