import { PurchaseReceiptRepository, PurchaseReceiptFilters } from "../../infrastructure/repositories/purchase-receipt.repository";
import { InventoryEngine } from "../../../inventory/application/services/inventory.engine";
import { PurchaseReceipt, CreatePurchaseReceiptDTO, CreatePurchaseReceiptItemDTO } from "../../domain/types";

// Extended DTO to include unit_cost for FIFO and stock valuation
export type ReceiptItemPayload = CreatePurchaseReceiptItemDTO & { unit_cost: number };

export class PurchaseReceiptService {
  static async getAllReceipts(filters?: PurchaseReceiptFilters): Promise<PurchaseReceipt[]> {
    return PurchaseReceiptRepository.getAll(filters);
  }

  static async getReceiptById(id: string): Promise<PurchaseReceipt | null> {
    return PurchaseReceiptRepository.getById(id);
  }

  static async receiveGoods(receipt: CreatePurchaseReceiptDTO, items: ReceiptItemPayload[]): Promise<PurchaseReceipt> {
    if (!items || items.length === 0) {
      throw new Error("Receipt must have at least one item.");
    }

    const createdReceipt = await PurchaseReceiptRepository.create(receipt, items);

    for (const item of items) {
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

    if (createdReceipt.purchase_order_id) {
      const { PurchaseOrderService } = await import("./purchase-order.service");
      await PurchaseOrderService.updateOrderStatus(createdReceipt.purchase_order_id, "Received");
    }

    if (createdReceipt.status === 'Completed' || createdReceipt.status === 'Received') {
      const { AccountingEngine } = await import("../../../accounting/application/services/accounting.engine");
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity_received) * Number(item.unit_cost || 0)), 0);
      await AccountingEngine.postPurchaseReceipt(createdReceipt.id, totalAmount, createdReceipt.receipt_number);
    }

    return createdReceipt;
  }
}
