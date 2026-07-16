import DirhamIcon from "@/components/DirhamIcon";
import { useOrders, useProducts } from "@/hooks/useDatabase";
import { Clock, DollarSign, Package, ShoppingCart } from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const Dashboard = () => {
  const { data: allOrders = [] } = useOrders();
  const { data: products = [] } = useProducts();

  const [dateFilter, setDateFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const orders = allOrders.filter((o) => {
    if (dateFilter === "all") return true;

    // Fallback safely if created_at is missing
    const orderDate = new Date(o.created_at || new Date());
    const now = new Date();

    if (dateFilter === "today") {
      return orderDate.toDateString() === now.toDateString();
    }
    if (dateFilter === "week") {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return orderDate >= weekAgo;
    }
    if (dateFilter === "month") {
      return (
        orderDate.getMonth() === now.getMonth() &&
        orderDate.getFullYear() === now.getFullYear()
      );
    }
    if (dateFilter === "custom" && startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      return orderDate >= s && orderDate <= e;
    }
    return true;
  });

  const revenueGeneratingOrders = orders.filter(
    (o) => o.status === "delivered",
  );
  const totalRevenue = revenueGeneratingOrders.reduce(
    (s, o) => s + Number(o.total),
    0,
  );
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;

  const stats = [
    {
      label: "Total Revenue",
      value: (
        <span className="flex items-center">
          <DirhamIcon className="mr-1" /> {totalRevenue}
        </span>
      ),
      icon: DollarSign,
      change: `${orders.length} orders`,
    },
    {
      label: "Total Orders",
      value: orders.length,
      icon: ShoppingCart,
      change: `${pendingOrders} pending`,
    },
    {
      label: "Products",
      value: products.length,
      icon: Package,
      change: `${products.filter((p) => p.is_active).length} active`,
    },
    {
      label: "Delivered",
      value: deliveredOrders,
      icon: Clock,
      change: `${orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0}% rate`,
    },
  ];

  // Build revenue by status
  const statusData = [
    {
      name: "Pending",
      value: orders.filter((o) => o.status === "pending").length,
    },
    {
      name: "Confirmed",
      value: orders.filter((o) => o.status === "confirmed").length,
    },
    {
      name: "Shipped",
      value: orders.filter((o) => o.status === "shipped").length,
    },
    {
      name: "Delivered",
      value: orders.filter((o) => o.status === "delivered").length,
    },
    {
      name: "Cancelled",
      value: orders.filter((o) => o.status === "cancelled").length,
    },
  ].filter((d) => d.value > 0);

  // Category breakdown from products
  const catMap = new Map<string, number>();
  products.forEach((p) =>
    catMap.set(p.category, (catMap.get(p.category) || 0) + 1),
  );
  const categoryData = Array.from(catMap.entries()).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "hsl(217, 91%, 56%)",
    "hsl(210, 100%, 45%)",
    "hsl(0, 80%, 56%)",
    "hsl(45, 100%, 50%)",
    "hsl(160, 70%, 40%)",
  ];
  const tooltipStyle = {
    background: "#fff",
    border: "1px solid hsl(220, 13%, 89%)",
    borderRadius: 8,
    fontFamily: "var(--font-body)",
    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  };
  const gridStroke = "hsl(220, 13%, 91%)";
  const axisStroke = "hsl(220, 10%, 60%)";

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-700",
    confirmed: "bg-blue-100 text-blue-700",
    shipped: "bg-purple-100 text-purple-700",
    delivered: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  // Revenue per order for chart
  const revenueByOrder = revenueGeneratingOrders
    .slice()
    .reverse()
    .slice(0, 10)
    .map((o, i) => ({
      name: o.order_number || `#${i + 1}`,
      revenue: Number(o.total),
    }));

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Dashboard
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            Welcome back to kkkparts admin
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Date</option>
          </select>

          {dateFilter === "custom" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-muted-foreground">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-border rounded-md px-3 py-2 font-body text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-border p-6 rounded-lg hover:border-primary/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="font-body text-xs text-primary font-semibold">
                {stat.change}
              </span>
            </div>
            <p className="font-heading text-2xl font-bold text-foreground">
              {stat.value}
            </p>
            <p className="font-body text-xs text-muted-foreground mt-1">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="lg:col-span-2 bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            Revenue by Order
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueByOrder}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
              <YAxis stroke={axisStroke} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="revenue"
                fill="hsl(217, 91%, 56%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            Products by Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                labelLine={false}
              >
                {categoryData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            Order Status
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={statusData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="name" stroke={axisStroke} fontSize={12} />
              <YAxis stroke={axisStroke} fontSize={12} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar
                dataKey="value"
                fill="hsl(217, 91%, 56%)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card border border-border p-6 rounded-lg">
          <h3 className="font-heading text-lg font-bold uppercase tracking-wider mb-4 text-foreground">
            Recent Orders
          </h3>
          <div className="space-y-3">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {order.order_number}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {order.customer_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-body text-sm font-bold text-primary flex items-center justify-end">
                    <DirhamIcon className="mr-1" /> {Number(order.total)}
                  </p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-body font-semibold rounded-full uppercase ${statusColors[order.status] || ""}`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
