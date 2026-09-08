import { PosCheckoutRepository } from "../../infrastructure/repositories/pos-checkout.repository";
import { CheckoutPayload, PosReceipt } from "../../domain/types";
import { InventoryEngine } from "../../../inventory/application/services/inventory.engine";

export class PosEngine {
  /**
   * Processes a POS checkout:
   * 1. Creates the receipt and payment records.
   * 2. Consumes inventory using FIFO rules.
   */
  static async checkout(payload: CheckoutPayload): Promise<PosReceipt> {
    // 1. Create Receipt and Payments
    const receipt = await PosCheckoutRepository.createReceipt(payload);

    // 2. Consume Inventory
    // Note: The POS items are in base UOM or their respective UOMs. 
    // The Inventory Engine expects base UOM quantities. We assume cart items hold the correct quantity multiplier if needed,
    // or we pass it exactly as is if the cart handles base uom conversion.
    let totalCogs = 0;
    
    for (const item of payload.items) {
      const lineCogs = await InventoryEngine.processMovement({
        reference_type: "pos_receipt",
        reference_id: receipt.id,
        warehouse_id: payload.warehouse_id,
        variation_id: item.variation_id,
        uom_id: item.uom_id,
        quantity: -item.quantity, // Negative for outbound (supports negative stock)
        unit_cost: 0, // Outbound unit cost is determined by FIFO engine, pass 0
        allow_negative: true,
      });
      totalCogs += lineCogs;
    }

    // 3. Post Accounting Entries
    const dueAmount = payload.payments
      .filter(p => p.method === "Due")
      .reduce((sum, p) => sum + p.amount, 0);

    const { AccountingEngine } = await import("../../../accounting/application/services/accounting.engine");
    await AccountingEngine.postPosSale(receipt.id, payload.total_amount, totalCogs, receipt.receipt_number, dueAmount);

    return receipt;
  }
}
