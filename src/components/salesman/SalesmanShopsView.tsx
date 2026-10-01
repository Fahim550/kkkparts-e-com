import { CreateCustomerModal } from "@/components/admin/CreateCustomerModal";
import { FieldOrderDialog } from "@/components/admin/FieldOrderDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useOrders } from "@/hooks/useDatabase";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { useCustomerDues, useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import {
  ArrowRight,
  BadgeDollarSign,
  Building2,
  FileSpreadsheet,
  MapPin,
  Phone,
  Plus,
  Search,
  Store,
  Users
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export const SalesmanShopsView: React.FC = () => {
  const navigate = useNavigate();
  const { customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: allOrders = [] } = useOrders();
  const { data: customerDueMap = {} } = useCustomerDues();
  const { data: trialBalance = [] } = useTrialBalance();
  const { user, isAdmin } = useAdminAuth();

  const [searchTerm, setSearchTerm] = useState("");
  const [groupFilter, setGroupFilter] = useState<"all" | "dealer" | "retail">("all");
  const [territoryFilter, setTerritoryFilter] = useState<"my" | "all">("my");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createGroup, setCreateGroup] = useState<"Customer" | "Dealer">("Dealer");

  const currentUserId = user?.id;

  // Compute customers under this salesman's territory or with booked orders
  const myCustomerIds = useMemo(() => {
    const ids = new Set<string>();
    const repName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "";
    const normalizedRepName = repName.toLowerCase().trim();

    (customers || []).forEach((c: any) => {
      if (c.salesman_id && currentUserId && c.salesman_id === currentUserId) {
        ids.add(c.id);
      }
    });

    (allOrders || []).forEach((o: any) => {
      const matchId = o.salesman_id && currentUserId && o.salesman_id === currentUserId;
      const matchName =
        o.salesman_name &&
        normalizedRepName &&
        o.salesman_name.toLowerCase().trim() === normalizedRepName;
      const isField = o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-");
      if ((matchId || matchName || isField) && o.customer_id) {
        ids.add(o.customer_id);
      }
    });

    // Always include Dealer shops with field orders
    (customers || []).forEach((c: any) => {
      if (c.customer_group === "Dealer") {
        const hasFieldOrder = (allOrders || []).some(
          (o: any) => o.customer_id === c.id && (o.order_source === "field_marketing" || o.order_number?.startsWith("SO-FLD-"))
        );
        if (hasFieldOrder && (!c.salesman_id || c.salesman_id === currentUserId)) {
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
  }, [customers, allOrders, currentUserId, user]);

  // Compute customers with balance
  const shopsWithBalance = useMemo(() => {
    return (customers || []).map((c: any) => {
      const tbAccount = (trialBalance || []).find((t: any) => t.account_id === c.receivable_account_id);
      const tbBal = Number(tbAccount?.balance || 0);
      const txDue = Number(customerDueMap[c.id] || 0);
      const due = tbBal > 0 ? tbBal : txDue;
      return {
        ...c,
        due,
      };
    });
  }, [customers, trialBalance, customerDueMap]);

  // Base shops: default to salesman's territory, allow toggle to all
  const baseShops = useMemo(() => {
    if (territoryFilter === "my") {
      return shopsWithBalance.filter((s: any) => myCustomerIds.has(s.id));
    }
    return shopsWithBalance;
  }, [shopsWithBalance, territoryFilter, myCustomerIds]);

  // Filtered shops
  const filteredShops = useMemo(() => {
    let list = baseShops;

    if (groupFilter === "dealer") {
      list = list.filter((s: any) => s.customer_group === "Dealer");
    } else if (groupFilter === "retail") {
      list = list.filter((s: any) => s.customer_group !== "Dealer");
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s: any) =>
          s.name?.toLowerCase().includes(q) ||
          s.contact_phone?.includes(q) ||
          s.contact_email?.toLowerCase().includes(q) ||
          s.billing_address?.toLowerCase().includes(q) ||
          s.shipping_address?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [baseShops, groupFilter, searchTerm]);

  // Aggregate metrics: strictly based on the representative's territory
  const metrics = useMemo(() => {
    const totalShops = baseShops.length;
    const totalDealers = baseShops.filter((s: any) => s.customer_group === "Dealer").length;
    const totalRetail = baseShops.filter((s: any) => s.customer_group !== "Dealer").length;
    const totalReceivables = baseShops.reduce((sum, s) => sum + Number(s.due || 0), 0);

    return { totalShops, totalDealers, totalRetail, totalReceivables };
  }, [baseShops]);

  const handleExportCSV = () => {
    if (filteredShops.length === 0) {
      toast.error("No shops to export");
      return;
    }
    const headers = ["Shop Name", "Category", "Phone", "Email", "Address", "Outstanding Due (OMR)", "Credit Limit (OMR)"];
    const rows = filteredShops.map((s: any) => [
      s.name,
      s.customer_group || "Retail",
      s.contact_phone || "N/A",
      s.contact_email || "N/A",
      s.billing_address || s.shipping_address || "N/A",
      Number(s.due || 0).toFixed(3),
      Number(s.credit_limit || 0).toFixed(3),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Shop_Directory_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Shop directory exported to CSV");
  };

  return (
    <div className="flex-1 bg-slate-50 font-body p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-blue-600" />
            <span>Shops & Dealers Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage your territory accounts, register new shops, and book field orders directly.
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

          <Button
            size="sm"
            onClick={() => {
              setCreateGroup("Dealer");
              setCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Shop / Dealer</span>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Client Shops</span>
            <Store className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {metrics.totalShops}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Active retail & dealer clients</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Authorized Dealers</span>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 mt-2">
            {metrics.totalDealers}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Wholesale tier accounts</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Retail Shops</span>
            <Users className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-black text-sky-600 mt-2">
            {metrics.totalRetail}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Retail garages & stores</div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Total Receivables</span>
            <BadgeDollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            OMR {metrics.totalReceivables.toFixed(3)}
          </div>
          <div className="text-[11px] text-rose-500 font-medium mt-0.5">Total balance due</div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/80 p-3 sm:p-4 mb-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by shop name, phone, address..."
            className="pl-9 h-9 text-xs bg-slate-50 border-slate-200"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
              <button
                onClick={() => setTerritoryFilter("my")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  territoryFilter === "my"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                My Portfolio ({myCustomerIds.size})
              </button>
              <button
                onClick={() => setTerritoryFilter("all")}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  territoryFilter === "all"
                    ? "bg-white text-blue-700 shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Shops ({shopsWithBalance.length})
              </button>
            </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setGroupFilter("all")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                groupFilter === "all"
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              All Types
            </button>
            <button
              onClick={() => setGroupFilter("dealer")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                groupFilter === "dealer"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Dealers ({metrics.totalDealers})
            </button>
            <button
              onClick={() => setGroupFilter("retail")}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                groupFilter === "retail"
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
              }`}
            >
              Retail ({metrics.totalRetail})
            </button>
          </div>
        </div>
      </div>

      {/* Shops Grid */}
      {loadingCustomers ? (
        <div className="p-12 text-center text-slate-400 text-sm">
          Loading shops & clients...
        </div>
      ) : filteredShops.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Shops Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-5">
            {searchTerm
              ? "No shop matched your search query. Try searching for a different phone or name."
              : "No shops registered in this filter."}
          </p>
          <Button
            onClick={() => {
              setCreateGroup("Dealer");
              setCreateModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            <span>Add New Shop / Dealer</span>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredShops.map((shop: any) => {
            const isDealer = shop.customer_group === "Dealer";
            const dueAmt = Number(shop.due || 0);

            return (
              <div
                key={shop.id}
                className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-blue-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <h3 className="font-bold text-slate-900 text-sm leading-tight truncate">
                        {shop.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            isDealer
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {shop.customer_group || "Retail"}
                        </span>
                        {shop.credit_limit > 0 && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            Limit: OMR {Number(shop.credit_limit).toFixed(0)}
                          </span>
                        )}
                      </div>
                    </div>

                    {shop.contact_phone && (
                      <a
                        href={`tel:${shop.contact_phone}`}
                        title={`Call ${shop.contact_phone}`}
                        className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors shrink-0"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>

                  {/* Contact Info & Location */}
                  <div className="space-y-1 text-xs text-slate-600 my-3">
                    <div className="flex items-center gap-1.5 truncate">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-800">
                        {shop.contact_phone || "No phone registered"}
                      </span>
                    </div>

                    {(shop.billing_address || shop.shipping_address) && (
                      <div className="flex items-center gap-1.5 truncate text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {shop.billing_address || shop.shipping_address}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Dues and Action Buttons */}
                <div className="pt-3 border-t border-slate-100 mt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      Balance Due:
                    </span>
                    <span
                      className={`text-sm font-black ${
                        dueAmt > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      OMR {dueAmt.toFixed(3)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <FieldOrderDialog
                      defaultCustomerId={shop.id}
                      trigger={
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-8 shadow-xs gap-1"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Take Order</span>
                        </Button>
                      }
                    />

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/salesman/receivables?selected=${shop.id}`)}
                      className="text-xs h-8 px-2.5 font-semibold text-slate-700 bg-white gap-1"
                      title="View Ledger Statement & Dues"
                    >
                      <span>Ledger</span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Shop / Dealer Modal */}
      <CreateCustomerModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        initialGroup={createGroup}
        onSuccess={(created) => {
          toast.success(`Account for "${created.name}" created successfully!`);
          setCreateModalOpen(false);
        }}
      />
    </div>
  );
};

export default SalesmanShopsView;
