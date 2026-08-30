import { supabase } from "@/integrations/supabase/client";
import { CustomerHistoryItem, CustomerDueStats } from "../../domain/types";

export class CustomerHistoryRepository {
  static async getHistory(customerId: string): Promise<CustomerHistoryItem[]> {
    // Fetch sales orders
    const { data: orders, error: ordersError } = await supabase
      .from("sales_orders")
      .select("id, so_number, order_date, status, total_amount")
      .eq("customer_id", customerId)
      .order("order_date", { ascending: false });

    if (ordersError) throw ordersError;

    // Fetch sales invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from("sales_invoices")
      .select("id, invoice_number, invoice_date, status, total_amount")
      .eq("customer_id", customerId)
      .order("invoice_date", { ascending: false });

    if (invoicesError) throw invoicesError;

    // Merge and sort
    const history: CustomerHistoryItem[] = [];

    if (orders) {
      orders.forEach(o => history.push({
        id: o.id,
        type: "Sales Order",
        reference_number: o.so_number,
        date: o.order_date,
        status: o.status,
        amount: Number(o.total_amount),
        balance: Number(o.total_amount)
      }));
    }

    if (invoices) {
      invoices.forEach(i => history.push({
        id: i.id,
        type: "Sales Invoice",
        reference_number: i.invoice_number,
        date: i.invoice_date,
        status: i.status,
        amount: Number(i.total_amount),
        balance: Number(i.total_amount)
      }));
    }

    if (history.length > 0) {
      const referenceIds = history.map(h => h.id);
      
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
        history.forEach(h => {
          const entry = jeData.find((je: any) => je.reference_id === h.id);
          let paid = 0;
          if (entry && entry.journal_entry_lines) {
             entry.journal_entry_lines.forEach((l: any) => {
               if (l.narration?.includes("- Paid")) {
                 paid += Number(l.debit_amount || 0);
               }
             });
          }
          h.balance = Math.max(0, h.amount - paid);
        });
      }
    }

    // Sort by date descending
    history.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return history;
  }

  static async getDueStats(customerId: string): Promise<CustomerDueStats> {
    const { data: invoices, error: invoicesError } = await supabase
      .from("sales_invoices")
      .select("status, total_amount")
      .eq("customer_id", customerId);

    if (invoicesError) throw invoicesError;

    const { count: ordersCount, error: ordersError } = await supabase
      .from("sales_orders")
      .select("*", { count: 'exact', head: true })
      .eq("customer_id", customerId);

    if (ordersError) throw ordersError;

    let total_due = 0;
    let total_invoiced = 0;

    if (invoices) {
      invoices.forEach(inv => {
        const amt = Number(inv.total_amount);
        total_invoiced += amt;
        // Assuming status like 'Draft', 'Unpaid', 'Paid'
        if (inv.status !== 'Paid' && inv.status !== 'Draft') {
          total_due += amt;
        }
      });
    }

    return {
      total_due,
      total_invoiced,
      total_orders: ordersCount || 0
    };
  }
}
