import { supabase } from "@/integrations/supabase/client";
import { PurchaseInvoice, CreatePurchaseInvoiceDTO, CreatePurchaseInvoiceItemDTO } from "../../domain/types";

export class PurchaseInvoiceRepository {
  static async getAll(): Promise<PurchaseInvoice[]> {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select(`
        *,
        suppliers(id, name),
        purchase_receipts(id, receipt_number)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as any;
  }

  static async create(invoice: CreatePurchaseInvoiceDTO, items: CreatePurchaseInvoiceItemDTO[]): Promise<PurchaseInvoice> {
    const { data: createdInvoice, error: invoiceError } = await supabase
      .from("purchase_invoices")
      .insert(invoice)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const itemsToInsert = items.map(item => ({
      ...item,
      purchase_invoice_id: createdInvoice.id
    }));

    const { error: itemsError } = await supabase
      .from("purchase_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase.from("purchase_invoices").delete().eq("id", createdInvoice.id);
      throw itemsError;
    }

    return createdInvoice as any;
  }
}
