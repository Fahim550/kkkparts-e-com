import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useDatabase";
import { useCustomerDues, useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BadgeDollarSign,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Eye,
  FileSpreadsheet,
  MapPin,
  Package,
  Phone,
  Printer,
  Search,
  ShoppingCart,
  Store,
  TrendingUp,
  Truck,
  User as UserIcon,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { printInvoice, printCourierSlip } from "@/components/admin/InvoicePrint";
import { EditOrderDialog } from "@/components/admin/EditOrderDialog";

// ─── Types ─────────────────────────────────────────────────
interface SalesmanProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string | null;
  roles: string[];
}

// ─── Status colors ────────────────────────────────────────
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

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

// ─── Main Component ───────────────────────────────────────
const FieldMarketersPage = () => {
  const { data: allOrders = [], isLoading: loadingOrders } = useOrders();
  const { customers = [] } = useCustomers();
  const { data: customerDueMap = {} } = useCustomerDues();
  const { data: trialBalance = [] } = useTrialBalance();
  const updateStatus = useUpdateOrderStatus();

  const [selectedSalesman, setSelectedSalesman] = useState<SalesmanProfile | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [detailTab, setDetailTab] = useState<"orders" | "shops">("orders");

  // ─── Fetch all ERP staff who are salesmen ─────────────
  const { data: salesmen = [], isLoading: loadingSalesmen } = useQuery<SalesmanProfile[]>({
    queryKey: ["field_marketers_list"],
    queryFn: async () => {
      try {
        // Get all users with Salesman/Sales role
        const { data: userRolesData } = await supabase
          .from("erp_user_roles")
          .select("user_id, role_id, erp_roles(id, name)");

        // Build a map of userId -> roles
        const rolesByUserId = new Map<string, string[]>();
        const salesUserIds = new Set<string>();
        if (userRolesData) {
          for (const item of userRolesData as any[]) {
            const roleName = item.erp_roles?.name || "";
            const current = rolesByUserId.get(item.user_id) || [];
            current.push(roleName);
            rolesByUserId.set(item.user_id, current);

            const lower = roleName.toLowerCase();
            if (lower === "sales" || lower === "salesman") {
              salesUserIds.add(item.user_id);
            }
          }
        }

        // Fetch ERP users
        const { data: erpUsersData } = await supabase
          .from("erp_users")
          .select("*")
          .order("created_at", { ascending: false });

        if (!erpUsersData) return [];

        // Also collect unique salesman_ids from orders that may not be in erp_users
        const orderSalesmanIds = new Set<string>();
        (allOrders || []).forEach((o: any) => {
          if (o.salesman_id) orderSalesmanIds.add(o.salesman_id);
        });

        const result: SalesmanProfile[] = [];

        for (const u of erpUsersData) {
          const userRoles = rolesByUserId.get(u.id) || [];
          const isSalesRole = salesUserIds.has(u.id);

          // List users who have the Sales role
          // If no staff has sales role assigned, fallback to non-admin staff
          const isAdminOnly = userRoles.some((r) => r.toLowerCase() === "admin") && !isSalesRole;
          if (isSalesRole || (salesUserIds.size === 0 && !isAdminOnly)) {
            const rawEmail = u.email || "";
            const isPhoneAuth = rawEmail.endsWith("@staff.local") || rawEmail.endsWith("@dealer.local");

            result.push({
              id: u.id,
              full_name: u.full_name || "Unknown",
              email: isPhoneAuth ? null : u.email,
              phone: isPhoneAuth ? rawEmail.split("@")[0] : null,
              is_active: u.is_active ?? true,
              created_at: u.created_at,
              roles: userRoles.length > 0 ? userRoles : ["Salesman"],
            });
          }
        }

        return result;
      } catch (err) {
        console.error("Error fetching field marketers:", err);
        return [];
      }
    },
  });

  // ─── Helper: Resolve customer IDs belonging to a salesman ────────
  const getSalesmanCustomerIds = (sm: { id: string; full_name?: string | null }) => {
    const ids = new Set<string>();
    const normalizedName = (sm.full_name || "").toLowerCase().trim();

    // Identify registered salesmen other than this one (only real sales reps, never admins)
    const otherSalesmen = salesmen.filter(
      (s) => s.id !== sm.id && s.roles.some((r) => r.toLowerCase().includes("sales"))
    );
    const otherSalesmenIds = new Set(otherSalesmen.map((s) => s.id));
    const otherSalesmenNames = new Set(
      otherSalesmen
        .map((s) => (s.full_name || "").toLowerCase().trim())
        .filter(Boolean)
    );

    // 1. Direct assignment in customers table
    (customers || []).forEach((c: any) => {
      if (c.salesman_id && c.salesman_id === sm.id) {
        ids.add(c.id);
      }
      if (c.salesman_name && c.salesman_name.toLowerCase().trim() === normalizedName) {
        ids.add(c.id);
      }
    });

    // 2. Customers touched by salesman's direct orders
    (allOrders || []).forEach((o: any) => {
      const matchId = o.salesman_id && o.salesman_id === sm.id;
      const matchName = o.salesman_name && normalizedName && o.salesman_name.toLowerCase().trim() === normalizedName;
      if ((matchId || matchName) && o.customer_id) {
        ids.add(o.customer_id);
      }
    });

    // 3. Customers from local cache where salesman booked field orders or created shops
    try {
      const cache = JSON.parse(localStorage.getItem("salesman_orders_cache") || "{}");
      Object.values(cache).forEach((entry: any) => {
        if (entry?.customer_id) {
          const entrySmId = entry.salesman_id;
          const entrySmName = (entry.salesman_name || "").toLowerCase().trim();
          const isNotOther = !otherSalesmenIds.has(entrySmId) && !otherSalesmenNames.has(entrySmName);
          if (isNotOther) {
            ids.add(entry.customer_id);
          }
        }
      });
    } catch {}

    // 4. Any customer associated with a field marketing order (SO-FLD-) not claimed by another registered salesman
    (allOrders || []).forEach((o: any) => {
      const isField = o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-");
      const isNotOtherSalesman = !otherSalesmenIds.has(o.salesman_id) && !otherSalesmenNames.has((o.salesman_name || "").toLowerCase().trim());
      if (isField && isNotOtherSalesman && o.customer_id) {
        const cust = (customers || []).find((c: any) => c.id === o.customer_id);
        const custNotOther = !otherSalesmenIds.has(cust?.salesman_id);
        if (custNotOther) {
          ids.add(o.customer_id);
        }
      }
    });

    // 5. Always include Dealer shops (e.g. Test Field Shop, Al Baraka Auto Spares) that have field marketing orders
    (customers || []).forEach((c: any) => {
      if (c.customer_group === "Dealer") {
        const hasFieldOrder = (allOrders || []).some(
          (o: any) => o.customer_id === c.id && (o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-"))
        );
        if (hasFieldOrder && (!c.salesman_id || c.salesman_id === sm.id || !otherSalesmenIds.has(c.salesman_id))) {
          ids.add(c.id);
        }
      }
    });

    return ids;
  };

  // ─── Helper: Filter orders belonging to a salesman ───────────────
  const getSalesmanOrders = (sm: { id: string; full_name?: string | null }, myCustomerIds: Set<string>) => {
    const normalizedName = (sm.full_name || "").toLowerCase().trim();

    const otherSalesmen = salesmen.filter(
      (s) => s.id !== sm.id && s.roles.some((r) => r.toLowerCase().includes("sales"))
    );
    const otherSalesmenIds = new Set(otherSalesmen.map((s) => s.id));
    const otherSalesmenNames = new Set(
      otherSalesmen
        .map((s) => (s.full_name || "").toLowerCase().trim())
        .filter(Boolean)
    );

    return (allOrders || []).filter((o: any) => {
      // Exclude if explicitly claimed by another distinct registered salesman
      if (o.salesman_id && otherSalesmenIds.has(o.salesman_id)) return false;
      if (o.salesman_name && otherSalesmenNames.has(o.salesman_name.toLowerCase().trim())) return false;

      // Strictly field marketing orders only
      const isField = o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-");
      if (!isField) return false;

      // 1. Direct assignment via salesman_id
      if (o.salesman_id && o.salesman_id === sm.id) return true;

      // 2. Match by salesman_name
      if (o.salesman_name && normalizedName && o.salesman_name.toLowerCase().trim() === normalizedName) return true;

      // 3. Field orders belonging to client shops in this salesman's territory or unassigned field bookings
      const isMyCustomer = o.customer_id && myCustomerIds.has(o.customer_id);
      if (isMyCustomer) return true;
      if (!o.salesman_id || o.salesman_id === sm.id || !otherSalesmenIds.has(o.salesman_id)) return true;

      return false;
    });
  };

  // ─── Helper: Get shops belonging to a salesman with stats ────────
  const getSalesmanShops = (myCustomerIds: Set<string>, smOrders: any[]) => {
    return (customers || [])
      .filter((c: any) => myCustomerIds.has(c.id))
      .map((c: any) => {
        const shopOrders = smOrders.filter((o: any) => o.customer_id === c.id);
        const shopVolume = shopOrders.reduce((sum: number, o: any) => sum + Number(o.total || o.total_amount || 0), 0);
        const tbAccount = (trialBalance || []).find((t: any) => t.account_id === c.receivable_account_id);
        const tbBal = Number(tbAccount?.balance || 0);
        const txDue = Number(customerDueMap[c.id] || 0);
        const due = tbBal > 0 ? tbBal : txDue;

        return {
          ...c,
          totalOrders: shopOrders.length,
          totalVolume: shopVolume,
          due,
        };
      });
  };

  // ─── Compute salesman-level stats ────────────────────
  const salesmenWithStats = useMemo(() => {
    return salesmen.map((sm) => {
      const myCustomerIds = getSalesmanCustomerIds(sm);
      const smOrders = getSalesmanOrders(sm, myCustomerIds);
      const smShops = getSalesmanShops(myCustomerIds, smOrders);

      const totalOrders = smOrders.length;
      const totalRevenue = smOrders.reduce((sum: number, o: any) => sum + Number(o.total || o.total_amount || 0), 0);
      const pendingCount = smOrders.filter((o: any) => (o.status || "").toLowerCase() === "pending").length;
      const deliveredCount = smOrders.filter((o: any) => (o.status || "").toLowerCase() === "delivered").length;
      const fieldOrders = smOrders.filter((o: any) => o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-")).length;

      // Today's orders
      const now = new Date();
      const todayOrders = smOrders.filter((o: any) => {
        const d = new Date(o.created_at || new Date());
        return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
      const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + Number(o.total || o.total_amount || 0), 0);

      // Assigned client shops
      const assignedCustomers = smShops.length;

      return {
        ...sm,
        totalOrders,
        totalRevenue,
        pendingCount,
        deliveredCount,
        fieldOrders,
        todayOrders: todayOrders.length,
        todayRevenue,
        assignedCustomers,
      };
    });
  }, [salesmen, allOrders, customers, trialBalance, customerDueMap]);

  // ─── Filter salesmen list ────────────────────────────
  const filteredSalesmen = useMemo(() => {
    if (!searchTerm.trim()) return salesmenWithStats;
    const q = searchTerm.toLowerCase();
    return salesmenWithStats.filter(
      (sm) =>
        sm.full_name?.toLowerCase().includes(q) ||
        sm.email?.toLowerCase().includes(q) ||
        sm.phone?.includes(q)
    );
  }, [salesmenWithStats, searchTerm]);

  // ─── Global KPIs ────────────────────────────────────
  const globalStats = useMemo(() => {
    const totalSalesmen = salesmenWithStats.length;
    const activeSalesmen = salesmenWithStats.filter((s) => s.is_active).length;
    const totalFieldOrders = salesmenWithStats.reduce((sum, s) => sum + s.fieldOrders, 0);
    const totalRevenue = salesmenWithStats.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalPending = salesmenWithStats.reduce((sum, s) => sum + s.pendingCount, 0);
    return { totalSalesmen, activeSalesmen, totalFieldOrders, totalRevenue, totalPending };
  }, [salesmenWithStats]);

  // ─── Selected salesman's customer IDs, orders & shops ─────
  const selectedSalesmanCustomerIds = useMemo(() => {
    if (!selectedSalesman) return new Set<string>();
    return getSalesmanCustomerIds(selectedSalesman);
  }, [selectedSalesman, customers, allOrders, salesmen]);

  const selectedSalesmanOrders = useMemo(() => {
    if (!selectedSalesman) return [];
    let orders = getSalesmanOrders(selectedSalesman, selectedSalesmanCustomerIds);

    if (orderStatusFilter === "all") {
      orders = orders.filter((o: any) => (o.status || "").toLowerCase() !== "delivered");
    } else {
      orders = orders.filter((o: any) => (o.status || "").toLowerCase() === orderStatusFilter.toLowerCase());
    }

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      orders = orders.filter(
        (o: any) =>
          o.order_number?.toLowerCase().includes(q) ||
          o.customer_name?.toLowerCase().includes(q) ||
          o.contact_phone?.includes(q)
      );
    }

    return orders;
  }, [allOrders, selectedSalesman, selectedSalesmanCustomerIds, orderStatusFilter, orderSearch]);

  const selectedSalesmanShops = useMemo(() => {
    if (!selectedSalesman) return [];
    const allSmOrders = getSalesmanOrders(selectedSalesman, selectedSalesmanCustomerIds);
    return getSalesmanShops(selectedSalesmanCustomerIds, allSmOrders);
  }, [selectedSalesman, selectedSalesmanCustomerIds, allOrders, customers, trialBalance, customerDueMap]);

  // ─── Status change handler ──────────────────────────
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateStatus.mutateAsync({ id, status: newStatus });
      toast.success(`Order status updated to ${newStatus}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  // ─── Export CSV ─────────────────────────────────────
  const handleExportOrders = () => {
    if (selectedSalesmanOrders.length === 0) {
      toast.error("No orders to export");
      return;
    }
    const headers = ["Order Number", "Date", "Customer", "Items", "Total (OMR)", "Status", "Source"];
    const rows = selectedSalesmanOrders.map((o: any) => [
      o.order_number,
      new Date(o.created_at).toLocaleDateString("en-GB"),
      o.customer_name || "Walk-in",
      ((o.items as any[]) || []).length,
      Number(o.total || o.total_amount || 0).toFixed(3),
      o.status,
      o.order_source || "admin",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any) => e.map((val: any) => `"${val}"`).join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `${selectedSalesman?.full_name || "Salesman"}_Orders_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Orders exported to CSV");
  };

  // ═══════════════════════════════════════════════════
  // RENDER: Salesman Detail View (Orders List)
  // ═══════════════════════════════════════════════════
  if (selectedSalesman) {
    const sm = salesmenWithStats.find((s) => s.id === selectedSalesman.id) || selectedSalesman as any;

    return (
      <div className="space-y-6">
        {/* Back + Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => { setSelectedSalesman(null); setOrderStatusFilter("all"); setOrderSearch(""); }} className="gap-1.5 text-xs font-semibold h-9">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600" />
                {sm.full_name || "Field Marketer"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-3">
                {sm.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{sm.phone}</span>}
                {sm.email && <span>{sm.email}</span>}
                <Badge variant={sm.is_active ? "default" : "secondary"} className={`text-[10px] ${sm.is_active ? "bg-emerald-100 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                  {sm.is_active ? "Active" : "Inactive"}
                </Badge>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleExportOrders} className="text-xs font-semibold gap-1.5 h-9 bg-white">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Salesman KPIs Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Orders</span>
              <Package className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{sm.totalOrders}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">All-time bookings</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Total Revenue</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-600 mt-1.5">OMR {sm.totalRevenue.toFixed(3)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Gross order value</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Client Shops</span>
              <Store className="w-4 h-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-black text-indigo-600 mt-1.5">{sm.assignedCustomers}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Assigned / visited</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Pending</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-600 mt-1.5">{sm.pendingCount}</div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting action</div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
              <span>Delivered</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1.5">{sm.deliveredCount}</div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">Fulfilled</div>
          </div>
        </div>

        {/* Tab Switcher: Orders vs Client Shops */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setDetailTab("orders")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              detailTab === "orders"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Orders ({sm.totalOrders})</span>
          </button>
          <button
            onClick={() => setDetailTab("shops")}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
              detailTab === "shops"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Client Shops ({sm.assignedCustomers})</span>
          </button>
        </div>

        {detailTab === "shops" ? (
          <div>
            {selectedSalesmanShops.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                  <Store className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-800">No Client Shops Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  This field marketer has no client shops registered or associated yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedSalesmanShops.map((shop: any) => (
                  <div
                    key={shop.id}
                    className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{shop.name}</h4>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {shop.customer_group || "Dealer"}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${shop.is_active ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-slate-100 text-slate-500 border border-slate-200"}`}>
                              {shop.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setOrderSearch(shop.name);
                          setDetailTab("orders");
                        }}
                        className="text-xs h-8 px-2.5 gap-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 border-blue-200 font-semibold"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Orders ({shop.totalOrders})</span>
                      </Button>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 my-3">
                      {shop.contact_phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{shop.contact_phone}</span>
                        </div>
                      )}
                      {shop.contact_email && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400 font-bold text-[10px]">@</span>
                          <span className="truncate">{shop.contact_email}</span>
                        </div>
                      )}
                      {(shop.billing_address || shop.shipping_address) && (
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{shop.billing_address || shop.shipping_address}</span>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500 font-medium">Orders Booked</div>
                        <div className="text-sm font-black text-slate-900 mt-0.5">{shop.totalOrders}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500 font-medium">Sales Volume</div>
                        <div className="text-sm font-black text-emerald-600 mt-0.5">OMR {Number(shop.totalVolume || 0).toFixed(3)}</div>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2 text-center">
                        <div className="text-[10px] text-slate-500 font-medium">Outstanding Due</div>
                        <div className={`text-sm font-black mt-0.5 ${Number(shop.due || 0) > 0 ? "text-rose-600" : "text-slate-700"}`}>
                          OMR {Number(shop.due || 0).toFixed(3)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Order Filters */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search order #, customer..."
                  className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
                />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setOrderStatusFilter("all")}
                  className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    orderStatusFilter === "all"
                      ? "bg-slate-900 text-white border-slate-900"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  All Orders ({Math.max(0, sm.totalOrders - sm.deliveredCount)})
                </button>
                {statuses.map((s) => (
                  <button
                    key={s}
                    onClick={() => setOrderStatusFilter(s)}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border uppercase tracking-wider transition-all ${
                      orderStatusFilter === s
                        ? s === "delivered"
                          ? "bg-emerald-600 text-white border-emerald-600"
                          : "bg-blue-600 text-white border-blue-600"
                        : s === "delivered"
                        ? "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100 font-semibold"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {s} {s === "delivered" ? `(${sm.deliveredCount})` : ""}
                  </button>
                ))}
              </div>
            </div>

        {/* Orders List */}
        {loadingOrders ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading orders...</div>
        ) : selectedSalesmanOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {orderStatusFilter === "delivered"
                ? "No Delivered Orders Found"
                : orderStatusFilter === "all"
                ? "No Active Orders Found"
                : "No Orders Found"}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {orderSearch
                ? "No orders match your search criteria."
                : orderStatusFilter === "all"
                ? "Delivered orders have been moved to the Delivered Orders tab."
                : "This field marketer has no orders in this category yet."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedSalesmanOrders.map((order: any) => {
              const items = (order.items as any[]) || [];
              const isField = order.order_source === "field_marketing";

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {/* Order Details */}
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
                      {order.type === "pos_receipt" && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">
                          POS
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-600 flex-wrap">
                      <span className="font-semibold text-slate-900">
                        {order.customer_name || "Walk-in"}
                      </span>
                      {order.customer_phone && (
                        <span className="text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          <span>{order.customer_phone}</span>
                        </span>
                      )}
                      <span className="text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(order.created_at).toLocaleDateString("en-GB")}</span>
                      </span>
                    </div>

                    {/* Items preview */}
                    <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2 border border-slate-100 flex flex-wrap gap-x-4 gap-y-1">
                      {items.slice(0, 3).map((item: any, idx: number) => (
                        <span key={idx} className="truncate max-w-xs font-medium">
                          • {item.quantity_ordered || item.quantity || 1}x {item.name || item.productName || "Part"}
                        </span>
                      ))}
                      {items.length > 3 && (
                        <span className="text-blue-600 font-semibold text-[11px]">+{items.length - 3} more</span>
                      )}
                      {items.length === 0 && <span className="text-slate-400 italic">No line items</span>}
                    </div>
                  </div>

                  {/* Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Amount</div>
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
                        title="Print Invoice"
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

                      {/* Status change dropdown */}
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
      )}
    </div>
  );
}

  // ═══════════════════════════════════════════════════
  // RENDER: Main Salesmen List View
  // ═══════════════════════════════════════════════════
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-600" />
            <span>Field Marketers Management</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor your sales representatives, view their orders, track performance &amp; manage order activations.
          </p>
        </div>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Salesmen</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{globalStats.totalSalesmen}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{globalStats.activeSalesmen} active</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Field Orders</span>
            <Store className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">{globalStats.totalFieldOrders}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Field marketing orders</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Revenue</span>
            <BadgeDollarSign className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">OMR {globalStats.totalRevenue.toFixed(3)}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Combined sales volume</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Pending Orders</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-2">{globalStats.totalPending}</div>
          <div className="text-[11px] text-amber-600 font-medium mt-0.5">Awaiting activation</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hidden lg:block">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Avg. Revenue</span>
            <TrendingUp className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 mt-2">
            OMR {globalStats.totalSalesmen > 0 ? (globalStats.totalRevenue / globalStats.totalSalesmen).toFixed(3) : "0.000"}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Per salesman average</div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search salesman by name, phone, email..."
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Salesmen Cards Grid */}
      {loadingSalesmen || loadingOrders ? (
        <div className="p-12 text-center text-slate-400 text-sm">Loading field marketers...</div>
      ) : filteredSalesmen.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Field Marketers Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchTerm
              ? "No salesmen match your search criteria."
              : "No salesmen are registered in the system yet. Add staff with the 'Salesman' role in Users & Staff page."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredSalesmen.map((sm) => (
            <div
              key={sm.id}
              className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all cursor-pointer group relative overflow-hidden"
              onClick={() => setSelectedSalesman(sm)}
            >
              {/* Active indicator bar */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${sm.is_active ? "bg-emerald-500" : "bg-slate-300"}`} />

              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3 pl-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 ring-2 ring-blue-100 group-hover:ring-blue-200 transition-all">
                    <UserIcon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm leading-tight truncate group-hover:text-blue-700 transition-colors">
                      {sm.full_name || "Unknown Salesman"}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {sm.roles.map((r, idx) => (
                        <span key={idx} className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                          {r}
                        </span>
                      ))}
                      <Badge variant={sm.is_active ? "default" : "secondary"} className={`text-[10px] h-4 ${sm.is_active ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50" : "bg-slate-100 text-slate-500 border-slate-200"}`}>
                        {sm.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </div>

              {/* Contact */}
              <div className="space-y-1 text-xs text-slate-600 mb-3 pl-2">
                {sm.phone && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium">{sm.phone}</span>
                  </div>
                )}
                {sm.email && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sm.email}</span>
                  </div>
                )}
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 mb-3 pl-2">
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                  <div className="text-lg font-black text-slate-900">{sm.totalOrders}</div>
                  <div className="text-[10px] text-slate-500 font-semibold">Orders</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                  <div className="text-lg font-black text-emerald-600">{sm.deliveredCount}</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Delivered</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2 border border-slate-100 text-center">
                  <div className="text-lg font-black text-amber-600">{sm.pendingCount}</div>
                  <div className="text-[10px] text-amber-600 font-semibold">Pending</div>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between pl-2">
                <div>
                  <div className="text-[11px] text-slate-500 font-medium">Total Revenue</div>
                  <div className="text-sm font-black text-slate-900">OMR {sm.totalRevenue.toFixed(3)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-medium">Today</div>
                  <div className="text-sm font-bold text-blue-600">
                    {sm.todayOrders} order{sm.todayOrders !== 1 ? "s" : ""}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-slate-500 font-medium">Shops</div>
                  <div className="text-sm font-bold text-indigo-600">{sm.assignedCustomers}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FieldMarketersPage;
