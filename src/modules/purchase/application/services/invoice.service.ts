import { PurchaseInvoiceRepository } from "../../infrastructure/repositories/purchase-invoice.repository";
import { PurchaseInvoice, CreatePurchaseInvoiceDTO, CreatePurchaseInvoiceItemDTO } from "../../domain/types";

export class PurchaseInvoiceService {
  static async getAllInvoices(): Promise<PurchaseInvoice[]> {
    return PurchaseInvoiceRepository.getAll();
  }

  static async getInvoiceById(id: string): Promise<PurchaseInvoice | null> {
    return PurchaseInvoiceRepository.getById(id);
  }

  static async createInvoice(invoice: CreatePurchaseInvoiceDTO, items: CreatePurchaseInvoiceItemDTO[]): Promise<PurchaseInvoice> {
    if (!items || items.length === 0) {
      throw new Error("Invoice must have at least one item.");
    }
    
    // Calculate total amount
    const calculatedTotal = items.reduce((sum, item) => sum + item.amount, 0);
    const invoicePayload = { ...invoice, total_amount: calculatedTotal };

    return PurchaseInvoiceRepository.create(invoicePayload, items);
  }

  static async updateInvoiceStatus(id: string, status: "Unpaid" | "PartiallyPaid" | "Paid"): Promise<void> {
    return PurchaseInvoiceRepository.updateStatus(id, status);
  }
}
