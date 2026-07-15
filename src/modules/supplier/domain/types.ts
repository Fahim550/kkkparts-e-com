import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type Supplier = PublicSchema["suppliers"]["Row"];
export type CreateSupplierDTO = Omit<Supplier, "id" | "created_at" | "updated_at">;
export type UpdateSupplierDTO = Partial<CreateSupplierDTO> & { id: string };

// We also need chart of accounts type for the dropdown
export type ChartOfAccount = PublicSchema["chart_of_accounts"]["Row"];
