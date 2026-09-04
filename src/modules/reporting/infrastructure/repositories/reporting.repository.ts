import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, SalesReportItem, InventoryReportItem, SalesChartData } from "../../domain/types";

export class ReportingRepository {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0).toISOString();

    // 1. Sales (Invoices + Standalone Orders + POS Receipts)
    // Avoid double-counting orders that already have an invoice
    const [
      { data: invoices },
      { data: orders },
      { data: receipts }
    ] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("total_amount, sales_order_id, status")
        .gte("created_at", firstDayOfMonth)
        .neq("status", "Cancelled"),
      supabase
        .from("sales_orders")
        .select("id, total_amount, status")
        .gte("created_at", firstDayOfMonth)
        .not("status", "in", '("cancelled","draft")'),
      supabase
        .from("pos_receipts")
        .select("total_amount, status")
        .gte("created_at", firstDayOfMonth)
        .not("status", "in", '("cancelled","void")')
    ]);

    const invoicedOrderIds = new Set(invoices?.map((i) => i.sales_order_id).filter(Boolean));
    const nonInvoicedOrders = orders?.filter((o) => !invoicedOrderIds.has(o.id)) || [];

    const total_sales =
      (invoices?.reduce((sum, i) => sum + Number(i.total_amount || 0), 0) || 0) +
      (nonInvoicedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0) +
      (receipts?.reduce((sum, r) => sum + Number(r.total_amount || 0), 0) || 0);

    // 2. Purchases (Purchase Invoices + Received PO Receipts not yet invoiced)
    const [
      { data: piList },
      { data: purchases }
    ] = await Promise.all([
      supabase
        .from("purchase_invoices")
        .select("total_amount, purchase_receipt_id, status")
        .gte("created_at", firstDayOfMonth)
        .neq("status", "Cancelled"),
      supabase
        .from("purchase_receipts")
        .select("id, total_amount, status")
        .eq("status", "Received")
        .gte("created_at", firstDayOfMonth)
    ]);

    const billedReceiptIds = new Set(piList?.map((p) => p.purchase_receipt_id).filter(Boolean));
    const unbilledReceipts = purchases?.filter((pr) => !billedReceiptIds.has(pr.id)) || [];

    const total_purchases =
      (piList?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0) +
      (unbilledReceipts.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0);

    // 3. Profit (Sales - COGS)
    // Note: Column in cogs_entries is total_cogs
    const { data: cogs } = await supabase
      .from("cogs_entries")
      .select("total_cogs")
      .gte("created_at", firstDayOfMonth);

    const total_cogs = cogs?.reduce((sum, c: any) => sum + Number(c.total_cogs || 0), 0) || 0;
    const total_profit = Math.max(0, total_sales - total_cogs);

    // 4. Inventory Value (FIFO Cost Layers if active, otherwise cost * stock)
    const { data: fifoLayers } = await supabase
      .from("fifo_ledgers")
      .select("quantity_remaining, unit_cost")
      .gt("quantity_remaining", 0);

    let inventory_value = 0;
    if (fifoLayers && fifoLayers.length > 0) {
      inventory_value = fifoLayers.reduce(
        (sum, f) => sum + Number(f.quantity_remaining || 0) * Number(f.unit_cost || 0),
        0
      );
    } else {
      const { data: products } = await supabase
        .from("products")
        .select("cost_price, original_price, price, stock");
      inventory_value =
        products?.reduce((sum: number, p: any) => {
          const unitCost = Number(p.cost_price || p.original_price || 0);
          return sum + unitCost * Number(p.stock || 0);
        }, 0) || 0;
    }

    // 5. Active Customers
    const { count: customers } = await supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // 6. Low Stock (Items with quantity <= 5)
    const { count: lowStock } = await supabase
      .from("stock_balances")
      .select("*", { count: "exact", head: true })
      .lte("quantity", 5);

    return {
      total_sales,
      total_purchases,
      total_profit,
      inventory_value,
      active_customers: customers || 0,
      low_stock_items: lowStock || 0,
    };
  }

  static async getSalesChartData(): Promise<SalesChartData[]> {
    const days = 7;
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    // Run 4 batched queries for the entire 7-day period (1 round-trip) instead of 28 sequential queries
    const [
      { data: invoices },
      { data: orders },
      { data: receipts },
      { data: cogs }
    ] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("total_amount, sales_order_id, created_at, status")
        .gte("created_at", startDate.toISOString())
        .neq("status", "Cancelled"),
      supabase
        .from("sales_orders")
        .select("id, total_amount, created_at, status")
        .gte("created_at", startDate.toISOString())
        .not("status", "in", '("cancelled","draft")'),
      supabase
        .from("pos_receipts")
        .select("total_amount, created_at, status")
        .gte("created_at", startDate.toISOString())
        .not("status", "in", '("cancelled","void")'),
      supabase
        .from("cogs_entries")
        .select("total_cogs, created_at")
        .gte("created_at", startDate.toISOString())
    ]);

    const invoicedOrderIds = new Set(invoices?.map((i) => i.sales_order_id).filter(Boolean));

    // Bucket by date (yyyy-mm-dd)
    const dayBuckets: Record<string, { label: string; sales: number; cogs: number }> = {};
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", { weekday: "short" });
      dayBuckets[key] = { label, sales: 0, cogs: 0 };
    }

    invoices?.forEach((inv) => {
      const key = inv.created_at?.split("T")[0];
      if (key && dayBuckets[key]) {
        dayBuckets[key].sales += Number(inv.total_amount || 0);
      }
    });

    orders?.forEach((o) => {
      if (!invoicedOrderIds.has(o.id)) {
        const key = o.created_at?.split("T")[0];
        if (key && dayBuckets[key]) {
          dayBuckets[key].sales += Number(o.total_amount || 0);
        }
      }
    });

    receipts?.forEach((r) => {
      const key = r.created_at?.split("T")[0];
      if (key && dayBuckets[key]) {
        dayBuckets[key].sales += Number(r.total_amount || 0);
      }
    });

    cogs?.forEach((c: any) => {
      const key = c.created_at?.split("T")[0];
      if (key && dayBuckets[key]) {
        dayBuckets[key].cogs += Number(c.total_cogs || 0);
      }
    });

    return Object.values(dayBuckets).map((b) => ({
      date: b.label,
      sales: b.sales,
      profit: Math.max(0, b.sales - b.cogs),
    }));
  }

  static async getSalesReport(): Promise<SalesReportItem[]> {
    const [
      { data: orders },
      { data: invoices },
      { data: receipts }
    ] = await Promise.all([
      supabase
        .from("sales_orders")
        .select("id, so_number, order_date, created_at, total_amount, status, customers(name)")
        .not("status", "in", '("cancelled","draft")')
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("sales_invoices")
        .select("id, invoice_number, invoice_date, created_at, total_amount, status, customers(name), sales_order_id")
        .neq("status", "Cancelled")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("pos_receipts")
        .select("id, receipt_number, transaction_date, created_at, total_amount, status, walk_in_customer_name, customers(name)")
        .not("status", "in", '("cancelled","void")')
        .order("created_at", { ascending: false })
        .limit(200)
    ]);

    const report: SalesReportItem[] = [];

    if (invoices) {
      invoices.forEach((i) => {
        report.push({
          id: i.id,
          date: i.invoice_date || i.created_at || new Date().toISOString(),
          reference: i.invoice_number,
          customer: (i.customers as any)?.name || "Customer",
          amount: Number(i.total_amount || 0),
          status: i.status || "Pending",
          source: "Invoice",
          detail_url: `/admin/orders`,
        });
      });
    }

    const invoicedOrderIds = new Set(invoices?.map((i) => i.sales_order_id).filter(Boolean));

    if (orders) {
      orders.forEach((o) => {
        // Mark orders that have been invoiced, or include direct non-invoiced orders
        const isInvoiced = invoicedOrderIds.has(o.id);
        report.push({
          id: o.id,
          date: o.order_date || o.created_at || new Date().toISOString(),
          reference: o.so_number,
          customer: (o.customers as any)?.name || "Customer",
          amount: Number(o.total_amount || 0),
          status: isInvoiced ? "Invoiced" : o.status || "Pending",
          source: "Order",
          detail_url: `/admin/orders/${o.id}`,
        });
      });
    }

    if (receipts) {
      receipts.forEach((r) => {
        report.push({
          id: r.id,
          date: r.transaction_date || r.created_at || new Date().toISOString(),
          reference: r.receipt_number,
          customer: (r.customers as any)?.name || r.walk_in_customer_name || "Walk-in Customer",
          amount: Number(r.total_amount || 0),
          status: r.status || "Paid",
          source: "POS",
          detail_url: `/admin/pos/receipt/${r.id}`,
        });
      });
    }

    report.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return report;
  }

  static async getInventoryReport(): Promise<InventoryReportItem[]> {
    // 1. Fetch FIFO layers with correct columns: quantity_remaining & unit_cost
    const { data: fifo } = await supabase
      .from("fifo_ledgers")
      .select("variation_id, quantity_remaining, unit_cost")
      .gt("quantity_remaining", 0);

    const valueMap = new Map<string, { total_value: number; quantity: number }>();
    if (fifo) {
      fifo.forEach((f) => {
        const current = valueMap.get(f.variation_id) || { total_value: 0, quantity: 0 };
        const layerValue = Number(f.quantity_remaining || 0) * Number(f.unit_cost || 0);
        valueMap.set(f.variation_id, {
          total_value: current.total_value + layerValue,
          quantity: current.quantity + Number(f.quantity_remaining || 0),
        });
      });
    }

    // 2. Fetch Stock Balances with joined variation, product name, and warehouse
    const { data: balances } = await supabase
      .from("stock_balances")
      .select(`
        quantity,
        variation_id,
        product_variations(
          id, 
          sku,
          products(name, cost_price, price)
        ),
        warehouses(name)
      `)
      .gt("quantity", 0);

    // Group by variation_id to prevent duplicate rows across multiple warehouses
    const grouped = new Map<
      string,
      {
        variation_id: string;
        sku: string;
        name: string;
        quantity: number;
        cost_price: number;
        warehouses: { warehouse_name: string; quantity: number }[];
      }
    >();

    if (balances) {
      balances.forEach((b: any) => {
        const varId = b.variation_id || b.product_variations?.id;
        if (!varId) return;

        const sku = b.product_variations?.sku || "SKU-UNKNOWN";
        const name = b.product_variations?.products?.name || "Product";
        const cost_price = Number(b.product_variations?.products?.cost_price || 0);
        const whName = b.warehouses?.name || "Main Warehouse";
        const qty = Number(b.quantity || 0);

        const existing = grouped.get(varId);
        if (existing) {
          existing.quantity += qty;
          existing.warehouses.push({ warehouse_name: whName, quantity: qty });
        } else {
          grouped.set(varId, {
            variation_id: varId,
            sku,
            name,
            quantity: qty,
            cost_price,
            warehouses: [{ warehouse_name: whName, quantity: qty }],
          });
        }
      });
    }

    const report: InventoryReportItem[] = [];
    grouped.forEach((item) => {
      const fifoInfo = valueMap.get(item.variation_id);
      let totalVal = fifoInfo ? fifoInfo.total_value : 0;

      // Fallback to cost_price if FIFO layer isn't recorded yet
      if (totalVal === 0 && item.cost_price > 0) {
        totalVal = item.cost_price * item.quantity;
      }

      const unitCost = item.quantity > 0 ? totalVal / item.quantity : item.cost_price;

      report.push({
        variation_id: item.variation_id,
        sku: item.sku,
        name: item.name,
        quantity: item.quantity,
        unit_cost: unitCost,
        total_value: totalVal,
        warehouse_breakdown: item.warehouses,
      });
    });

    report.sort((a, b) => b.total_value - a.total_value);
    return report;
  }
}
