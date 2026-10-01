import React, { useMemo, useState } from "react";
import {
  useOrders,
  useUpdateOrderStatus,
  useDeleteOrder,
} from "@/hooks/useDatabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import {
  printCourierSlip,
  printInvoice,
} from "@/components/admin/InvoicePrint";
import { FieldOrderDialog } from "@/components/admin/FieldOrderDialog";
import { EditOrderDialog } from "@/components/admin/EditOrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Search,
  Printer,
  Truck,
  Eye,
  Store,
  Clock,
  CheckCircle2,
  AlertCircle,
  Package,
  Calendar,
  UserCheck,
  Phone,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200",
  shipped: "bg-purple-50 text-purple-700 border-purple-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  unpaid: "bg-rose-50 text-rose-700 border-rose-200",
};

const statuses = [
  "pending",
  "confirmed",
  "shipped",
  "delivered",
  "cancelled",
];

export const SalesmanOrdersView: React.FC = () => {
  const { data: orders = [], isLoading } = useOrders();
  const { customers = [] } = useCustomers();
  const updateStatus = useUpdateOrderStatus();
  const { user, isAdmin } = useAdminAuth();

  const [statusFilter, setStatusFilter] = useState("all");
  const [scopeFilter, setScopeFilter] = useState<"my" | "all">("my");
  const [searchTerm, setSearchTerm] = useState("");

  const repName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "";
  const repUserId = user?.id || "";

  // Customers assigned to or touched by this salesman
  const myCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    const normalizedRep = repName.toLowerCase().trim();

    (customers || []).forEach((c: any) => {
      if (c.salesman_id && repUserId && c.salesman_id === repUserId) {
        ids.add(c.id);
      }
    });

    (orders || []).forEach((o: any) => {
      const matchId = o.salesman_id && repUserId && o.salesman_id === repUserId;
      const matchName =
        o.salesman_name &&
        normalizedRep &&
        o.salesman_name.toLowerCase().trim() === normalizedRep;
      const isField = o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-");
      if ((matchId || matchName || isField) && o.customer_id) {
        ids.add(o.customer_id);
      }
    });

    // Always include Dealer shops with field marketing orders
    (customers || []).forEach((c: any) => {
      if (c.customer_group === "Dealer") {
        const hasFieldOrder = (orders || []).some(
          (o: any) => o.customer_id === c.id && (o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-"))
        );
        if (hasFieldOrder && (!c.salesman_id || c.salesman_id === repUserId)) {
          ids.add(c.id);
        }
      }
    });

    try {
      const cache = JSON.parse(localStorage.getItem("salesman_orders_cache") || "{}");
      Object.values(cache).forEach((entry: any) => {
        if (entry?.customer_id) ids.add(entry.customer_id);
      });
    } catch {}

    return ids;
  }, [customers, orders, repUserId, repName]);

  // Helper to check if an order was booked by or assigned to this salesman or their client shops
  const isMyOrder = (o: any) => {
    // Strictly Field Marketing orders only
    const isField = o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-");
    if (!isField) return false;

    // 1. Direct assignment via salesman_id or salesman_name
    if (o.salesman_id && repUserId && o.salesman_id === repUserId) return true;
    if (
      o.salesman_name &&
      repName &&
      o.salesman_name.toLowerCase().trim() === repName.toLowerCase().trim()
    ) {
      return true;
    }
    // 2. Field orders belonging to this salesman's shops or unassigned field bookings
    const isMyCustomer = o.customer_id && myCustomerIds.has(o.customer_id);
    if (isMyCustomer) return true;
    if (!o.salesman_id || o.salesman_id === repUserId) return true;
    return false;
  };

  // Base list: For field marketing officers / salesmen, strictly isolate to field marketing orders.
  // Admins can toggle between 'my' and 'all' (all field marketing orders).
  const baseOrders = useMemo(() => {
    const fieldOnlyOrders = orders.filter(
      (o: any) => o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-")
    );
    if (!isAdmin) {
      return fieldOnlyOrders.filter(isMyOrder);
    }
    if (scopeFilter === "my") {
      return fieldOnlyOrders.filter(isMyOrder);
    }
    return fieldOnlyOrders;
  }, [orders, isAdmin, scopeFilter, repUserId, repName, isMyOrder]);

  // Scoped & filtered orders
  const scopedOrders = useMemo(() => {
    let list = baseOrders;

    if (statusFilter !== "all") {
      list = list.filter((o) => (o.status || "").toLowerCase() === statusFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (o) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.shipping_address?.toLowerCase().includes(q) ||
          o.contact_phone?.includes(q)
      );
    }

    return list;
  }, [baseOrders, statusFilter, searchTerm]);

  // Aggregate metrics: strictly calculated from the representative's scoped base orders
  const stats = useMemo(() => {
    const totalCount = baseOrders.length;
    const totalVolume = baseOrders.reduce(
      (sum, o) => sum + Number(o.total || o.total_amount || 0),
      0
    );
    const deliveredCount = baseOrders.filter((o) => (o.status || "").toLowerCase() === "delivered").length;
    const pendingCount = baseOrders.filter((o) => (o.status || "").toLowerCase() === "pending").length;

    return { totalCount, totalVolume, deliveredCount, pendingCount };
  }, [baseOrders]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleExportCSV = () => {
    if (scopedOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order Number", "Date", "Customer", "Items Count", "Total (OMR)", "Status", "Sales Rep"];
    const rows = scopedOrders.map((o) => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString("en-GB"),
      o.customer_name || "Walk-in Shop",
      ((o.items as any[]) || []).length,
      Number(o.total || o.total_amount || 0).toFixed(3),
      o.status,
      o.salesman_name || "Field Rep",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Field_Orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders list exported to CSV");
  };

  return (
    <div className="flex-1 bg-slate-50 font-body p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header and Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-blue-600" />
            <span>Field & Shop Orders</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Book new customer orders on the go, track delivery status, and print vouchers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="text-xs font-semibold gap-1.5 h-9 bg-white"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Export CSV</span>
          </Button>

          <FieldOrderDialog
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm">
                <Store className="w-3.5 h-3.5" />
                <span>+ Take Field Order</span>
              </Button>
            }
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Orders</span>
            <Package className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.totalCount}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Recorded bookings</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Sales Volume</span>
            <Store className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            OMR {stats.totalVolume.toFixed(3)}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Gross order value</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Delivered / Closed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {stats.deliveredCount}
          </div>
          <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Successfully fulfilled</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Dispatch</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">
            {stats.pendingCount}
          </div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting delivery</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search order #, customer, or phone..."
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {isAdmin ? (
            <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setScopeFilter("my")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  scopeFilter === "my"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Orders
              </button>
              <button
                onClick={() => setScopeFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  scopeFilter === "all"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Store Orders ({orders.length})
              </button>
            </div>
          ) : (
            <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold shrink-0 border border-blue-100 flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>My Orders ({baseOrders.length})</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All
            </button>
            {statuses.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border uppercase tracking-wider transition-all ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading orders...
        </div>
      ) : scopedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Orders Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
            {searchTerm
              ? "No orders match your search criteria. Try a different query."
              : "No field orders have been recorded in this category yet."}
          </p>
          <FieldOrderDialog
            trigger={
              <Button className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold">
                <Store className="w-3.5 h-3.5 mr-1.5" />
                <span>Take First Field Order</span>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="space-y-3.5">
          {scopedOrders.map((order) => {
            const items = (order.items as any[]) || [];
            const isField = order.order_source === "field_marketing";

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Order Primary Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span className="font-mono text-sm font-black text-slate-900 tracking-tight">
                      {order.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        statusColors[order.status] || "bg-slate-100 text-slate-700 border-slate-200"
                      }`}
                    >
                      {order.status}
                    </span>
                    {isField && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Field Marketing
                      </span>
                    )}
                    {order.salesman_name && (
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-blue-600" />
                        <span>Rep: {order.salesman_name}</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                    <span className="font-semibold text-slate-900">
                      {order.customer_name || "Shop / Client"}
                    </span>
                    {order.contact_phone && (
                      <span className="text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{order.contact_phone}</span>
                      </span>
                    )}
                    <span className="text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(order.created_at).toLocaleDateString("en-GB")}</span>
                    </span>
                  </div>

                  {/* Order Items Preview */}
                  <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                    {items.slice(0, 3).map((item, idx) => (
                      <span key={idx} className="truncate max-w-xs font-medium">
                        • {item.quantity_ordered || item.quantity || 1}x {item.name || item.product_name || "Part"}
                      </span>
                    ))}
                    {items.length > 3 && (
                      <span className="text-blue-600 font-semibold text-[11px]">
                        +{items.length - 3} more items
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount and Actions */}
                <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="text-left md:text-right">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Amount
                    </div>
                    <div className="text-lg font-black text-slate-900">
                      OMR {Number(order.total || order.total_amount || 0).toFixed(3)}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <EditOrderDialog order={order} />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printInvoice(order)}
                      className="text-xs h-8 px-2.5 gap-1 text-slate-700 bg-white"
                      title="Print Customer Invoice"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Invoice</span>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => printCourierSlip(order)}
                      className="text-xs h-8 px-2.5 gap-1 text-slate-700 bg-white"
                      title="Print Delivery Slip"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Slip</span>
                    </Button>

                    {/* Quick status dropdown */}
                    <select
                      value={order.status}
                      onChange={(e) => handleStatusChange(order.id, e.target.value)}
                      className="h-8 px-2 border border-slate-200 rounded-md text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SalesmanOrdersView;
