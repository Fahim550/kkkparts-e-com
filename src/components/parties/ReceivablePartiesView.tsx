import { InvoiceData, InvoiceItem, InvoicePreviewModal } from "@/components/admin/InvoicePreviewModal";
import { PartyTopActionBar } from "@/components/admin/PartyTopActionBar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { CustomerService } from "@/modules/customer/application/services/customer.service";
import { useCustomerDues, useCustomerHistory, useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Info,
  MoreVertical,
  Phone,
  Printer,
  Search,
  Trash2,
  X,
  XCircle,
  Store,
  UserCheck,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { FieldOrderDialog } from "@/components/admin/FieldOrderDialog";

export interface ReceivablePartiesViewProps {
  portalType?: "admin" | "salesman";
  initialSelectedId?: string | null;
}

export const ReceivablePartiesView = ({
  portalType = "admin",
  initialSelectedId = null,
}: ReceivablePartiesViewProps) => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "all";
  const urlSelected = searchParams.get("selected") || initialSelectedId;
  const queryClient = useQueryClient();

  const { customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: trialBalance = [], isLoading: loadingTb } = useTrialBalance();
  const { data: customerDueMap = {}, isLoading: loadingDues } = useCustomerDues();
  const { user, isSalesman, isAdmin } = useAdminAuth();
  const isSalesmanOnly = isSalesman && !isAdmin;
  const currentUserId = user?.id;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(urlSelected);
  const [activeTab, setActiveTab] = useState<"customer" | "dealer">(
    defaultType === "dealer" ? "dealer" : "customer"
  );
  const [balanceFilter, setBalanceFilter] = useState<"due" | "all">("due");
  const [territoryFilter, setTerritoryFilter] = useState<"my" | "all">(
    isSalesmanOnly ? "my" : "all"
  );

  // Sorting state for parties list
  const [sortField, setSortField] = useState<"name" | "balance">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Transactions search state
  const [showTxSearch, setShowTxSearch] = useState(false);
  const [txSearchTerm, setTxSearchTerm] = useState("");

  // Customer Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    credit_limit: 0,
  });

  // Invoice Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);

  // Compute parties with real balances
  const partiesWithBalance = useMemo(() => {
    if (!customers) return [];

    let filtered = customers;
    if (activeTab === "customer") {
      filtered = customers.filter((c: any) => c.customer_group !== "Dealer");
    } else if (activeTab === "dealer") {
      filtered = customers.filter((c: any) => c.customer_group === "Dealer");
    }

    if (territoryFilter === "my" && currentUserId) {
      const myFiltered = filtered.filter((c: any) => c.salesman_id === currentUserId);
      if (myFiltered.length > 0) {
        filtered = myFiltered;
      }
    }

    let parties = filtered.map((c: any) => {
      const tbAccount = (trialBalance || []).find((t: any) => t.account_id === c.receivable_account_id);
      const tbBal = Number(tbAccount?.balance || 0);
      const txDue = Number(customerDueMap[c.id] || 0);
      const balance = tbBal > 0 ? tbBal : txDue;
      return {
        ...c,
        balance,
      };
    });

    if (balanceFilter === "due") {
      parties = parties.filter((c: any) => c.balance > 0);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      parties = parties.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.contact_phone?.includes(q) ||
          p.contact_email?.toLowerCase().includes(q)
      );
    }

    // Sort parties
    parties.sort((a: any, b: any) => {
      if (sortField === "name") {
        const cmp = (a.name || "").localeCompare(b.name || "");
        return sortOrder === "asc" ? cmp : -cmp;
      } else {
        return sortOrder === "asc" ? a.balance - b.balance : b.balance - a.balance;
      }
    });

    return parties;
  }, [customers, trialBalance, customerDueMap, searchTerm, activeTab, balanceFilter, sortField, sortOrder, territoryFilter, currentUserId]);

  const selectedParty = useMemo(() => {
    return partiesWithBalance.find((p: any) => p.id === selectedPartyId) || partiesWithBalance[0];
  }, [partiesWithBalance, selectedPartyId]);

  const { history = [], isLoadingHistory } = useCustomerHistory(selectedParty?.id || "");

  // Filtered transactions
  const filteredHistory = useMemo(() => {
    if (!txSearchTerm.trim()) return history;
    const q = txSearchTerm.toLowerCase();
    return history.filter(
      (h: any) =>
        h.type?.toLowerCase().includes(q) ||
        h.reference_number?.toLowerCase().includes(q) ||
        h.date?.includes(q) ||
        h.status?.toLowerCase().includes(q)
    );
  }, [history, txSearchTerm]);

  // Open Edit Modal
  const handleOpenEdit = () => {
    if (!selectedParty) return;
    setEditForm({
      name: selectedParty.name || "",
      contact_phone: selectedParty.contact_phone || "",
      contact_email: selectedParty.contact_email || "",
      credit_limit: Number(selectedParty.credit_limit || 0),
    });
    setEditModalOpen(true);
  };

  // Save Edit Customer
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    setSavingEdit(true);
    try {
      await CustomerService.updateCustomer(selectedParty.id, {
        name: editForm.name.trim(),
        contact_phone: editForm.contact_phone.trim() || undefined,
        contact_email: editForm.contact_email.trim() || undefined,
        credit_limit: Number(editForm.credit_limit) || 0,
      });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Customer details updated successfully");
      setEditModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to update customer: " + err.message);
    } finally {
      setSavingEdit(false);
    }
  };

  // Export transactions to CSV
  const handleExportCSV = () => {
    if (!filteredHistory || filteredHistory.length === 0) {
      toast.error("No transactions to export");
      return;
    }
    const headers = ["Type", "Reference Number", "Date", "Total Amount (OMR)", "Balance Due (OMR)", "Status"];
    const rows = filteredHistory.map((item: any) => [
      item.type,
      item.reference_number || "-",
      new Date(item.date).toLocaleDateString("en-GB"),
      Number(item.amount || 0).toFixed(3),
      Number(item.balance || 0).toFixed(3),
      item.status || "Completed",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e: any[]) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${selectedParty?.name || "Customer"}_Transactions_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Transaction statement exported");
  };

  // Print transactions statement
  const handlePrintStatement = () => {
    window.print();
  };

  // Fetch full invoice data for Preview / PDF
  const loadInvoiceData = async (item: any): Promise<InvoiceData | null> => {
    try {
      const isInvoice = item.type === "Sales Invoice";
      const tableName = isInvoice ? "sales_invoices" : "sales_orders";
      const itemsTable = isInvoice ? "sales_invoice_items" : "sales_order_items";
      const fkCol = isInvoice ? "sales_invoice_id" : "sales_order_id";

      const { data: record, error: recErr } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", item.id)
        .single();

      if (recErr) throw recErr;

      const { data: items } = await supabase
        .from(itemsTable)
        .select("*, product_variations(sku, product:products(name))")
        .eq(fkCol, item.id);

      const invoiceItems: InvoiceItem[] = (items || []).map((it: any) => {
        const prodName =
          it.product_variations?.product?.name ||
          it.product_variations?.products?.name ||
          it.item_name ||
          "Product Item";
        const qty = Number(it.quantity_ordered ?? it.quantity_billed ?? it.quantity ?? 1);
        const price = Number(it.unit_price ?? it.unit_cost ?? 0);
        const amount = Number(it.total_price ?? it.amount ?? it.total_cost ?? qty * price);
        return {
          name: prodName,
          qty,
          price,
          taxPct: Number(it.tax_rate || 0),
          amount,
        };
      });

      const totalAmt = Number(record.total_amount || item.amount || 0);
      const balanceAmt = Number(item.balance || 0);
      const receivedAmt = Math.max(0, totalAmt - balanceAmt);

      return {
        type: "Sale",
        partyName: selectedParty?.name || "Customer",
        partyPhone: selectedParty?.contact_phone || "",
        partyAddress: selectedParty?.billing_address || selectedParty?.shipping_address || "",
        invoiceNo:
          item.reference_number ||
          record.so_number ||
          record.invoice_number ||
          `SO-${item.id.slice(0, 6)}`,
        date:
          item.date ||
          record.order_date ||
          record.invoice_date ||
          new Date().toISOString().split("T")[0],
        items:
          invoiceItems.length > 0
            ? invoiceItems
            : [
                {
                  name: `${item.type} - Ref ${item.reference_number || "Direct"}`,
                  qty: 1,
                  price: totalAmt,
                  taxPct: 0,
                  amount: totalAmt,
                },
              ],
        totalQty: invoiceItems.reduce((s, it) => s + it.qty, 0) || 1,
        subTotal: totalAmt,
        roundOff: 0,
        total: totalAmt,
        received: receivedAmt,
        balance: balanceAmt,
      };
    } catch (err: any) {
      toast.error("Failed to load invoice details: " + err.message);
      return null;
    }
  };

  // Preview / Print Invoice
  const handlePreviewInvoice = async (item: any) => {
    const data = await loadInvoiceData(item);
    if (data) {
      setPreviewData(data);
      setPreviewOpen(true);
    }
  };

  // Cancel Invoice / Order
  const handleCancelTransaction = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to cancel ${item.type} (${item.reference_number || item.id.slice(0, 8)})?`
      )
    ) {
      return;
    }
    try {
      const tableName = item.type === "Sales Invoice" ? "sales_invoices" : "sales_orders";
      const { error } = await supabase.from(tableName).update({ status: "cancelled" }).eq("id", item.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["customer-history", selectedParty?.id] });
      await queryClient.invalidateQueries({ queryKey: ["customer-dues"] });
      toast.success(`${item.type} marked as cancelled`);
    } catch (err: any) {
      toast.error("Failed to cancel: " + err.message);
    }
  };

  // Delete Transaction (only allowed for Admin)
  const handleDeleteTransaction = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${item.type} (${item.reference_number || item.id.slice(0, 8)})? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const isInvoice = item.type === "Sales Invoice";
      const tableName = isInvoice ? "sales_invoices" : "sales_orders";
      const itemsTable = isInvoice ? "sales_invoice_items" : "sales_order_items";
      const fkCol = isInvoice ? "sales_invoice_id" : "sales_order_id";

      try {
        await supabase.from(itemsTable).delete().eq(fkCol, item.id);
      } catch (e) {
        console.warn("Item deletion notice:", e);
      }

      try {
        const { AccountingEngine } = await import("@/modules/accounting/application/services/accounting.engine");
        await AccountingEngine.reverseSalesOrder(item.id);
      } catch (e) {
        console.warn("Journal entry deletion notice:", e);
      }

      const { error } = await supabase.from(tableName).delete().eq("id", item.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["customer-history", selectedParty?.id] });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["customer-dues"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      toast.success(`${item.type} deleted successfully`);
    } catch (err: any) {
      toast.error("Failed to delete transaction: " + err.message);
    }
  };

  if (loadingCustomers || loadingTb || loadingDues) {
    return <div className="p-8 flex justify-center text-gray-500">Loading parties & balances...</div>;
  }

  const isSalesmanView = portalType === "salesman";

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-64px)] bg-slate-50 font-body overflow-hidden">
      {/* Top Navigation / Action Bar */}
      <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-2 text-gray-800 font-semibold text-lg">
            <span>{isSalesmanView ? "Shop Ledgers & Receivables" : "Customers & Dealers (Receivable)"}</span>
            {isSalesmanView && (
              <span className="text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                Field Rep View
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {isSalesmanView
              ? "Track dues, view transaction history, and collect orders for client shops."
              : "Complete receivable account statement and customer ledger."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PartyTopActionBar
            allowedModes={["customer", "dealer"]}
            onDealerCreated={(newDealer) => {
              setActiveTab("dealer");
              setBalanceFilter("all");
              if (newDealer?.id) setSelectedPartyId(newDealer.id);
            }}
            onCustomerCreated={(newCust) => {
              setActiveTab("customer");
              setBalanceFilter("all");
              if (newCust?.id) setSelectedPartyId(newCust.id);
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-72 lg:w-80 shrink-0 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Shop or Dealer"
                className="pl-9 bg-gray-50 border-gray-200 rounded-md text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Type Tabs */}
            <div className="flex mt-3 border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                  activeTab === "customer"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setActiveTab("customer");
                  setSelectedPartyId(null);
                }}
              >
                Retail Shops
              </button>
              <button
                className={`flex-1 py-2 text-xs font-semibold text-center border-b-2 transition-colors ${
                  activeTab === "dealer"
                    ? "border-blue-600 text-blue-600 font-bold"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
                onClick={() => {
                  setActiveTab("dealer");
                  setSelectedPartyId(null);
                }}
              >
                Dealers
              </button>
            </div>

            {/* Due vs All Filter Toggle & Territory */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                <button
                  onClick={() => setBalanceFilter("due")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium text-xs ${
                    balanceFilter === "due" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  Due Only
                </button>
                <button
                  onClick={() => setBalanceFilter("all")}
                  className={`px-2.5 py-1 rounded-md transition-all font-medium text-xs ${
                    balanceFilter === "all" ? "bg-white text-gray-900 shadow-xs" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  All ({partiesWithBalance.length})
                </button>
              </div>

              <span className="text-gray-400 text-xs">
                {partiesWithBalance.length} {activeTab === "customer" ? "Shops" : "Dealers"}
              </span>
            </div>

            {/* Sorter Headers */}
            <div className="flex justify-between items-center mt-3 text-xs font-semibold text-gray-500 px-2">
              <button
                onClick={() => {
                  if (sortField === "name") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("name");
                    setSortOrder("asc");
                  }
                }}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <span>Name</span>
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </button>
              <button
                onClick={() => {
                  if (sortField === "balance") {
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
                  } else {
                    setSortField("balance");
                    setSortOrder("desc");
                  }
                }}
                className="flex items-center gap-1 hover:text-blue-600 transition-colors"
              >
                <span>Due Amount</span>
                <ArrowUpDown className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {partiesWithBalance.map((party: any) => (
              <div
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                className={`flex justify-between items-center p-3.5 cursor-pointer text-xs transition-colors border-l-4 ${
                  selectedParty?.id === party.id
                    ? "bg-blue-50 border-blue-600"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <div className="font-semibold text-gray-900 truncate">{party.name}</div>
                  <div className="text-[11px] text-gray-400 truncate">
                    {party.contact_phone || (party.customer_group && `${party.customer_group}`) || "No Phone"}
                  </div>
                </div>
                <div
                  className={`font-bold shrink-0 ${
                    party.balance > 0 ? "text-rose-600" : "text-emerald-600 font-medium"
                  }`}
                >
                  OMR {party.balance.toFixed(3)}
                </div>
              </div>
            ))}
            {partiesWithBalance.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                {balanceFilter === "due"
                  ? "No shops or dealers with outstanding dues."
                  : "No matching shops found."}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedParty ? (
            <>
              {/* Selected Party Header */}
              <div className="p-5 border-b border-gray-200 flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-tight">{selectedParty.name}</h2>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                      {selectedParty.customer_group || "Retail"}
                    </span>
                    <button
                      onClick={handleOpenEdit}
                      title="Quick Edit Customer"
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">Contact & Address</div>
                  <div className="text-xs text-gray-800 font-medium flex items-center gap-2 mt-0.5">
                    <span>{selectedParty.contact_phone || "No Phone"}</span>
                    {selectedParty.contact_email && (
                      <span className="text-gray-400 font-normal">| {selectedParty.contact_email}</span>
                    )}
                    {(selectedParty.billing_address || selectedParty.shipping_address) && (
                      <span className="text-gray-400 font-normal truncate max-w-xs">
                        | {selectedParty.billing_address || selectedParty.shipping_address}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Due Balance</div>
                    <div
                      className={`text-xl font-black ${
                        selectedParty.balance > 0 ? "text-rose-600" : "text-emerald-600"
                      }`}
                    >
                      OMR {selectedParty.balance.toFixed(3)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <FieldOrderDialog
                      defaultCustomerId={selectedParty.id}
                      trigger={
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs gap-1.5 h-8 shadow-xs"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Take Order</span>
                        </Button>
                      }
                    />
                    {selectedParty.contact_phone ? (
                      <a
                        href={`tel:${selectedParty.contact_phone}`}
                        title={`Call ${selectedParty.contact_phone}`}
                        className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 hover:bg-emerald-100 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    ) : (
                      <div
                        title="No phone number"
                        className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400"
                      >
                        <Phone className="w-4 h-4" />
                      </div>
                    )}
                    {isSalesmanView ? (
                      <Link
                        to={`/salesman/shops`}
                        title="View in Shop Directory"
                        className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to={`/admin/customers/${selectedParty.id}`}
                        title="View Full Profile & Statement"
                        className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Transactions Table Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-3.5 flex justify-between items-center border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-gray-700">Order & Ledger Entries</h3>
                    <span className="text-xs text-gray-400">({filteredHistory.length})</span>
                  </div>

                  <div className="flex items-center gap-2 text-gray-500">
                    <button
                      onClick={() => setShowTxSearch(!showTxSearch)}
                      title="Search in transactions"
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        showTxSearch ? "bg-gray-200 text-blue-600" : ""
                      }`}
                    >
                      <Search className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handlePrintStatement}
                      title="Print Statement"
                      className="p-1.5 rounded hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={handleExportCSV}
                      title="Export to Excel / CSV"
                      className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Inline Transaction Search Filter */}
                {showTxSearch && (
                  <div className="p-2.5 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <Input
                      placeholder="Filter by ref number, type, or date..."
                      value={txSearchTerm}
                      onChange={(e) => setTxSearchTerm(e.target.value)}
                      className="h-7 bg-white text-xs border-gray-300"
                    />
                    {txSearchTerm && (
                      <button
                        onClick={() => setTxSearchTerm("")}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 sticky top-0 border-b border-gray-200 font-bold">
                      <tr>
                        <th className="px-5 py-2.5">Type</th>
                        <th className="px-5 py-2.5">Number</th>
                        <th className="px-5 py-2.5">Date</th>
                        <th className="px-5 py-2.5 text-right">Total</th>
                        <th className="px-5 py-2.5 text-right">Balance Due</th>
                        <th className="px-5 py-2.5 text-center">Status</th>
                        <th className="px-5 py-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingHistory ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-8 text-gray-400">
                            {txSearchTerm ? "No matching transactions found." : "No transactions found."}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item: any) => {
                          const balance = item.balance;
                          const dateObj = new Date(item.date);
                          const formattedDate = !isNaN(dateObj.getTime())
                            ? `${dateObj.getDate().toString().padStart(2, "0")}/${(dateObj.getMonth() + 1)
                                .toString()
                                .padStart(2, "0")}/${dateObj.getFullYear()}`
                            : "-";

                          const isCancelled = (item.status || "").toLowerCase() === "cancelled";

                          return (
                            <tr
                              key={item.id}
                              className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${
                                isCancelled ? "opacity-50" : ""
                              }`}
                            >
                              <td className="px-5 py-3 text-gray-800 font-medium">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold ${
                                    item.type === "Sales Invoice"
                                      ? "bg-purple-50 text-purple-700"
                                      : "bg-blue-50 text-blue-700"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-gray-700 font-mono text-[11px]">
                                {item.reference_number || "-"}
                              </td>
                              <td className="px-5 py-3 text-gray-600">{formattedDate}</td>
                              <td className="px-5 py-3 text-right text-gray-800 font-semibold">
                                OMR {Number(item.amount || 0).toFixed(3)}
                              </td>
                              <td
                                className={`px-5 py-3 text-right font-bold ${
                                  balance > 0 ? "text-rose-600" : "text-emerald-600"
                                }`}
                              >
                                OMR {balance.toFixed(3)}
                              </td>
                              <td className="px-5 py-3 text-center">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                                    isCancelled
                                      ? "bg-rose-100 text-rose-700"
                                      : balance === 0
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {isCancelled ? "Cancelled" : balance === 0 ? "Paid" : "Due"}
                                </span>
                              </td>
                              <td className="px-5 py-3 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-200 rounded-full outline-none transition-colors">
                                      <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200 shadow-md">
                                    <DropdownMenuItem
                                      onClick={() => handlePreviewInvoice(item)}
                                      className="cursor-pointer flex items-center gap-2 text-gray-700 text-xs"
                                    >
                                      <Eye className="w-3.5 h-3.5 text-blue-500" />
                                      Preview & Print
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handlePreviewInvoice(item)}
                                      className="cursor-pointer flex items-center gap-2 text-gray-700 text-xs"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-gray-500" />
                                      Download Invoice PDF
                                    </DropdownMenuItem>

                                    {!isSalesmanView && (
                                      <>
                                        <DropdownMenuItem asChild>
                                          <Link
                                            to={`/admin/sales/new?edit=${item.id}&type=${encodeURIComponent(item.type)}`}
                                            className="cursor-pointer flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700 text-xs"
                                          >
                                            <Edit className="w-3.5 h-3.5 text-blue-500" />
                                            Admin Edit
                                          </Link>
                                        </DropdownMenuItem>

                                        {!isCancelled && (
                                          <DropdownMenuItem
                                            onClick={() => handleCancelTransaction(item)}
                                            className="cursor-pointer flex items-center gap-2 text-amber-700 text-xs"
                                          >
                                            <XCircle className="w-3.5 h-3.5 text-amber-500" />
                                            Cancel Transaction
                                          </DropdownMenuItem>
                                        )}

                                        <DropdownMenuSeparator />

                                        <DropdownMenuItem
                                          onClick={() => handleDeleteTransaction(item)}
                                          className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-700 text-xs"
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                          Delete
                                        </DropdownMenuItem>
                                      </>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <FileText className="w-10 h-10 text-gray-300" />
              <div className="text-xs">Select a customer or dealer from the list to view statement & dues</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Edit Customer Modal ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
            <DialogDescription>Update contact details and credit limit for this customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Name</Label>
              <Input
                required
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Phone</Label>
              <Input
                placeholder="e.g. +968 91234567"
                value={editForm.contact_phone}
                onChange={(e) => setEditForm({ ...editForm, contact_phone: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Contact Email</Label>
              <Input
                type="email"
                placeholder="e.g. customer@example.com"
                value={editForm.contact_email}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Credit Limit (OMR)</Label>
              <Input
                type="number"
                step="0.001"
                min="0"
                value={editForm.credit_limit}
                onChange={(e) => setEditForm({ ...editForm, credit_limit: Number(e.target.value) })}
              />
            </div>
            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={savingEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                {savingEdit ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Invoice Preview Modal ── */}
      {previewData && (
        <InvoicePreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          onSave={() => setPreviewOpen(false)}
          data={previewData}
        />
      )}
    </div>
  );
};

export default ReceivablePartiesView;
