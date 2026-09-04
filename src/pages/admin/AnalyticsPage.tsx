import { useOrders } from "@/hooks/useDatabase";
import { Calendar, ShoppingCart, Monitor, DollarSign, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AnalyticsPage = () => {
  const { data: orders = [] } = useOrders();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    let list = orders;
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    if (quickFilter === "today") {
      list = list.filter((o) => new Date(o.created_at) >= startOfToday);
    } else if (quickFilter === "yesterday") {
      const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        return d >= startOfYesterday && d < startOfToday;
      });
    } else if (quickFilter === "7d") {
      list = list.filter(
        (o) =>
          new Date(o.created_at) >=
          new Date(startOfToday.getTime() - 7 * 86400000),
      );
    } else if (quickFilter === "30d") {
      list = list.filter(
        (o) =>
          new Date(o.created_at) >=
          new Date(startOfToday.getTime() - 30 * 86400000),
      );
    } else if (quickFilter === "custom" && startDate) {
      const from = new Date(startDate);
      from.setHours(0, 0, 0, 0);
      const to = endDate ? new Date(endDate) : new Date();
      to.setHours(23, 59, 59, 999);
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    }
    return list;
  }, [orders, quickFilter, startDate, endDate]);

  // Valid revenue statuses (including POS "paid" receipts and completed orders)
  const isRevenueOrder = (o: any) => {
    const status = (o.status || "").toLowerCase();
    const cancelled = ["cancelled", "void", "draft"].includes(status);
    if (cancelled) return false;
    // POS receipts are 'paid', sales orders are 'delivered', 'completed', 'paid', 'confirmed'
    return ["delivered", "completed", "paid", "confirmed"].includes(status) || o.type === "pos_receipt";
  };

  const revenueGeneratingOrders = useMemo(() => {
    return filteredOrders.filter(isRevenueOrder);
  }, [filteredOrders]);

  const totalRevenue = useMemo(() => {
    return revenueGeneratingOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  }, [revenueGeneratingOrders]);

  const avgOrderValue =
    revenueGeneratingOrders.length > 0
      ? totalRevenue / revenueGeneratingOrders.length
      : 0;

  // Breakdown by channel
  const channelStats = useMemo(() => {
    const pos = revenueGeneratingOrders.filter((o) => o.type === "pos_receipt");
    const online = revenueGeneratingOrders.filter((o) => o.type !== "pos_receipt");
    return {
      posRevenue: pos.reduce((sum, o) => sum + Number(o.total || 0), 0),
      posCount: pos.length,
      onlineRevenue: online.reduce((sum, o) => sum + Number(o.total || 0), 0),
      onlineCount: online.length,
    };
  }, [revenueGeneratingOrders]);

  // Group orders chronologically by date for chart
  const revenueData = useMemo(() => {
    const dateMap = new Map<string, { label: string; revenue: number; count: number; timestamp: number }>();

    revenueGeneratingOrders.forEach((o) => {
      const d = new Date(o.created_at);
      const isoDate = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

      const existing = dateMap.get(isoDate) || {
        label,
        revenue: 0,
        count: 0,
        timestamp: new Date(isoDate).getTime(),
      };
      existing.revenue += Number(o.total || 0);
      existing.count += 1;
      dateMap.set(isoDate, existing);
    });

    // Sort chronologically ascending
    const sorted = Array.from(dateMap.values()).sort((a, b) => a.timestamp - b.timestamp);

    return sorted.map((d) => ({
      date: d.label,
      revenue: Number(d.revenue.toFixed(3)),
      orders: d.count,
    }));
  }, [revenueGeneratingOrders]);

  // Top products from order items
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { sales: number; revenue: number }>();
    revenueGeneratingOrders.forEach((o) => {
      const items = (o.items as any[]) || [];
      items.forEach((item: any) => {
        const name = item.productName || "Unknown Item";
        const existing = productMap.get(name) || {
          sales: 0,
          revenue: 0,
        };
        const qty = Number(item.quantity || 1);
        const price = Number(item.price || 0);
        existing.sales += qty;
        existing.revenue += price * qty;
        productMap.set(name, existing);
      });
    });
    return Array.from(productMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [revenueGeneratingOrders]);

  const tooltipStyle = {
    background: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };
  const gridStroke = "hsl(220, 13%, 91%)";
  const axisStroke = "hsl(220, 10%, 60%)";

  const handleQuickFilter = (f: string) => {
    setQuickFilter(f);
    if (f !== "custom") {
      setStartDate("");
      setEndDate("");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
          Analytics & Revenue
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Unified sales performance across Online Orders and POS Store Sales
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground mr-1" />
          {[
            { key: "all", label: "All Time" },
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "7d", label: "Last 7 Days" },
            { key: "30d", label: "Last 30 Days" },
            { key: "custom", label: "Custom" },
          ].map((f) => (
            <button
              key={f.key}
              onClick={() => handleQuickFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-body rounded-md transition-colors ${
                quickFilter === f.key
                  ? "bg-primary text-primary-foreground font-medium"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
          {quickFilter === "custom" && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-body border border-border bg-background rounded-md text-foreground focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 text-xs font-body border border-border bg-background rounded-md text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-5 rounded-lg">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Total Revenue
          </p>
          <p className="font-heading text-2xl font-bold text-primary">
            OMR {totalRevenue.toFixed(3)}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {revenueGeneratingOrders.length} successful transactions
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-lg">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Avg Order Value
          </p>
          <p className="font-heading text-2xl font-bold text-primary">
            OMR {avgOrderValue.toFixed(3)}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            Across online & POS counter
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-lg">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
            POS Counter Revenue
          </p>
          <p className="font-heading text-2xl font-bold text-indigo-600">
            OMR {channelStats.posRevenue.toFixed(3)}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {channelStats.posCount} walk-in receipts
          </p>
        </div>

        <div className="bg-card border border-border p-5 rounded-lg">
          <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Online Orders Revenue
          </p>
          <p className="font-heading text-2xl font-bold text-blue-600">
            OMR {channelStats.onlineRevenue.toFixed(3)}
          </p>
          <p className="font-body text-xs text-muted-foreground mt-1">
            {channelStats.onlineCount} online orders
          </p>
        </div>
      </div>

      {/* Revenue Trend Area Chart */}
      <div className="bg-card border border-border p-6 rounded-lg mb-4">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
          Revenue by Date (Chronological)
        </h3>
        {revenueData.length === 0 ? (
          <div className="h-[260px] flex items-center justify-center text-muted-foreground text-sm">
            No sales recorded for this date period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="hsl(217, 91%, 56%)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="hsl(217, 91%, 56%)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="date" stroke={axisStroke} fontSize={12} />
              <YAxis stroke={axisStroke} fontSize={12} tickFormatter={(val) => `${val}`} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: any) => [`OMR ${Number(value || 0).toFixed(3)}`, "Revenue"]}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="hsl(217, 91%, 56%)"
                fillOpacity={1}
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Products */}
      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
          Top Products (by Revenue)
        </h3>
        <div className="space-y-3">
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground font-body text-sm">
              No product sales data recorded yet
            </p>
          ) : (
            topProducts.map((p, i) => (
              <div
                key={p.name}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="font-heading text-lg font-bold text-primary w-6">
                    #{i + 1}
                  </span>
                  <div>
                    <p className="font-body text-sm font-semibold text-foreground">
                      {p.name}
                    </p>
                    <p className="font-body text-xs text-muted-foreground">
                      {p.sales} units sold
                    </p>
                  </div>
                </div>
                <span className="font-body text-sm font-bold text-primary font-mono">
                  OMR {p.revenue.toFixed(3)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
