import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  Users,
  Building2,
  UserPlus,
  ArrowDown,
  Calendar,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  FileText,
  BadgeDollarSign,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrders } from "@/hooks/useDatabase";
import { useCustomers, useCustomerDues } from "@/modules/customer/presentation/hooks/useCustomers";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { FieldOrderDialog } from "@/components/admin/FieldOrderDialog";
import { CreateCustomerModal } from "@/components/admin/CreateCustomerModal";
import { AdminOrdersQuickView } from "@/components/admin/AdminOrdersQuickView";

interface SalesmanDashboardProps {
  salesmanId?: string;
  salesmanName?: string;
}

export const SalesmanDashboard: React.FC<SalesmanDashboardProps> = ({
  salesmanId: propSalesmanId,
  salesmanName: propSalesmanName,
}) => {
  const { user, isSalesman } = useAdminAuth();
  const { data: allOrders = [], isLoading: loadingOrders } = useOrders();
  const { customers = [] } = useCustomers();
  const { data: customerDueMap = {} } = useCustomerDues();
  const { data: trialBalance = [] } = useTrialBalance();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalType, setCreateModalType] = useState<"Retail" | "Dealer">("Dealer");

  // Determine current salesman identity
  const currentUserId = propSalesmanId || user?.id;
  const currentSalesmanName =
    propSalesmanName ||
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Sales Representative";
  const normalizedRepName = currentSalesmanName.toLowerCase();

  // Helper to check if an order belongs to this salesman
  const isMyOrder = (o: any) => {
    if (o.salesman_id && currentUserId && o.salesman_id === currentUserId) return true;
    if (o.salesman_name && o.salesman_name.toLowerCase() === normalizedRepName) return true;
    return false;
  };

  // Customers assigned to or touched by this salesman
  const myCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    customers.forEach((c: any) => {
      if (c.salesman_id && c.salesman_id === currentUserId) {
        ids.add(c.id);
      }
    });
    allOrders.forEach((o: any) => {
      if (isMyOrder(o) && o.customer_id) {
        ids.add(o.customer_id);
      }
    });
    return ids;
  }, [customers, allOrders, currentUserId, normalizedRepName]);

  // Receivables under this salesman's shops
  let regularReceivable = 0;
  let regularCount = 0;
  let dealerReceivable = 0;
  let dealerCount = 0;

  customers.forEach((c: any) => {
    // If we have scoped customers, only include those; otherwise fallback to showing shop dues
    const isUnderMe = myCustomerIds.size === 0 || myCustomerIds.has(c.id);
    if (!isUnderMe) return;

    const tbAccount = (trialBalance || []).find((t: any) => t.account_id === c.receivable_account_id);
    const tbBal = Number(tbAccount?.balance || 0);
    const txDue = Number(customerDueMap[c.id] || 0);
    const balance = tbBal > 0 ? tbBal : txDue;

    if (balance > 0) {
      if (c.customer_group === "Dealer") {
        dealerReceivable += balance;
        dealerCount++;
      } else {
        regularReceivable += balance;
        regularCount++;
      }
    }
  });

  const totalReceivable = regularReceivable + dealerReceivable;

  // Orders booked today & month-to-date
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const myTodayOrders = allOrders.filter((o: any) => {
    const status = (o.status || "").toLowerCase();
    if (["cancelled", "void"].includes(status)) return false;
    const d = new Date(o.created_at || new Date());
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();
    return isToday && isMyOrder(o);
  });

  const myTodayRevenue = myTodayOrders.reduce(
    (sum: number, o: any) => sum + Number(o.total || 0),
    0
  );

  const myMonthOrders = allOrders.filter((o: any) => {
    const status = (o.status || "").toLowerCase();
    if (["cancelled", "void", "draft"].includes(status)) return false;
    const d = new Date(o.created_at || new Date());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && isMyOrder(o);
  });

  const myMonthRevenue = myMonthOrders.reduce(
    (sum: number, o: any) => sum + Number(o.total || 0),
    0
  );

  const myShopsCount = myCustomerIds.size > 0 ? myCustomerIds.size : customers.length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-body">
      {/* 1. TOP SALESMAN BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white p-6 sm:p-8 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    Sales Representative Dashboard
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Field Marketing Active
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  Welcome back, <span className="font-semibold text-white">{currentSalesmanName}</span>. Book wholesale shop orders & track your shop dues.
                </p>
              </div>
            </div>
          </div>

          {/* Primary Action: Take Order CTA */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <FieldOrderDialog
              trigger={
                <Button className="w-full md:w-auto gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-md px-5 h-11 text-sm">
                  <Store className="w-4 h-4" />
                  <span>Take Shop Order (Field)</span>
                </Button>
              }
            />
          </div>
        </div>
      </div>

      {/* 2. MAIN CARDS ROW: Under-Receivable & Today's Bookings */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: My Under-Receivable (Receivable Portfolio) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  My Under-Receivable
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  My Portfolio
                </span>
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <ArrowDown className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              OMR {totalReceivable.toFixed(3)}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Wholesale Dealers ({dealerCount}):
                </span>
                <span className="font-semibold text-gray-800">OMR {dealerReceivable.toFixed(3)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Retail Shops ({regularCount}):
                </span>
                <span className="font-semibold text-gray-800">OMR {regularReceivable.toFixed(3)}</span>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <Link
                to="/admin/receivable-parties"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
              >
                View Shop Ledgers & Collect <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Card 2: Today's Orders Booked (Field Marketing) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Today's Field Orders
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
                  Today
                </span>
              </div>
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <ShoppingCart className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              OMR {myTodayRevenue.toFixed(3)}
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 space-y-1.5">
              <div className="flex justify-between items-center">
                <span>Orders Booked Today:</span>
                <span className="font-semibold text-gray-900 px-2 py-0.5 rounded bg-slate-100">
                  {myTodayOrders.length} order{myTodayOrders.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Month-to-Date Sales:</span>
                <span className="font-semibold text-blue-600">OMR {myMonthRevenue.toFixed(3)}</span>
              </div>
            </div>

            <div className="mt-4 pt-2">
              <FieldOrderDialog
                trigger={
                  <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                    + Book Another Order Now <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                }
              />
            </div>
          </div>

          {/* Card 3: Shops Portfolio & Quick Registration */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs relative overflow-hidden group hover:border-blue-300 transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Client Shops & Garages
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">
                  Portfolio
                </span>
              </div>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600">
                <Building2 className="w-4 h-4" />
              </div>
            </div>

            <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {myShopsCount} <span className="text-base font-medium text-gray-400">Shops</span>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-600 flex items-center justify-between">
              <span>Quick Onboarding:</span>
              <span className="text-[11px] text-gray-400">Auto assigns to your rep ID</span>
            </div>

            <div className="mt-4 pt-2 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5 font-semibold text-blue-700 hover:bg-blue-50 border-blue-200"
                onClick={() => {
                  setCreateModalType("Dealer");
                  setCreateModalOpen(true);
                }}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>+ Add Dealer</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs h-8 gap-1.5 font-semibold text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                onClick={() => {
                  setCreateModalType("Retail");
                  setCreateModalOpen(true);
                }}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>+ Add Shop</span>
              </Button>
            </div>
          </div>
        </div>

        {/* 3. QUICK ACTIONS SHORTCUT BAR */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-600" />
              <span>Sales Field Quick Actions</span>
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <FieldOrderDialog
              trigger={
                <Button variant="outline" className="justify-start gap-2 h-10 text-xs font-semibold hover:border-blue-400 hover:bg-blue-50 text-gray-800">
                  <Store className="w-4 h-4 text-blue-600" />
                  <span>Take Field Order</span>
                </Button>
              }
            />

            <Button
              variant="outline"
              className="justify-start gap-2 h-10 text-xs font-semibold hover:border-blue-400 hover:bg-blue-50 text-gray-800"
              onClick={() => {
                setCreateModalType("Dealer");
                setCreateModalOpen(true);
              }}
            >
              <Building2 className="w-4 h-4 text-indigo-600" />
              <span>Register New Dealer</span>
            </Button>

            <Link to="/admin/receivable-parties" className="w-full">
              <Button variant="outline" className="w-full justify-start gap-2 h-10 text-xs font-semibold hover:border-emerald-400 hover:bg-emerald-50 text-gray-800">
                <BadgeDollarSign className="w-4 h-4 text-emerald-600" />
                <span>View My Receivables</span>
              </Button>
            </Link>

            <Link to="/admin/orders" className="w-full">
              <Button variant="outline" className="w-full justify-start gap-2 h-10 text-xs font-semibold hover:border-amber-400 hover:bg-amber-50 text-gray-800">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span>All Orders Log</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* 4. ORDERS QUICK VIEW TABLE */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
          <AdminOrdersQuickView orders={allOrders} isLoading={loadingOrders} />
        </div>
      </div>

      {/* Modal for adding customer/dealer */}
      <CreateCustomerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialGroup={createModalType}
      />
    </div>
  );
};
