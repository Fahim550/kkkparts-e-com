import { supabase } from "@/integrations/supabase/client";
import {
  CreatePurchaseInvoiceDTO,
  CreatePurchaseInvoiceItemDTO,
  PurchaseInvoice,
} from "../../domain/types";

export class PurchaseInvoiceRepository {
  static async getAll(): Promise<PurchaseInvoice[]> {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select(
        `
        *,
        suppliers(id, name),
        purchase_receipts(id, receipt_number),
        purchase_invoice_items(
          id,
          variation_id,
          quantity_billed,
          unit_price,
          amount,
          product_variations(id, sku, products(name))
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[PurchaseInvoiceRepository.getAll] error:", error);
      throw error;
    }
    return (data ?? []) as any;
  }

  static async getById(id: string): Promise<PurchaseInvoice | null> {
    const { data, error } = await supabase
      .from("purchase_invoices")
      .select(
        `
        *,
        suppliers(id, name),
        purchase_receipts(id, receipt_number),
        purchase_invoice_items(
          id,
          variation_id,
          quantity_billed,
          unit_price,
          amount,
          product_variations(id, sku, products(name))
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("[PurchaseInvoiceRepository.getById] error:", error);
      throw error;
    }
    return data as any;
  }

  static async create(
    invoice: CreatePurchaseInvoiceDTO,
    items: CreatePurchaseInvoiceItemDTO[],
  ): Promise<PurchaseInvoice> {
    const { data: createdInvoice, error: invoiceError } = await supabase
      .from("purchase_invoices")
      .insert(invoice)
      .select()
      .single();

    if (invoiceError) throw invoiceError;

    const itemsToInsert = items.map((item) => ({
      ...item,
      purchase_invoice_id: createdInvoice.id,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_invoice_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase
        .from("purchase_invoices")
        .delete()
        .eq("id", createdInvoice.id);
      throw itemsError;
    }

    return createdInvoice as any;
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("purchase_invoices")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
  }
}
