import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, SalesReportItem, InventoryReportItem, SalesChartData } from "../../domain/types";

export class ReportingRepository {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    // Sales (Orders + Invoices + POS)
    const { data: orders } = await supabase.from("sales_orders").select("total_amount").gte("created_at", firstDayOfMonth);
    const { data: invoices } = await supabase.from("sales_invoices").select("total_amount").gte("created_at", firstDayOfMonth);
    const { data: receipts } = await supabase.from("pos_receipts").select("total_amount").gte("created_at", firstDayOfMonth);
    
    const total_sales = (orders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0) +
                        (invoices?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0) + 
                        (receipts?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0);

    // Purchases (Purchase Orders + Invoices + Receipts)
    const { data: poList } = await supabase.from("purchase_orders").select("total_amount").gte("created_at", firstDayOfMonth);
    const { data: piList } = await supabase.from("purchase_invoices").select("total_amount").gte("created_at", firstDayOfMonth);
    const { data: purchases } = await supabase.from("purchase_receipts").select("total_amount").eq("status", "Received").gte("created_at", firstDayOfMonth);
    
    const total_purchases = (poList?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0) +
                            (piList?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0) +
                            (purchases?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0);

    // Profit (Sales - COGS)
    const { data: cogs } = await supabase.from("cogs_entries").select("cogs_amount").gte("created_at", firstDayOfMonth);
    const total_cogs = cogs?.reduce((sum, c) => sum + Number(c.cogs_amount || 0), 0) || 0;
    const total_profit = Math.max(0, total_sales - total_cogs);

    // Inventory Value (Calculate from stock_balances and products)
    const { data: products } = await supabase.from("products").select("cost_price, original_price, price, stock, product_variations(stock_balances(quantity))");
    const inventory_value = products?.reduce((sum: number, p: any) => {
      const unitCost = Number(p.cost_price || p.original_price || p.price || 0);
      const varStock = (p.product_variations || []).reduce((vSum: number, pv: any) => {
        return vSum + (pv.stock_balances || []).reduce((bSum: number, sb: any) => bSum + Number(sb.quantity || 0), 0);
      }, 0);
      const totalStock = varStock > 0 ? varStock : Number(p.stock || 0);
      return sum + (unitCost * totalStock);
    }, 0) || 0;

    // Active Customers
    const { count: customers } = await supabase.from("customers").select("*", { count: 'exact', head: true }).eq("is_active", true);
    
    // Low Stock (Items with quantity <= 5)
    const { count: lowStock } = await supabase.from("stock_balances").select("*", { count: 'exact', head: true }).lte("quantity", 5);

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
    const days = 7;
    const data: SalesChartData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.setHours(0,0,0,0)).toISOString();
      const endOfDay = new Date(date.setHours(23,59,59,999)).toISOString();
      
      const { data: orders } = await supabase.from("sales_orders").select("total_amount").gte("created_at", startOfDay).lte("created_at", endOfDay);
      const { data: invoices } = await supabase.from("sales_invoices").select("total_amount").gte("created_at", startOfDay).lte("created_at", endOfDay);
      const { data: receipts } = await supabase.from("pos_receipts").select("total_amount").gte("created_at", startOfDay).lte("created_at", endOfDay);
      const { data: cogs } = await supabase.from("cogs_entries").select("cogs_amount").gte("created_at", startOfDay).lte("created_at", endOfDay);
      
      const sales = (orders?.reduce((sum, x) => sum + Number(x.total_amount || 0), 0) || 0) +
                    (invoices?.reduce((sum, x) => sum + Number(x.total_amount || 0), 0) || 0) + 
                    (receipts?.reduce((sum, x) => sum + Number(x.total_amount || 0), 0) || 0);
      const cost = cogs?.reduce((sum, x) => sum + Number(x.cogs_amount || 0), 0) || 0;

      data.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        sales,
        profit: Math.max(0, sales - cost)
      });
    }
    
    return data;
  }

  static async getSalesReport(): Promise<SalesReportItem[]> {
    const { data: orders } = await supabase
      .from("sales_orders")
      .select("id, so_number, order_date, created_at, total_amount, status, customers(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    const { data: invoices } = await supabase
      .from("sales_invoices")
      .select("id, invoice_number, invoice_date, created_at, total_amount, status, customers(name)")
      .order("created_at", { ascending: false })
      .limit(100);
      
    const { data: receipts } = await supabase
      .from("pos_receipts")
      .select("id, receipt_number, transaction_date, created_at, total_amount, status, walk_in_customer_name, customers(name)")
      .order("created_at", { ascending: false })
      .limit(100);

    const report: SalesReportItem[] = [];
    
    if (orders) {
      orders.forEach(o => report.push({
        id: o.id,
        date: o.order_date || o.created_at,
        reference: o.so_number,
        customer: (o.customers as any)?.name || 'Customer',
        amount: Number(o.total_amount || 0),
        status: o.status || 'Pending',
        source: 'Order'
      }));
    }

    if (invoices) {
      invoices.forEach(i => report.push({
        id: i.id,
        date: i.invoice_date || i.created_at,
        reference: i.invoice_number,
        customer: (i.customers as any)?.name || 'Customer',
        amount: Number(i.total_amount || 0),
        status: i.status || 'Pending',
        source: 'Invoice'
      }));
    }
    
    if (receipts) {
      receipts.forEach(r => report.push({
        id: r.id,
        date: r.transaction_date || r.created_at,
        reference: r.receipt_number,
        customer: (r.customers as any)?.name || r.walk_in_customer_name || 'Walk-in',
        amount: Number(r.total_amount || 0),
        status: r.status || 'Paid',
        source: 'POS'
      }));
    }

    report.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return report.slice(0, 150);
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
