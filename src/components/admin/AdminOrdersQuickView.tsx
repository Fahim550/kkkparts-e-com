import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Edit,
  Layers,
  Package,
  Plus,
  Receipt,
  Search,
  ShoppingCart,
  Store,
  Truck,
  User,
  UserCheck,
  XCircle,
} from "lucide-react";
import { EditOrderDialog } from "@/components/admin/EditOrderDialog";

export interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  size?: string;
  color?: string;
}

export interface DashboardOrder {
  id: string;
  order_number: string;
  status: string;
  created_at: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  customer_group?: string;
  shipping_address?: string;
  total: number;
  type?: "sales_order" | "pos_receipt" | string;
  salesman_id?: string;
  salesman_name?: string;
  order_source?: string;
  items?: OrderItem[];
}

interface AdminOrdersQuickViewProps {
  orders: DashboardOrder[];
  isLoading?: boolean;
  portalType?: "admin" | "salesman";
}

const DEFAULT_PAGE_SIZE = 10;

export const AdminOrdersQuickView = ({
  orders = [],
  isLoading = false,
  portalType = "admin",
}: AdminOrdersQuickViewProps) => {
  // Session start time recorded when dashboard is opened
  const [sessionStartTime] = useState<Date>(() => {
    try {
      const stored = sessionStorage.getItem("admin_session_start_time");
      if (stored) return new Date(stored);
      const now = new Date();
      sessionStorage.setItem("admin_session_start_time", now.toISOString());
      return now;
    } catch {
      return new Date();
    }
  });

  const [activeTab, setActiveTab] = useState<"today" | "customer" | "dealer" | "session" | "all">("today");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSalesman, setSelectedSalesman] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);

  // Available unique salesmen in current orders list
  const availableSalesmen = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      if (o.salesman_name) names.add(o.salesman_name);
    });
    return Array.from(names).sort();
  }, [orders]);

  // Helper date checkers
  const isToday = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  };

  const isSession = (dateStr?: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d.getTime() >= sessionStartTime.getTime() - 60000;
  };

  // Metrics for Today
  const todayMetrics = useMemo(() => {
    let count = 0;
    let customerCount = 0;
    let dealerCount = 0;
    let totalRevenue = 0;

    orders.forEach((o) => {
      if (isToday(o.created_at)) {
        count++;
        const amt = Number(o.total || 0);
        totalRevenue += amt;
        if (o.customer_group === "Dealer") {
          dealerCount++;
        } else {
          customerCount++;
        }
      }
    });

    return {
      count,
      customerCount,
      dealerCount,
      totalRevenue,
    };
  }, [orders]);

  // Session count
  const sessionOrdersCount = useMemo(() => {
    return orders.filter((o) => isSession(o.created_at)).length;
  }, [orders, sessionStartTime]);

  // Filtered orders list based on active tab and search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Tab filter
      if (activeTab === "today") {
        if (!isToday(o.created_at)) return false;
      } else if (activeTab === "customer") {
        if (!isToday(o.created_at) || o.customer_group === "Dealer") return false;
      } else if (activeTab === "dealer") {
        if (!isToday(o.created_at) || o.customer_group !== "Dealer") return false;
      } else if (activeTab === "session") {
        if (!isSession(o.created_at)) return false;
      }
      // "all" shows all orders

      // 2. Salesman filter
      if (selectedSalesman !== "all") {
        if (o.salesman_name !== selectedSalesman) return false;
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesNumber = o.order_number?.toLowerCase().includes(q);
        const matchesName = o.customer_name?.toLowerCase().includes(q);
        const matchesPhone = o.customer_phone?.toLowerCase().includes(q);
        const matchesEmail = o.customer_email?.toLowerCase().includes(q);
        const matchesSalesman = o.salesman_name?.toLowerCase().includes(q);
        if (!matchesNumber && !matchesName && !matchesPhone && !matchesEmail && !matchesSalesman) {
          return false;
        }
      }

      return true;
    });
  }, [orders, activeTab, searchQuery, selectedSalesman, sessionStartTime]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedOrders = useMemo(() => {
    const start = (validCurrentPage - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, validCurrentPage, pageSize]);

  // When tab or search changes, reset page to 1
  const handleTabChange = (tab: "today" | "customer" | "dealer" | "session" | "all") => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const isSalesmanPortal = portalType === "salesman";

  const getOrderLink = (order: DashboardOrder) => {
    if (isSalesmanPortal) {
      return `/salesman/orders`;
    }
    if (order.type === "pos_receipt") {
      return `/admin/pos/receipt/${order.id}`;
    }
    if (order.customer_group === "Dealer") {
      return `/admin/dealer-orders/${order.id}`;
    }
    return `/admin/orders/${order.id}`;
  };

  const getStatusBadge = (status?: string) => {
    const s = (status || "pending").toLowerCase();
    switch (s) {
      case "confirmed":
        return {
          label: "Confirmed",
          cls: "bg-blue-50 text-blue-700 border-blue-200",
          icon: CheckCircle2,
        };
      case "shipped":
        return {
          label: "Shipped",
          cls: "bg-indigo-50 text-indigo-700 border-indigo-200",
          icon: Truck,
        };
      case "delivered":
      case "paid":
        return {
          label: s === "paid" ? "Paid" : "Delivered",
          cls: "bg-emerald-50 text-emerald-700 border-emerald-200",
          icon: CheckCircle2,
        };
      case "partial":
        return {
          label: "Partial",
          cls: "bg-amber-50 text-amber-700 border-amber-200",
          icon: Clock,
        };
      case "cancelled":
      case "unpaid":
        return {
          label: s === "unpaid" ? "Unpaid" : "Cancelled",
          cls: "bg-rose-50 text-rose-700 border-rose-200",
          icon: XCircle,
        };
      case "pending":
      default:
        return {
          label: "Pending",
          cls: "bg-amber-50 text-amber-800 border-amber-200",
          icon: Clock,
        };
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-full min-w-0 bg-white border-b border-gray-200 overflow-hidden">
      {/* Top Header & Metrics Section */}
      <div className="p-4 sm:p-5 border-b border-gray-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Title & Live Status */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                <ShoppingCart className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="text-gray-900 text-base font-bold">
                Today&apos;s Orders Quick View
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Session Active
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live activity of retail customer &amp; wholesale dealer orders
            </p>
          </div>

          {/* Quick Metrics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="p-2 px-3 bg-slate-50 border border-gray-200/80 rounded-lg min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-gray-400 block truncate">
                Today&apos;s Orders
              </span>
              <span className="text-sm font-bold text-gray-900">
                {todayMetrics.count}
              </span>
            </div>
            <div className="p-2 px-3 bg-blue-50/60 border border-blue-100 rounded-lg min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-blue-500 block truncate">
                Customers
              </span>
              <span className="text-sm font-bold text-blue-700">
                {todayMetrics.customerCount}
              </span>
            </div>
            <div className="p-2 px-3 bg-purple-50/60 border border-purple-100 rounded-lg min-w-[90px]">
              <span className="text-[10px] uppercase font-bold text-purple-500 block truncate">
                Dealers
              </span>
              <span className="text-sm font-bold text-purple-700">
                {todayMetrics.dealerCount}
              </span>
            </div>
            <div className="p-2 px-3 bg-emerald-50/60 border border-emerald-100 rounded-lg min-w-[100px]">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block truncate">
                Today&apos;s Value
              </span>
              <span className="text-sm font-bold text-emerald-700 truncate block">
                OMR {todayMetrics.totalRevenue.toFixed(3)}
              </span>
            </div>
          </div>
        </div>

        {/* Filter Tabs & Search Row */}
        <div className="mt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-3 border-t border-gray-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-lg flex-wrap">
            <button
              onClick={() => handleTabChange("today")}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === "today"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-gray-900 font-medium"
              }`}
            >
              Today&apos;s Orders
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "today"
                    ? "bg-blue-100 text-blue-800 font-bold"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {todayMetrics.count}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("customer")}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === "customer"
                  ? "bg-white text-blue-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-blue-600 font-medium"
              }`}
            >
              Customers Today
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "customer"
                    ? "bg-blue-100 text-blue-800 font-bold"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {todayMetrics.customerCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("dealer")}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === "dealer"
                  ? "bg-white text-purple-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-purple-600 font-medium"
              }`}
            >
              Dealers Today
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "dealer"
                    ? "bg-purple-100 text-purple-800 font-bold"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {todayMetrics.dealerCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("session")}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === "session"
                  ? "bg-white text-emerald-700 shadow-2xs font-semibold"
                  : "text-gray-600 hover:text-emerald-600 font-medium"
              }`}
            >
              This Session
              <span
                className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "session"
                    ? "bg-emerald-100 text-emerald-800 font-bold"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {sessionOrdersCount}
              </span>
            </button>
            <button
              onClick={() => handleTabChange("all")}
              className={`px-2.5 py-1 text-xs rounded-md transition-all ${
                activeTab === "all"
                  ? "bg-white text-gray-900 shadow-2xs font-semibold"
                  : "text-gray-500 hover:text-gray-800 font-medium"
              }`}
            >
              All History
              <span
                className={`ml-1 px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === "all"
                    ? "bg-slate-200 text-gray-800 font-bold"
                    : "bg-gray-200/70 text-gray-600"
                }`}
              >
                {orders.length}
              </span>
            </button>
          </div>

          {/* Quick Search & Salesman Filter */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {availableSalesmen.length > 0 && !isSalesmanPortal && (
              <div className="relative sm:w-40 shrink-0">
                <select
                  value={selectedSalesman}
                  onChange={(e) => {
                    setSelectedSalesman(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500 transition font-medium"
                >
                  <option value="all">All Sales Reps</option>
                  {availableSalesmen.map((name) => (
                    <option key={name} value={name}>
                      👤 {name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="relative sm:w-52 shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Search orders, rep..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg text-gray-900 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Table Container (Guaranteed constrained - never overflows parent) */}
      <div className="w-full max-w-full min-w-0 overflow-x-auto">
        <table className="w-full min-w-[620px] text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-slate-50/80 border-b border-gray-200/80 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
              <th className="py-2.5 px-4 w-[110px]">Time</th>
              <th className="py-2.5 px-3 w-[150px]">Order #</th>
              <th className="py-2.5 px-3 w-[180px]">Customer / Dealer</th>
              <th className="py-2.5 px-3 w-[90px]">Type</th>
              <th className="py-2.5 px-3 w-[80px]">Items</th>
              <th className="py-2.5 px-3 w-[120px] text-right">Total</th>
              <th className="py-2.5 px-3 w-[100px] text-center">Status</th>
              <th className="py-2.5 px-4 w-[80px] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-3 px-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-28" /></td>
                  <td className="py-3 px-3"><div className="h-5 bg-gray-200 rounded-full w-14" /></td>
                  <td className="py-3 px-3"><div className="h-4 bg-gray-200 rounded w-12" /></td>
                  <td className="py-3 px-3 text-right"><div className="h-4 bg-gray-200 rounded w-16 ml-auto" /></td>
                  <td className="py-3 px-3"><div className="h-5 bg-gray-200 rounded-full w-16 mx-auto" /></td>
                  <td className="py-3 px-4 text-right"><div className="h-6 bg-gray-200 rounded w-10 ml-auto" /></td>
                </tr>
              ))
            ) : paginatedOrders.length > 0 ? (
              paginatedOrders.map((order) => {
                const isDealer = order.customer_group === "Dealer";
                const isPos = order.type === "pos_receipt";
                const statusMeta = getStatusBadge(order.status);
                const itemsCount = (order.items || []).reduce(
                  (sum, item) => sum + Number(item.quantity || 1),
                  0
                );
                const orderLink = getOrderLink(order);

                return (
                  <tr
                    key={order.id}
                    className="hover:bg-slate-50/70 transition-colors group"
                  >
                    {/* Time / Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-gray-900 leading-tight">
                        {formatTime(order.created_at) || "Today"}
                      </div>
                      <span className="text-[10px] text-gray-400">
                        {formatDate(order.created_at)}
                      </span>
                    </td>

                    {/* Order # */}
                    <td className="py-3 px-3 truncate">
                      <div className="flex items-center gap-1.5 truncate">
                        <Link
                          to={orderLink}
                          className="font-bold text-gray-900 group-hover:text-blue-600 transition hover:underline truncate"
                          title={order.order_number || order.id}
                        >
                          {order.order_number || order.id.slice(0, 8)}
                        </Link>
                        {isPos && (
                          <span
                            title="Point of Sale Receipt"
                            className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-semibold bg-gray-100 text-gray-600 border border-gray-200 shrink-0"
                          >
                            POS
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Customer / Dealer */}
                    <td className="py-3 px-3 truncate">
                      <div className="font-semibold text-gray-800 truncate" title={order.customer_name}>
                        {order.customer_name || "Walk-in Customer"}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">
                        {order.customer_phone || order.customer_email || "No contact"}
                      </div>
                      {order.salesman_name && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <span
                            title="Salesman / Booked By"
                            className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200"
                          >
                            <UserCheck className="w-2.5 h-2.5 text-amber-600" />
                            <span className="truncate max-w-[100px]">{order.salesman_name}</span>
                          </span>
                          {order.order_source === "field_marketing" && (
                            <span
                              title="Field Marketing Order"
                              className="inline-flex items-center px-1 py-0.2 rounded text-[9px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0"
                            >
                              Field
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Type Badge */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      {isDealer ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Store className="w-2.5 h-2.5 text-purple-600" />
                          Dealer
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <User className="w-2.5 h-2.5 text-blue-600" />
                          Customer
                        </span>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-medium text-gray-700">
                        {itemsCount > 0 ? `${itemsCount} item${itemsCount > 1 ? "s" : ""}` : "1 item"}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                      OMR {Number(order.total || 0).toFixed(3)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusMeta.cls}`}
                      >
                        {statusMeta.label}
                      </span>
                    </td>

                    {/* Actions: Edit and View */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <EditOrderDialog
                          order={order}
                          trigger={
                            <button
                              className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 border border-slate-200 transition"
                              title="Edit Order"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </button>
                          }
                        />
                        <Link
                          to={orderLink}
                          className="inline-flex items-center gap-0.5 px-2 py-1 rounded text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition"
                        >
                          <Eye className="w-3 h-3" />
                          <span>View</span>
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-400 max-w-sm mx-auto">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 border border-emerald-100">
                      <Activity className="w-5 h-5 animate-pulse" />
                    </div>
                    <p className="text-xs font-bold text-gray-800">
                      {activeTab === "today"
                        ? "No orders received today yet"
                        : activeTab === "session"
                        ? "No orders received in this session yet"
                        : "No matching orders found"}
                    </p>
                    <p className="text-[11px] text-gray-500 mt-0.5 mb-3 leading-relaxed">
                      {activeTab === "today"
                        ? "Incoming orders placed today will appear here in real-time."
                        : "Try selecting a different filter tab or checking order history."}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTabChange("all")}
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                      >
                        Browse All History
                      </button>
                      <Link
                        to="/admin/sales/new"
                        className="text-xs font-semibold px-3 py-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
                      >
                        + Create Sale
                      </Link>
                    </div>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Bar: Pagination + Manager Links */}
      <div className="p-3 px-4 sm:px-5 bg-slate-50/60 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs">
        {/* Count & Pagination Controls */}
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-gray-500">
            Showing{" "}
            <span className="font-semibold text-gray-800">
              {filteredOrders.length > 0 ? (validCurrentPage - 1) * pageSize + 1 : 0}
              -
              {Math.min(validCurrentPage * pageSize, filteredOrders.length)}
            </span>{" "}
            of{" "}
            <span className="font-semibold text-gray-800">
              {filteredOrders.length}
            </span>{" "}
            orders
          </span>

          {/* Page size dropdown */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <span>Show:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-xs text-gray-700 outline-none focus:border-blue-400 font-medium"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="p-1 rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="text-[11px] font-medium text-gray-600 px-1">
                {validCurrentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="p-1 rounded border border-gray-200 bg-white text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
                title="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Direct Links to Full Managers */}
        {isSalesmanPortal ? (
          <div className="flex items-center gap-3">
            <Link
              to="/salesman/orders"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              Field Orders Log <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/admin/orders"
              className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              Customer Orders <ArrowRight className="w-3 h-3" />
            </Link>
            <span className="text-gray-300">|</span>
            <Link
              to="/admin/dealer-orders"
              className="text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-1 hover:underline"
            >
              Dealer Orders <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
