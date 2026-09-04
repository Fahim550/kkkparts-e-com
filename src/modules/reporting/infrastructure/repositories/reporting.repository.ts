import { supabase } from "@/integrations/supabase/client";
import { DashboardMetrics, SalesReportItem, InventoryReportItem, SalesChartData } from "../../domain/types";

export class ReportingRepository {
  /**
   * Helper to build a unit cost map for all product variations.
   * Priority: FIFO active lot unit cost -> product original_price -> product price -> 0
   */
  private static async getVariationCostMap(): Promise<Map<string, number>> {
    const [{ data: fifoLedgers }, { data: variations }] = await Promise.all([
      supabase.from("fifo_ledgers").select("variation_id, unit_cost").gt("quantity_remaining", 0),
      supabase.from("product_variations").select("id, products(price, original_price)")
    ]);

    const varCostMap = new Map<string, number>();
    fifoLedgers?.forEach((f) => {
      if (!varCostMap.has(f.variation_id)) {
        varCostMap.set(f.variation_id, Number(f.unit_cost || 0));
      }
    });
    variations?.forEach((v) => {
      if (!varCostMap.has(v.id)) {
        const p = v.products as any;
        varCostMap.set(v.id, Number(p?.original_price || p?.price || 0));
      }
    });
    return varCostMap;
  }

  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1, 0, 0, 0).toISOString();

    // 1. Sales & Items with Costs
    const [
      { data: invoices },
      { data: orders },
      { data: receipts },
      { data: cogsEntries },
      varCostMap
    ] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("id, total_amount, sales_order_id, status, created_at, sales_invoice_items(variation_id, quantity_billed)")
        .gte("created_at", firstDayOfMonth)
        .neq("status", "Cancelled"),
      supabase
        .from("sales_orders")
        .select("id, total_amount, status, created_at, sales_order_items(variation_id, quantity_ordered)")
        .gte("created_at", firstDayOfMonth)
        .not("status", "in", '("cancelled","draft")'),
      supabase
        .from("pos_receipts")
        .select("id, total_amount, status, created_at, pos_receipt_items(variation_id, quantity)")
        .gte("created_at", firstDayOfMonth)
        .not("status", "in", '("cancelled","void")'),
      supabase
        .from("cogs_entries")
        .select("outbound_reference_id, total_cogs")
        .gte("created_at", firstDayOfMonth),
      ReportingRepository.getVariationCostMap()
    ]);

    const receiptCogsMap = new Map<string, number>();
    cogsEntries?.forEach((c) => {
      if (c.outbound_reference_id) {
        const prev = receiptCogsMap.get(c.outbound_reference_id) || 0;
        receiptCogsMap.set(c.outbound_reference_id, prev + Number(c.total_cogs || 0));
      }
    });

    const invoicedOrderIds = new Set(invoices?.map((i) => i.sales_order_id).filter(Boolean));
    const nonInvoicedOrders = orders?.filter((o) => !invoicedOrderIds.has(o.id)) || [];

    // Calculate revenue & cost for invoices
    let invoiceSales = 0;
    let invoiceCost = 0;
    invoices?.forEach((inv) => {
      invoiceSales += Number(inv.total_amount || 0);
      const cost = (inv.sales_invoice_items as any[])?.reduce((sum, item) => {
        return sum + Number(item.quantity_billed || 0) * (varCostMap.get(item.variation_id) || 0);
      }, 0) || 0;
      invoiceCost += cost;
    });

    // Calculate revenue & cost for standalone orders
    let orderSales = 0;
    let orderCost = 0;
    nonInvoicedOrders.forEach((o) => {
      orderSales += Number(o.total_amount || 0);
      const cost = (o.sales_order_items as any[])?.reduce((sum, item) => {
        return sum + Number(item.quantity_ordered || 0) * (varCostMap.get(item.variation_id) || 0);
      }, 0) || 0;
      orderCost += cost;
    });

    // Calculate revenue & cost for POS receipts
    let posSales = 0;
    let posCost = 0;
    receipts?.forEach((r) => {
      posSales += Number(r.total_amount || 0);
      let cost = receiptCogsMap.get(r.id);
      if (cost === undefined) {
        cost = (r.pos_receipt_items as any[])?.reduce((sum, item) => {
          return sum + Number(item.quantity || 0) * (varCostMap.get(item.variation_id) || 0);
        }, 0) || 0;
      }
      posCost += cost;
    });

    const total_sales = invoiceSales + orderSales + posSales;
    const total_cogs = invoiceCost + orderCost + posCost;
    // Net profit accounts for both profitable orders and losses (order profit or loss count)
    const total_profit = total_sales - total_cogs;

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
        .select("original_price, price");
      inventory_value =
        products?.reduce((sum: number, p: any) => {
          const unitCost = Number(p.original_price || p.price || 0);
          return sum + unitCost;
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
      total_cogs,
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

    const [
      { data: invoices },
      { data: orders },
      { data: receipts },
      { data: cogsEntries },
      varCostMap
    ] = await Promise.all([
      supabase
        .from("sales_invoices")
        .select("id, total_amount, sales_order_id, created_at, status, sales_invoice_items(variation_id, quantity_billed)")
        .gte("created_at", startDate.toISOString())
        .neq("status", "Cancelled"),
      supabase
        .from("sales_orders")
        .select("id, total_amount, created_at, status, sales_order_items(variation_id, quantity_ordered)")
        .gte("created_at", startDate.toISOString())
        .not("status", "in", '("cancelled","draft")'),
      supabase
        .from("pos_receipts")
        .select("id, total_amount, created_at, status, pos_receipt_items(variation_id, quantity)")
        .gte("created_at", startDate.toISOString())
        .not("status", "in", '("cancelled","void")'),
      supabase
        .from("cogs_entries")
        .select("outbound_reference_id, total_cogs, created_at")
        .gte("created_at", startDate.toISOString()),
      ReportingRepository.getVariationCostMap()
    ]);

    const receiptCogsMap = new Map<string, number>();
    cogsEntries?.forEach((c) => {
      if (c.outbound_reference_id) {
        const prev = receiptCogsMap.get(c.outbound_reference_id) || 0;
        receiptCogsMap.set(c.outbound_reference_id, prev + Number(c.total_cogs || 0));
      }
    });

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
        const cost = (inv.sales_invoice_items as any[])?.reduce((sum, item) => {
          return sum + Number(item.quantity_billed || 0) * (varCostMap.get(item.variation_id) || 0);
        }, 0) || 0;
        dayBuckets[key].cogs += cost;
      }
    });

    orders?.forEach((o) => {
      if (!invoicedOrderIds.has(o.id)) {
        const key = o.created_at?.split("T")[0];
        if (key && dayBuckets[key]) {
          dayBuckets[key].sales += Number(o.total_amount || 0);
          const cost = (o.sales_order_items as any[])?.reduce((sum, item) => {
            return sum + Number(item.quantity_ordered || 0) * (varCostMap.get(item.variation_id) || 0);
          }, 0) || 0;
          dayBuckets[key].cogs += cost;
        }
      }
    });

    receipts?.forEach((r) => {
      const key = r.created_at?.split("T")[0];
      if (key && dayBuckets[key]) {
        dayBuckets[key].sales += Number(r.total_amount || 0);
        let cost = receiptCogsMap.get(r.id);
        if (cost === undefined) {
          cost = (r.pos_receipt_items as any[])?.reduce((sum, item) => {
            return sum + Number(item.quantity || 0) * (varCostMap.get(item.variation_id) || 0);
          }, 0) || 0;
        }
        dayBuckets[key].cogs += cost;
      }
    });

    return Object.values(dayBuckets).map((b) => ({
      date: b.label,
      sales: b.sales,
      cost: b.cogs,
      profit: b.sales - b.cogs,
    }));
  }

  static async getSalesReport(): Promise<SalesReportItem[]> {
    const [
      { data: orders },
      { data: invoices },
      { data: receipts },
      { data: cogsEntries },
      varCostMap
    ] = await Promise.all([
      supabase
        .from("sales_orders")
        .select("id, so_number, order_date, created_at, total_amount, status, customers(name), sales_order_items(variation_id, quantity_ordered)")
        .not("status", "in", '("cancelled","draft")')
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("sales_invoices")
        .select("id, invoice_number, invoice_date, created_at, total_amount, status, customers(name), sales_order_id, sales_invoice_items(variation_id, quantity_billed)")
        .neq("status", "Cancelled")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("pos_receipts")
        .select("id, receipt_number, transaction_date, created_at, total_amount, status, walk_in_customer_name, customers(name), pos_receipt_items(variation_id, quantity)")
        .not("status", "in", '("cancelled","void")')
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("cogs_entries")
        .select("outbound_reference_id, total_cogs"),
      ReportingRepository.getVariationCostMap()
    ]);

    const receiptCogsMap = new Map<string, number>();
    cogsEntries?.forEach((c) => {
      if (c.outbound_reference_id) {
        const prev = receiptCogsMap.get(c.outbound_reference_id) || 0;
        receiptCogsMap.set(c.outbound_reference_id, prev + Number(c.total_cogs || 0));
      }
    });

    const report: SalesReportItem[] = [];

    if (invoices) {
      invoices.forEach((i) => {
        const amount = Number(i.total_amount || 0);
        const cost = (i.sales_invoice_items as any[])?.reduce((sum, item) => {
          return sum + Number(item.quantity_billed || 0) * (varCostMap.get(item.variation_id) || 0);
        }, 0) || 0;
        report.push({
          id: i.id,
          date: i.invoice_date || i.created_at || new Date().toISOString(),
          reference: i.invoice_number,
          customer: (i.customers as any)?.name || "Customer",
          amount,
          cost,
          profit: amount - cost,
          status: i.status || "Pending",
          source: "Invoice",
          detail_url: `/admin/orders`,
        });
      });
    }

    const invoicedOrderIds = new Set(invoices?.map((i) => i.sales_order_id).filter(Boolean));

    if (orders) {
      orders.forEach((o) => {
        const isInvoiced = invoicedOrderIds.has(o.id);
        const amount = Number(o.total_amount || 0);
        const cost = (o.sales_order_items as any[])?.reduce((sum, item) => {
          return sum + Number(item.quantity_ordered || 0) * (varCostMap.get(item.variation_id) || 0);
        }, 0) || 0;
        report.push({
          id: o.id,
          date: o.order_date || o.created_at || new Date().toISOString(),
          reference: o.so_number,
          customer: (o.customers as any)?.name || "Customer",
          amount,
          cost,
          profit: amount - cost,
          status: isInvoiced ? "Invoiced" : o.status || "Pending",
          source: "Order",
          detail_url: `/admin/orders/${o.id}`,
        });
      });
    }

    if (receipts) {
      receipts.forEach((r) => {
        const amount = Number(r.total_amount || 0);
        let cost = receiptCogsMap.get(r.id);
        if (cost === undefined) {
          cost = (r.pos_receipt_items as any[])?.reduce((sum, item) => {
            return sum + Number(item.quantity || 0) * (varCostMap.get(item.variation_id) || 0);
          }, 0) || 0;
        }
        report.push({
          id: r.id,
          date: r.transaction_date || r.created_at || new Date().toISOString(),
          reference: r.receipt_number,
          customer: (r.customers as any)?.name || r.walk_in_customer_name || "Walk-in Customer",
          amount,
          cost,
          profit: amount - cost,
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
