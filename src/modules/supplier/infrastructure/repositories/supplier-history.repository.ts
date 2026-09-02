import { supabase } from "@/integrations/supabase/client";
import { SupplierHistoryItem } from "../../domain/types";

export class SupplierHistoryRepository {
  static async getHistory(supplierId: string): Promise<SupplierHistoryItem[]> {
    // Fetch purchase orders
    const { data: orders, error: ordersError } = await supabase
      .from("purchase_orders")
      .select("id, po_number, order_date, status, total_amount")
      .eq("supplier_id", supplierId)
      .order("order_date", { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch purchase invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("purchase_invoices")
      .select("id, invoice_number, invoice_date, status, total_amount")
      .eq("supplier_id", supplierId)
      .order("invoice_date", { ascending: false });

    if (invoicesError) throw invoicesError;

    const history: SupplierHistoryItem[] = [];

    if (orders) {
      orders.forEach((o) =>
        history.push({
          id: o.id,
          type: "Purchase Order",
          reference_number: o.po_number,
          date: o.order_date,
          status: o.status,
          amount: Number(o.total_amount || 0),
          balance: Number(o.total_amount || 0),
        })
      );
    }

    if (invoices) {
      invoices.forEach((i) =>
        history.push({
          id: i.id,
          type: "Purchase Invoice",
          reference_number: i.invoice_number,
          date: i.invoice_date,
          status: i.status,
          amount: Number(i.total_amount || 0),
          balance: Number(i.total_amount || 0),
        })
      );
    }

    if (history.length > 0) {
      const referenceIds = history.map((h) => h.id);

      const { data: jeData } = await supabase
        .from("journal_entries")
        .select(`
          reference_id,
          journal_entry_lines (
            debit_amount,
            credit_amount,
            narration
          )
        `)
        .in("reference_id", referenceIds);

      if (jeData) {
        history.forEach((h) => {
          const entry = jeData.find((je: any) => je.reference_id === h.id);
          let paid = 0;
          if (entry && entry.journal_entry_lines) {
            entry.journal_entry_lines.forEach((l: any) => {
              if (l.narration?.includes("- Paid")) {
                paid += Number(l.credit_amount || l.debit_amount || 0);
              }
            });
          }
          if (h.status?.toLowerCase() === "paid" && paid === 0) {
            h.balance = 0;
          } else {
            h.balance = Math.max(0, h.amount - paid);
          }
        });
      }
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
  }

  static async getAllSuppliersDueMap(): Promise<Record<string, number>> {
    const { data: orders } = await supabase
      .from("purchase_orders")
      .select("id, supplier_id, total_amount, status");

    const { data: invoices } = await supabase
      .from("purchase_invoices")
      .select("id, supplier_id, total_amount, status");

    const allTx: { id: string; supplier_id: string; amount: number; status: string }[] = [];
    if (orders) {
      orders.forEach((o) =>
        allTx.push({ id: o.id, supplier_id: o.supplier_id, amount: Number(o.total_amount || 0), status: o.status })
      );
    }
    if (invoices) {
      invoices.forEach((i) =>
        allTx.push({ id: i.id, supplier_id: i.supplier_id, amount: Number(i.total_amount || 0), status: i.status })
      );
    }

    const dueMap: Record<string, number> = {};
    if (allTx.length === 0) return dueMap;

    const refIds = allTx.map((t) => t.id);
    const { data: jeData } = await supabase
      .from("journal_entries")
      .select(`
        reference_id,
        journal_entry_lines (
          debit_amount,
          credit_amount,
          narration
        )
      `)
      .in("reference_id", refIds);

    allTx.forEach((t) => {
      let paid = 0;
      if (jeData) {
        const entry = jeData.find((j: any) => j.reference_id === t.id);
        if (entry && entry.journal_entry_lines) {
          entry.journal_entry_lines.forEach((l: any) => {
            if (l.narration?.includes("- Paid")) {
              paid += Number(l.credit_amount || l.debit_amount || 0);
            }
          });
        }
      }
      const balance = (t.status?.toLowerCase() === "paid" && paid === 0) ? 0 : Math.max(0, t.amount - paid);
      dueMap[t.supplier_id] = (dueMap[t.supplier_id] || 0) + balance;
    });

    return dueMap;
  }
}
