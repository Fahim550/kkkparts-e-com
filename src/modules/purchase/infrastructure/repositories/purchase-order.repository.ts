import { supabase } from "@/integrations/supabase/client";
import {
  CreatePurchaseOrderDTO,
  CreatePurchaseOrderItemDTO,
  PurchaseOrder,
} from "../../domain/types";

export type PurchaseOrderFilters = {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // searches PO number
};

export class PurchaseOrderRepository {
  static async getAll(
    filters?: PurchaseOrderFilters,
  ): Promise<PurchaseOrder[]> {
    let query = supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers(id, name),
        purchase_order_items(
          *,
          product_variations(id, sku, products(name))
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.supplierId) {
      query = query.eq("supplier_id", filters.supplierId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("order_date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("order_date", filters.dateTo);
    }
    if (filters?.search) {
      query = query.ilike("po_number", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    const orders = (data || []) as any[];

    // Also fetch purchase_invoices so all purchases are tracked
    let invQuery = supabase
      .from("purchase_invoices")
      .select(
        `
        *,
        suppliers(id, name)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.supplierId) {
      invQuery = invQuery.eq("supplier_id", filters.supplierId);
    }
    if (filters?.status) {
      invQuery = invQuery.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      invQuery = invQuery.gte("invoice_date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      invQuery = invQuery.lte("invoice_date", filters.dateTo);
    }
    if (filters?.search) {
      invQuery = invQuery.or(
        `invoice_number.ilike.%${filters.search}%,supplier_invoice_number.ilike.%${filters.search}%`,
      );
    }

    const { data: invData } = await invQuery;
    const invoices = (invData || []).map((inv: any) => ({
      id: inv.id,
      po_number: inv.invoice_number || inv.supplier_invoice_number,
      supplier_id: inv.supplier_id,
      order_date: inv.invoice_date,
      expected_delivery_date: inv.due_date,
      status: inv.status,
      total_amount: Number(inv.total_amount || 0),
      created_at: inv.created_at,
      updated_at: inv.updated_at,
      suppliers: inv.suppliers,
      type: "Purchase Invoice",
    }));

    const allPurchases = [
      ...orders.map((o) => ({ ...o, type: "Purchase Order" })),
      ...invoices,
    ];

    if (allPurchases.length > 0) {
      const refIds = allPurchases.map((p) => p.id);
      const { data: jeData } = await supabase
        .from("journal_entries")
        .select(
          `
          reference_id,
          journal_entry_lines (
            debit_amount,
            credit_amount,
            narration
          )
        `,
        )
        .in("reference_id", refIds);

      allPurchases.forEach((p) => {
        let paid = 0;
        let paymentType = "Cash";
        if (jeData) {
          const entry = jeData.find((je: any) => je.reference_id === p.id);
          if (entry && entry.journal_entry_lines) {
            entry.journal_entry_lines.forEach((l: any) => {
              if (l.narration?.includes("- Paid")) {
                paid += Number(l.credit_amount || l.debit_amount || 0);
              }
              if (l.narration?.toLowerCase().includes("bank")) {
                paymentType = "Bank";
              }
            });
          }
        }
        if (p.status?.toLowerCase() === "paid" && paid === 0) {
          paid = Number(p.total_amount || 0);
        }
        p.paid_amount = paid;
        p.balance_due = Math.max(0, Number(p.total_amount || 0) - paid);
        p.payment_type =
          paid > 0 ? paymentType : p.balance_due > 0 ? "Credit" : "Cash";
      });
    }

    allPurchases.sort(
      (a, b) =>
        new Date(b.order_date || b.created_at).getTime() -
        new Date(a.order_date || a.created_at).getTime(),
    );

    return allPurchases as any;
  }

  static async getById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers(*),
        purchase_order_items(
          *,
          product_variations(id, sku, products(name)),
          units_of_measure(id, name, abbreviation)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as any;
  }

  static async create(
    po: CreatePurchaseOrderDTO,
    items: CreatePurchaseOrderItemDTO[],
  ): Promise<PurchaseOrder> {
    const { data: createdPo, error: poError } = await supabase
      .from("purchase_orders")
      .insert(po)
      .select()
      .single();

    if (poError) throw poError;

    const itemsToInsert = items.map((item) => ({
      ...item,
      purchase_order_id: createdPo.id,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase.from("purchase_orders").delete().eq("id", createdPo.id);
      throw itemsError;
    }

    return createdPo as any;
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  }
}
