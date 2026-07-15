import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, SalesReportItem, InventoryReportItem, SalesChartData } from "../../domain/types";

export class ReportingRepository {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Sales (Invoices + POS)
    const { data: invoices } = await supabase.from("sales_invoices").select("total_amount").eq("status", "Paid").gte("created_at", firstDayOfMonth);
    const { data: receipts } = await supabase.from("pos_receipts").select("total_amount").eq("status", "Paid").gte("created_at", firstDayOfMonth);
    
    const total_sales = (invoices?.reduce((sum, i) => sum + Number(i.total_amount), 0) || 0) + 
                        (receipts?.reduce((sum, r) => sum + Number(r.total_amount), 0) || 0);

    // Purchases
    const { data: purchases } = await supabase.from("purchase_receipts").select("total_amount").eq("status", "Received").gte("created_at", firstDayOfMonth);
    const total_purchases = purchases?.reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

    // Profit (Sales - COGS)
    // To be perfectly accurate, we sum COGS entries for the month.
    const { data: cogs } = await supabase.from("cogs_entries").select("cogs_amount").gte("created_at", firstDayOfMonth);
    const total_cogs = cogs?.reduce((sum, c) => sum + Number(c.cogs_amount), 0) || 0;
    const total_profit = total_sales - total_cogs;

    // Inventory Value (FIFO ledgers total_value)
    const { data: fifo } = await supabase.from("fifo_ledgers").select("total_value, remaining_quantity").gt("remaining_quantity", 0);
    const inventory_value = fifo?.reduce((sum, f) => sum + Number(f.total_value), 0) || 0;

    // Active Customers
    const { count: customers } = await supabase.from("customers").select("*", { count: 'exact', head: true }).eq("is_active", true);
    
    // Low Stock (Threshold hardcoded to 10 for simplicity, or fetched from products if available)
    const { count: lowStock } = await supabase.from("stock_balances").select("*", { count: 'exact', head: true }).lt("quantity", 10);

    return {
      total_sales,
      total_purchases,
      total_profit,
      inventory_value,
      active_customers: customers || 0,
      low_stock_items: lowStock || 0
    };
  }

  static async getSalesChartData(): Promise<SalesChartData[]> {
    // A simple 7-day lookback for the chart
    const days = 7;
    const data: SalesChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0,0,0,0)).toISOString();
      const endOfDay = new Date(date.setHours(23,59,59,999)).toISOString();
      
      const { data: invoices } = await supabase.from("sales_invoices").select("total_amount").eq("status", "Paid").gte("created_at", startOfDay).lte("created_at", endOfDay);
      const { data: receipts } = await supabase.from("pos_receipts").select("total_amount").eq("status", "Paid").gte("created_at", startOfDay).lte("created_at", endOfDay);
      const { data: cogs } = await supabase.from("cogs_entries").select("cogs_amount").gte("created_at", startOfDay).lte("created_at", endOfDay);
      
      const sales = (invoices?.reduce((sum, x) => sum + Number(x.total_amount), 0) || 0) + 
                    (receipts?.reduce((sum, x) => sum + Number(x.total_amount), 0) || 0);
      const cost = cogs?.reduce((sum, x) => sum + Number(x.cogs_amount), 0) || 0;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales,
        profit: sales - cost
      });
    }
    
    return data;
  }

  static async getSalesReport(): Promise<SalesReportItem[]> {
    const { data: invoices } = await supabase
      .from("sales_invoices")
      .select("id, invoice_number, invoice_date, total_amount, status, customers(name)")
      .order("invoice_date", { ascending: false })
      .limit(50);
      
    const { data: receipts } = await supabase
      .from("pos_receipts")
      .select("id, receipt_number, transaction_date, total_amount, status, customers(name)")
      .order("transaction_date", { ascending: false })
      .limit(50);

    const report: SalesReportItem[] = [];
    
    if (invoices) {
      invoices.forEach(i => report.push({
        id: i.id,
        date: i.invoice_date,
        reference: i.invoice_number,
        customer: (i.customers as any)?.name || 'Unknown',
        amount: Number(i.total_amount),
        status: i.status,
        source: 'Invoice'
      }));
    }
    
    if (receipts) {
      receipts.forEach(r => report.push({
        id: r.id,
        date: r.transaction_date,
        reference: r.receipt_number,
        customer: (r.customers as any)?.name || 'Walk-in',
        amount: Number(r.total_amount),
        status: r.status,
        source: 'POS'
      }));
    }

    report.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return report.slice(0, 100);
  }

  static async getInventoryReport(): Promise<InventoryReportItem[]> {
    const { data } = await supabase
      .from("stock_balances")
      .select(`
        quantity,
        product_variations(
          id, 
          sku,
          products(name)
        )
      `)
      .gt("quantity", 0);

    // We also need the value. The value can be fetched by grouping fifo_ledgers.
    const { data: fifo } = await supabase
      .from("fifo_ledgers")
      .select("variation_id, total_value")
      .gt("remaining_quantity", 0);

    const valueMap = new Map<string, number>();
    if (fifo) {
      fifo.forEach(f => {
        const current = valueMap.get(f.variation_id) || 0;
        valueMap.set(f.variation_id, current + Number(f.total_value));
      });
    }

    const report: InventoryReportItem[] = [];
    if (data) {
      data.forEach((b: any) => {
        const varId = b.product_variations.id;
        report.push({
          variation_id: varId,
          sku: b.product_variations.sku,
          name: b.product_variations.products.name,
          quantity: Number(b.quantity),
          total_value: valueMap.get(varId) || 0
        });
      });
    }

    return report;
  }
}
