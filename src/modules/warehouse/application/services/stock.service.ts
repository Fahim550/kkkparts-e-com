import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";
import { InventoryEngine } from "../../../inventory/application/services/inventory.engine";
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
    const uomId = variation.products?.base_uom_id;

    // Generate a valid UUID for the database reference_id column
    const transferRefId = uuidv4();
    // Safely store the user's manual transfer number (e.g. TRF-004) inside reference_type
    const refType = `${payload.reference_type}: ${payload.reference_id}`;

    // We will perform updates via the InventoryEngine to ensure atomicity and correct ledgering

    // Deduct from source (Outbound)
    await InventoryEngine.processMovement({
      warehouse_id: payload.from_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.from_bin_id,
      uom_id: uomId,
      quantity: -payload.quantity,
      reference_type: refType,
      reference_id: transferRefId,
    });

    // We don't have the original cost of this specific stock easily without a more complex transfer logic,
    // but typically a warehouse transfer retains its FIFO layers or averages out.
    // For now, in this simplified FIFO, an internal transfer just deducts and adds,
    // which requires passing unit_cost to the destination.
    // Let's get a unit_cost from the oldest available FIFO layer for this transfer.
    const { data: layers } = await supabase
      .from("fifo_ledgers")
      .select("unit_cost")
      .eq("variation_id", payload.variation_id)
      .eq("warehouse_id", payload.from_warehouse_id)
      .gt("quantity_remaining", 0)
      .order("transaction_date", { ascending: true })
      .limit(1);

    const transferCost =
      layers && layers.length > 0 ? Number(layers[0].unit_cost) : 0;

    // Add to destination (Inbound)
    await InventoryEngine.processMovement({
      warehouse_id: payload.to_warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.to_bin_id,
      uom_id: uomId,
      quantity: payload.quantity,
      reference_type: refType,
      reference_id: transferRefId,
      unit_cost: transferCost,
    });
  }
}
