import { PurchaseReceiptRepository } from "../../infrastructure/repositories/purchase-receipt.repository";
import { FifoRepository } from "../../infrastructure/repositories/fifo.repository";
import { StockRepository } from "../../../warehouse/infrastructure/repositories/stock.repository";
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

    // 2. For each item, update stock and create FIFO lot
    for (const item of items) {
      // 2a. Update Stock Balances
      const currentBalance = await StockRepository.getBalance(
        receipt.warehouse_id,
        item.variation_id,
        item.bin_id || null,
        null // No batch number for basic receive unless added to schema
      );

      const newQty = currentBalance ? currentBalance.quantity + item.quantity_received : item.quantity_received;

      await StockRepository.upsertBalance({
        warehouse_id: receipt.warehouse_id,
        variation_id: item.variation_id,
        bin_id: item.bin_id || null,
        batch_number: null,
        quantity: newQty,
      });

      // 2b. Insert Stock Ledger
      await StockRepository.insertLedger({
        warehouse_id: receipt.warehouse_id,
        variation_id: item.variation_id,
        bin_id: item.bin_id || null,
        batch_number: null,
        uom_id: item.uom_id,
        quantity: item.quantity_received,
        reference_type: "PURCHASE_RECEIPT",
        reference_id: createdReceipt.id,
        transaction_date: receipt.receipt_date, // Or new Date().toISOString()
      });

      // 2c. Create FIFO Ledger Lot
      await FifoRepository.createLedger({
        variation_id: item.variation_id,
        warehouse_id: receipt.warehouse_id,
        inbound_reference_type: "PURCHASE_RECEIPT",
        inbound_reference_id: createdReceipt.id,
        transaction_date: receipt.receipt_date,
        original_quantity: item.quantity_received,
        quantity_remaining: item.quantity_received,
        unit_cost: item.unit_cost,
      });
    }

    // If linked to a PO, we might want to update PO status to 'Received' or 'Partially Received'
    // This is optional but good practice. For now, we rely on the PO service if needed.

    return createdReceipt;
  }
}
