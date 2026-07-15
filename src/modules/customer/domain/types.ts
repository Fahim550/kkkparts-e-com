import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type Customer = PublicSchema["customers"]["Row"] & {
  chart_of_accounts?: any;
};

export type CreateCustomerDTO = Omit<PublicSchema["customers"]["Insert"], "id" | "created_at" | "updated_at">;
export type UpdateCustomerDTO = Partial<CreateCustomerDTO>;

export type CustomerHistoryItem = {
  id: string;
  type: "Sales Order" | "Sales Invoice";
  reference_number: string;
  date: string;
  status: string;
  amount: number;
};

export type CustomerDueStats = {
  total_due: number;
  total_invoiced: number;
  total_orders: number;
};
