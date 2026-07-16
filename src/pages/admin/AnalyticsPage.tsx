import { useOrders } from "@/hooks/useDatabase";
import { Calendar } from "lucide-react";
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
      const to = endDate ? new Date(endDate + "T23:59:59") : new Date();
      list = list.filter((o) => {
        const d = new Date(o.created_at);
        return d >= from && d <= to;
      });
    }
    return list;
  }, [orders, quickFilter, startDate, endDate]);

  const revenueGeneratingOrders = filteredOrders.filter(
    (o) => o.status === "delivered",
  );
  const totalRevenue = revenueGeneratingOrders.reduce(
    (s, o) => s + Number(o.total),
    0,
  );
  const avgOrderValue =
    revenueGeneratingOrders.length > 0
      ? totalRevenue / revenueGeneratingOrders.length
      : 0;

  // Group orders by date
  const revenueData = useMemo(() => {
    const dateMap = new Map<string, { revenue: number; count: number }>();
    filteredOrders.forEach((o) => {
      const date = new Date(o.created_at).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
      const existing = dateMap.get(date) || { revenue: 0, count: 0 };
      if (o.status === "delivered") {
        existing.revenue += Number(o.total);
      }
      existing.count += 1;
      dateMap.set(date, existing);
    });
    return Array.from(dateMap.entries()).map(([date, d]) => ({
      date,
      revenue: d.revenue,
      orders: d.count,
    }));
  }, [filteredOrders]);

  // Top products from order items
  const topProducts = useMemo(() => {
    const productMap = new Map<string, { sales: number; revenue: number }>();
    revenueGeneratingOrders.forEach((o) => {
      const items = (o.items as any[]) || [];
      items.forEach((item: any) => {
        const existing = productMap.get(item.productName) || {
          sales: 0,
          revenue: 0,
        };
        existing.sales += item.quantity;
        existing.revenue += item.price * item.quantity;
        productMap.set(item.productName, existing);
      });
    });
    return Array.from(productMap.entries())
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredOrders]);

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
          Analytics
        </h1>
        <p className="font-body text-sm text-muted-foreground mt-1">
          Real sales data from your database
        </p>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-card border border-border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <Calendar className="w-4 h-4 text-muted-foreground" />
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
              className={`px-3 py-1.5 text-xs font-body rounded-md transition-colors ${quickFilter === f.key ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            label: "Total Revenue",
            value: `OMR ${totalRevenue.toLocaleString()}`,
          },
          {
            label: "Avg Order Value",
            value: `OMR ${avgOrderValue.toFixed(1)}`,
          },
          { label: "Total Orders", value: filteredOrders.length },
          {
            label: "Delivered",
            value: filteredOrders.filter((o) => o.status === "delivered")
              .length,
          },
        ].map((kpi) => (
          <div
            key={kpi.label}
            className="bg-card border border-border p-5 rounded-lg"
          >
            <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-1">
              {kpi.label}
            </p>
            <p className="font-heading text-2xl font-bold text-primary">
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border p-6 rounded-lg mb-4">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
          Revenue by Date
        </h3>
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
            <YAxis stroke={axisStroke} fontSize={12} />
            <Tooltip contentStyle={tooltipStyle} />
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
      </div>

      <div className="bg-card border border-border p-6 rounded-lg">
        <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
          Top Products (by Revenue)
        </h3>
        <div className="space-y-3">
          {topProducts.length === 0 ? (
            <p className="text-muted-foreground font-body text-sm">
              No order data yet
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
                      {p.sales} sold
                    </p>
                  </div>
                </div>
                <span className="font-body text-sm font-bold text-primary">
                  OMR {p.revenue}
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
