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

    const { supabase } = await import("@/integrations/supabase/client");

    // 1. If linked to a purchase order, validate remaining quantities, assign po_item_id, and update purchase_order_items
    if (receipt.purchase_order_id) {
      const { data: poItems, error: poItemsError } = await supabase
        .from("purchase_order_items")
        .select("*")
        .eq("purchase_order_id", receipt.purchase_order_id);

      if (poItemsError) throw poItemsError;

      for (const item of items) {
        const poItem = poItems?.find(
          (p) => (item.po_item_id && p.id === item.po_item_id) || p.variation_id === item.variation_id
        );

        if (poItem) {
          item.po_item_id = poItem.id;
          const currentReceived = Number(poItem.quantity_received || 0);
          const ordered = Number(poItem.quantity_ordered || 0);
          const remaining = Math.max(0, ordered - currentReceived);

          if (receipt.status !== "Return" && item.quantity_received > remaining) {
            throw new Error(
              `Cannot receive ${item.quantity_received} units. Only ${remaining} units remaining to be received on this purchase order.`
            );
          }

          const newReceived = receipt.status === "Return"
            ? Math.max(0, currentReceived - Number(item.quantity_received))
            : currentReceived + Number(item.quantity_received);

          const { error: updatePoiError } = await supabase
            .from("purchase_order_items")
            .update({ quantity_received: newReceived })
            .eq("id", poItem.id);

          if (updatePoiError) throw updatePoiError;

          // Update in-memory reference for order status determination
          poItem.quantity_received = newReceived;
        }
      }

      // Check if all items in this PO are fully received
      if (poItems && poItems.length > 0) {
        const allFullyReceived = poItems.every(
          (p) => Number(p.quantity_received || 0) >= Number(p.quantity_ordered || 0)
        );
        const anyReceived = poItems.some(
          (p) => Number(p.quantity_received || 0) > 0
        );

        const newOrderStatus = allFullyReceived
          ? "Received"
          : anyReceived
          ? "Partially Received"
          : "Confirmed";

        const { PurchaseOrderService } = await import("./purchase-order.service");
        await PurchaseOrderService.updateOrderStatus(receipt.purchase_order_id, newOrderStatus);
      }
    }

    // 2. Create Receipt and Receipt Items
    const createdReceipt = await PurchaseReceiptRepository.create(receipt, items);

    // 3. Process Outbound/Inbound Inventory via InventoryEngine
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

    // 4. Accounting Integration
    if (createdReceipt.status === 'Completed' || createdReceipt.status === 'Received') {
      const { AccountingEngine } = await import("../../../accounting/application/services/accounting.engine");
      const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity_received) * Number(item.unit_cost || 0)), 0);
      await AccountingEngine.postPurchaseReceipt(createdReceipt.id, totalAmount, createdReceipt.receipt_number);
    }

    return createdReceipt;
  }
}
