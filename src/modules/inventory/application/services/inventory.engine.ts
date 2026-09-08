import { v4 as uuidv4 } from "uuid";
import { StockRepository } from "../../../warehouse/infrastructure/repositories/stock.repository";
import { StockMovementPayload } from "../../domain/types";
import { FifoEngine } from "./fifo.engine";

export class InventoryEngine {
  /**
   * The strict, single entry point for ANY stock mutation.
   * Modifies stock_ledgers, fifo_ledgers, and rolls up into stock_balances.
   */
  static async processMovement(payload: StockMovementPayload): Promise<number> {
    if (payload.quantity === 0) return 0;

    // 1. Validate Current Stock (if outbound)
    const isOutbound = payload.quantity < 0;
    const absQuantity = Math.abs(payload.quantity);

    const currentBalance = await StockRepository.getBalance(
      payload.warehouse_id,
      payload.variation_id,
      payload.bin_id || null,
      null,
    );

    // Allow negative stock for sales, POS, or when explicitly enabled
    const allowNegative =
      payload.allow_negative ??
      (payload.reference_type === "sales_order" ||
        payload.reference_type === "pos_receipt");

    if (isOutbound && !allowNegative) {
      if (!currentBalance || currentBalance.quantity < absQuantity) {
        throw new Error(
          `Insufficient stock in warehouse for variation ${payload.variation_id}.`,
        );
      }
    }

    // 2. Log Movement to Ledger
    await StockRepository.insertLedger({
      warehouse_id: payload.warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.bin_id || null,
      batch_number: null,
      uom_id: payload.uom_id,
      quantity: payload.quantity,
      reference_type: payload.reference_type,
      reference_id: payload.reference_id,
      transaction_date: new Date().toISOString(),
    });

    // 3. Update Aggregate Balance
    const newQty = currentBalance
      ? currentBalance.quantity + payload.quantity
      : payload.quantity;
    await StockRepository.upsertBalance({
      warehouse_id: payload.warehouse_id,
      variation_id: payload.variation_id,
      bin_id: payload.bin_id || null,
      batch_number: null,
      quantity: newQty,
    });

    // 4. Handle FIFO / Cost Engine
    let movementCost = 0;
    if (isOutbound) {
      // Consume cost layer
      movementCost = await FifoEngine.consumeCostLayer({
        variation_id: payload.variation_id,
        warehouse_id: payload.warehouse_id,
        quantity: absQuantity,
        reference_type: payload.reference_type,
        reference_id: payload.reference_id,
      });
    } else {
      // Add cost layer (needs unit_cost)
      if (payload.unit_cost === undefined || payload.unit_cost === null) {
        throw new Error(
          "Unit cost is required for inbound stock movements (to build FIFO layers).",
        );
      }
      await FifoEngine.addCostLayer({
        variation_id: payload.variation_id,
        warehouse_id: payload.warehouse_id,
        quantity: payload.quantity,
        unit_cost: payload.unit_cost,
        reference_type: payload.reference_type,
        reference_id: payload.reference_id,
      });
      movementCost = payload.quantity * payload.unit_cost;
    }

    return movementCost;
  }

  // --- Specialized Workflow Wrappers ---

  static async adjustStock(data: {
    variation_id: string;
    warehouse_id: string;
    quantity: number; // positive or negative
    unit_cost?: number; // req if positive
    uom_id: string;
    reason: string;
  }): Promise<void> {
    const refId = uuidv4(); // Generate a unique ID for the adjustment document

    await this.processMovement({
      variation_id: data.variation_id,
      warehouse_id: data.warehouse_id,
      uom_id: data.uom_id,
      quantity: data.quantity,
      reference_type: "INVENTORY_ADJUSTMENT",
      reference_id: refId,
      unit_cost: data.quantity > 0 ? data.unit_cost : undefined, // only needed if inbound
    });

    // We could theoretically store the 'reason' somewhere if we had an adjustments table,
    // but without one, the reference_type serves as the indicator.
  }

  static async writeOffDamage(data: {
    variation_id: string;
    warehouse_id: string;
    quantity: number; // Should be passed as positive absolute value
    uom_id: string;
    reason: string;
  }): Promise<void> {
    if (data.quantity <= 0)
      throw new Error("Damage write-off quantity must be > 0");
    const refId = uuidv4(); // Generate a unique ID

    // Deduct stock
    await this.processMovement({
      variation_id: data.variation_id,
      warehouse_id: data.warehouse_id,
      uom_id: data.uom_id,
      quantity: -data.quantity,
      reference_type: "DAMAGE_WRITE_OFF",
      reference_id: refId,
    });
  }
}
