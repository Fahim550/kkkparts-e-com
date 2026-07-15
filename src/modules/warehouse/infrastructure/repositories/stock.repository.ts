import { supabase } from "@/integrations/supabase/client";
import {
  StockBalance,
  StockLedger,
  StockLedgerInsert,
  StockBalanceInsert,
} from "../../domain/types";

export class StockRepository {
  static async getBalancesByWarehouse(
    warehouseId: string,
  ): Promise<StockBalance[]> {
    const { data, error } = await supabase
      .from("stock_balances")
      .select(
        `
        *,
        product_variations (*, products(*)),
        warehouse_bins (*)
      `,
      )
      .eq("warehouse_id", warehouseId);

    if (error) throw error;
    return data || [];
  }

  static async getBalance(
    warehouseId: string,
    variationId: string,
    binId?: string,
    batchNumber?: string,
  ): Promise<StockBalance | null> {
    let query = supabase
      .from("stock_balances")
      .select("*")
      .eq("warehouse_id", warehouseId)
      .eq("variation_id", variationId);

    if (binId) {
      query = query.eq("bin_id", binId);
    } else {
      query = query.is("bin_id", null);
    }

    if (batchNumber) {
      query = query.eq("batch_number", batchNumber);
    } else {
      query = query.is("batch_number", null);
    }

    const { data, error } = await query.maybeSingle();

    if (error) throw error;
    return data;
  }

  static async upsertBalance(
    payload: StockBalanceInsert,
  ): Promise<StockBalance> {
    // Determine the conflict target for upsert based on unique constraint
    // Ensure that unique constraints match the columns here if any.
    // In many designs, warehouse_id + variation_id + bin_id + batch_number is unique.

    // We can also fetch the existing balance and do an update, which is often safer without knowing precise unique constraints.
    const existing = await this.getBalance(
      payload.warehouse_id,
      payload.variation_id,
      payload.bin_id || undefined,
      payload.batch_number || undefined,
    );

    if (existing) {
      const { data, error } = await supabase
        .from("stock_balances")
        .update({
          quantity: payload.quantity,
          last_updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from("stock_balances")
        .insert({
          ...payload,
          last_updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  }

  static async insertLedger(payload: StockLedgerInsert): Promise<StockLedger> {
    const { data, error } = await supabase
      .from("stock_ledgers")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Uses a Supabase RPC or handles transaction logic in client
  // Since we can't do robust transactions in JS over REST, a stored procedure is ideal.
  // Assuming no RPC is provided yet, we'll expose a robust update in the Service layer using these methods.
}
