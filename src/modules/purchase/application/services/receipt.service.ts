import { PurchaseReceiptRepository } from "../../infrastructure/repositories/purchase-receipt.repository";
import { InventoryEngine } from "../../../inventory/application/services/inventory.engine";
import { PurchaseReceipt, CreatePurchaseReceiptDTO, CreatePurchaseReceiptItemDTO } from "../../domain/types";

// Extended DTO to include unit_cost for FIFO and stock valuation
export type ReceiptItemPayload = CreatePurchaseReceiptItemDTO & { unit_cost: number };

export class PurchaseReceiptService {
  static async getAllReceipts(): Promise<PurchaseReceipt[]> {
    return PurchaseReceiptRepository.getAll();
  }

  static async receiveGoods(receipt: CreatePurchaseReceiptDTO, items: ReceiptItemPayload[]): Promise<PurchaseReceipt> {
    if (!items || items.length === 0) {
      throw new Error("Receipt must have at least one item.");
    }

    // 1. Create the receipt and items in DB
    const createdReceipt = await PurchaseReceiptRepository.create(receipt, items);

    // 2. For each item, update stock and create FIFO lot via InventoryEngine
    for (const item of items) {
      // Determine if receipt is a return (negative quantity)
      // For basic goods receive, quantity is positive.
      const isReturn = receipt.status === 'Return';
      const qty = isReturn ? -item.quantity_received : item.quantity_received;

      await InventoryEngine.processMovement({
        variation_id: item.variation_id,
        warehouse_id: receipt.warehouse_id,
        bin_id: item.bin_id || null,
        uom_id: item.uom_id,
        quantity: qty,
        reference_type: "PURCHASE_RECEIPT",
        reference_id: createdReceipt.id,
        unit_cost: item.unit_cost,
      });
    }

    // If linked to a PO, we might want to update PO status to 'Received' or 'Partially Received'
    // This is optional but good practice. For now, we rely on the PO service if needed.

    return createdReceipt;
  }
}
