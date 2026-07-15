import { supabase } from "@/integrations/supabase/client";
import { StockLedger, FifoLedger } from "../../domain/types";

export class InventoryRepository {
  static async getStockLedgers(): Promise<StockLedger[]> {
    const { data, error } = await supabase
      .from("stock_ledgers")
      .select(`
        *,
        product_variations(id, sku, products(name)),
        warehouses(id, name),
        units_of_measure(id, abbreviation)
      `)
      .order("transaction_date", { ascending: false });

    if (error) throw error;
    return data as any;
  }

  static async getFifoCostLayers(): Promise<FifoLedger[]> {
    const { data, error } = await supabase
      .from("fifo_ledgers")
      .select(`
        *,
        product_variations(id, sku, products(name)),
        warehouses(id, name)
      `)
      .gt("quantity_remaining", 0)
      .order("transaction_date", { ascending: true }); // Oldest first (FIFO)

    if (error) throw error;
    return data as any;
  }
}
