import {
  CreatePurchaseOrderDTO,
  CreatePurchaseOrderItemDTO,
  PurchaseOrder,
} from "../../domain/types";
import {
  PurchaseOrderFilters,
  PurchaseOrderRepository,
} from "../../infrastructure/repositories/purchase-order.repository";

export class PurchaseOrderService {
  static async getAllOrders(
    filters?: PurchaseOrderFilters,
  ): Promise<PurchaseOrder[]> {
    return PurchaseOrderRepository.getAll(filters);
  }

  static async getOrderById(id: string): Promise<PurchaseOrder | null> {
    return PurchaseOrderRepository.getById(id);
  }

  static async createOrder(
    po: CreatePurchaseOrderDTO,
    items: CreatePurchaseOrderItemDTO[],
  ): Promise<PurchaseOrder> {
    if (!items || items.length === 0) {
      throw new Error("Purchase order must have at least one item.");
    }
    const totalAmount = items.reduce(
      (sum, item) => sum + item.quantity_ordered * item.unit_price,
      0,
    );
    const poPayload = { ...po, total_amount: totalAmount };
    const itemsPayload = items.map((item) => ({
      ...item,
      total_price: item.quantity_ordered * item.unit_price,
    }));
    return PurchaseOrderRepository.create(poPayload, itemsPayload);
  }

  static async updateOrderStatus(id: string, status: string): Promise<void> {
    return PurchaseOrderRepository.updateStatus(id, status);
  }

  static async deleteOrder(orderId: string, orderType?: string): Promise<void> {
    const { supabase } = await import("@/integrations/supabase/client");

    // 1. If any purchase receipts exist against this PO, reverse their stock and cleanup
    const { data: receipts } = await supabase
      .from("purchase_receipts")
      .select("id, warehouse_id, purchase_receipt_items(*)")
      .eq("purchase_order_id", orderId);

    if (receipts && receipts.length > 0) {
      const { StockRepository } = await import("@/modules/warehouse/infrastructure/repositories/stock.repository");
      for (const rec of receipts) {
        if (rec.purchase_receipt_items && rec.purchase_receipt_items.length > 0) {
          for (const item of rec.purchase_receipt_items) {
            const currentBal = await StockRepository.getBalance(
              rec.warehouse_id,
              item.variation_id,
              item.bin_id || null,
              null
            );
            const newQty = Math.max(0, (currentBal ? currentBal.quantity : 0) - Number(item.quantity_received || 0));
            await StockRepository.upsertBalance({
              warehouse_id: rec.warehouse_id,
              variation_id: item.variation_id,
              bin_id: item.bin_id || null,
              batch_number: null,
              quantity: newQty,
            });
          }
        }

        // Delete FIFO layers created by this receipt
        await supabase
          .from("fifo_ledgers")
          .delete()
          .eq("inbound_reference_type", "PURCHASE_RECEIPT")
          .eq("inbound_reference_id", rec.id);

        // Delete stock ledgers
        await supabase
          .from("stock_ledgers")
          .delete()
          .eq("reference_type", "PURCHASE_RECEIPT")
          .eq("reference_id", rec.id);

        // Delete journal entries for this receipt if any
        const { data: recJes } = await supabase
          .from("journal_entries")
          .select("id")
          .eq("reference_id", rec.id);
        if (recJes && recJes.length > 0) {
          for (const rj of recJes) {
            await supabase.from("journal_entry_lines").delete().eq("journal_entry_id", rj.id);
            await supabase.from("journal_entries").delete().eq("id", rj.id);
          }
        }

        // Delete receipt items and receipt
        await supabase.from("purchase_receipt_items").delete().eq("purchase_receipt_id", rec.id);
        await supabase.from("purchase_receipts").delete().eq("id", rec.id);
      }
    }

    // 2. Reverse accounting entries for this purchase order / invoice
    try {
      const { AccountingEngine } = await import("@/modules/accounting/application/services/accounting.engine");
      await AccountingEngine.reversePurchaseOrder(orderId);
    } catch (accError) {
      console.warn("Accounting reversal notice:", accError);
    }

    // 3. Delete items and the purchase record
    if (orderType === "Purchase Invoice") {
      await supabase.from("purchase_invoice_items").delete().eq("invoice_id", orderId);
      const { error: invError } = await supabase.from("purchase_invoices").delete().eq("id", orderId);
      if (invError) throw invError;
    } else {
      await supabase.from("purchase_order_items").delete().eq("purchase_order_id", orderId);
      const { error: poError } = await supabase.from("purchase_orders").delete().eq("id", orderId);
      if (poError) throw poError;
    }
  }
}
