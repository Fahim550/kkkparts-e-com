import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type Supplier = PublicSchema["suppliers"]["Row"];
export type CreateSupplierDTO = Omit<Supplier, "id" | "created_at" | "updated_at">;
export type UpdateSupplierDTO = Partial<CreateSupplierDTO> & { id: string };

// We also need chart of accounts type for the dropdown
export type ChartOfAccount = PublicSchema["chart_of_accounts"]["Row"];

export interface SupplierHistoryItem {
  id: string;
  type: "Purchase Order" | "Purchase Invoice";
  reference_number: string;
  date: string;
  status: string;
  amount: number;
  balance: number;
}
