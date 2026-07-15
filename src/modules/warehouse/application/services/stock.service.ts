import { supabase } from "@/integrations/supabase/client";
import { StockBalance, StockTransferDTO } from "../../domain/types";
import { StockRepository } from "../../infrastructure/repositories/stock.repository";

export class StockService {
  static async getBalancesByWarehouse(
    warehouseId: string,
  ): Promise<StockBalance[]> {
    return StockRepository.getBalancesByWarehouse(warehouseId);
  }

  static async transferStock(payload: StockTransferDTO): Promise<void> {
    if (payload.quantity <= 0) {
      throw new Error("Transfer quantity must be greater than zero.");
    }

    // 1. Get current stock at source
    const sourceBalance = await StockRepository.getBalance(
      payload.from_warehouse_id,
      payload.variation_id,
      payload.from_bin_id,
      payload.batch_number,
    );

    if (!sourceBalance || sourceBalance.quantity < payload.quantity) {
      throw new Error("Insufficient stock for transfer.");
    }

    // 2. Get product variation to know its uom_id (assuming base uom for now, ideally fetched from variation)
    const { data: variation } = await supabase
      .from("product_variations")
      .select("*, products(base_uom_id)")
      .eq("id", payload.variation_id)
      .single();

    if (!variation) throw new Error("Variation not found.");
    // @ts-ignore - nested select typings
    const uomId = variation.products?.base_uom_id;

    // We will perform updates sequentially here. In a real highly concurrent system,
    // this should be an RPC call to guarantee atomicity.

    // Deduct from source
    await StockRepository.upsertBalance({
      warehouse_id: payload.from_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.from_bin_id,
      batch_number: payload.batch_number,
      quantity: sourceBalance.quantity - payload.quantity,
    });

    // Log ledger for source (outbound)
    await StockRepository.insertLedger({
      warehouse_id: payload.from_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.from_bin_id,
      batch_number: payload.batch_number,
      uom_id: uomId,
      quantity: -payload.quantity,
      reference_type: payload.reference_type,
      reference_id: payload.reference_id,
      transaction_date: new Date().toISOString(),
    });

    // Add to destination
    const destBalance = await StockRepository.getBalance(
      payload.to_warehouse_id,
      payload.variation_id,
      payload.to_bin_id,
      payload.batch_number,
    );

    const newDestQty = destBalance
      ? destBalance.quantity + payload.quantity
      : payload.quantity;

    await StockRepository.upsertBalance({
      warehouse_id: payload.to_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.to_bin_id,
      batch_number: payload.batch_number,
      quantity: newDestQty,
    });

    // Log ledger for destination (inbound)
    await StockRepository.insertLedger({
      warehouse_id: payload.to_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.to_bin_id,
      batch_number: payload.batch_number,
      uom_id: uomId,
      quantity: payload.quantity,
      reference_type: payload.reference_type,
      reference_id: payload.reference_id,
      transaction_date: new Date().toISOString(),
    });
  }
}
