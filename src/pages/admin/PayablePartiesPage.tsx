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
import { SupplierService } from "@/modules/supplier/application/services/supplier.service";
import { useSupplierDues, useSupplierHistory, useSuppliers } from "@/modules/supplier/presentation/hooks/useSuppliers";
import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowUpDown,
  Building2,
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
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const PayablePartiesPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "due";
  const queryClient = useQueryClient();

  const { suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: trialBalance = [], isLoading: loadingTb } = useTrialBalance();
  const { data: supplierDueMap = {}, isLoading: loadingDues } = useSupplierDues();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"due" | "all">(
    defaultTab === "all" ? "all" : "due"
  );

  // Sorting state
  const [sortField, setSortField] = useState<"name" | "balance">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Transactions search state
  const [showTxSearch, setShowTxSearch] = useState(false);
  const [txSearchTerm, setTxSearchTerm] = useState("");

  // Edit Supplier Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
  });

  // Invoice Preview Modal state
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);

  const partiesWithBalance = useMemo(() => {
    if (!suppliers) return [];

    const parties = suppliers.map((s: any) => {
      const tbAccount = (trialBalance || []).find((t: any) => t.account_id === s.payable_account_id);
      const tbBal = Number(tbAccount?.balance || 0);
      const txDue = Number(supplierDueMap[s.id] || 0);
      const balance = tbBal > 0 ? tbBal : txDue;
      return {
        ...s,
        balance,
      };
    });

    let filtered = parties;
    if (activeTab === "due") {
      filtered = parties.filter((s: any) => s.balance > 0);
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (p: any) =>
          p.name?.toLowerCase().includes(q) ||
          p.contact_phone?.includes(q) ||
          p.contact_email?.toLowerCase().includes(q)
      );
    }

    // Sort
    filtered.sort((a: any, b: any) => {
      if (sortField === "name") {
        const cmp = (a.name || "").localeCompare(b.name || "");
        return sortOrder === "asc" ? cmp : -cmp;
      } else {
        return sortOrder === "asc" ? a.balance - b.balance : b.balance - a.balance;
      }
    });

    return filtered;
  }, [suppliers, trialBalance, supplierDueMap, searchTerm, activeTab, sortField, sortOrder]);

  const selectedParty = useMemo(() => {
    return partiesWithBalance.find((p: any) => p.id === selectedPartyId) || partiesWithBalance[0];
  }, [partiesWithBalance, selectedPartyId]);

  const { history = [], isLoadingHistory } = useSupplierHistory(selectedParty?.id || "");

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

  // Open Edit Supplier Modal
  const handleOpenEdit = () => {
    if (!selectedParty) return;
    setEditForm({
      name: selectedParty.name || "",
      contact_phone: selectedParty.contact_phone || "",
      contact_email: selectedParty.contact_email || "",
      address: selectedParty.address || "",
    });
    setEditModalOpen(true);
  };

  // Save Edit Supplier
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParty) return;
    setSavingEdit(true);
    try {
      await SupplierService.updateSupplier({
        id: selectedParty.id,
        name: editForm.name.trim(),
        contact_phone: editForm.contact_phone.trim() || null,
        contact_email: editForm.contact_email.trim() || null,
        address: editForm.address.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast.success("Supplier details updated successfully");
      setEditModalOpen(false);
    } catch (err: any) {
      toast.error("Failed to update supplier: " + err.message);
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
    const headers = ["Type", "Reference Number", "Date", "Total (OMR)", "Balance Due (OMR)", "Status"];
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
      `${selectedParty?.name || "Supplier"}_Purchases_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Supplier statement exported");
  };

  // Print statement
  const handlePrintStatement = () => {
    window.print();
  };

  // Load Purchase Invoice Data for Preview
  const loadPurchaseInvoiceData = async (item: any): Promise<InvoiceData | null> => {
    try {
      const isInvoice = item.type === "Purchase Invoice";
      const tableName = isInvoice ? "purchase_invoices" : "purchase_orders";
      const itemsTable = isInvoice ? "purchase_invoice_items" : "purchase_order_items";
      const fkCol = isInvoice ? "invoice_id" : "purchase_order_id";

      const { data: record, error: recErr } = await supabase
        .from(tableName)
        .select("*")
        .eq("id", item.id)
        .single();

      if (recErr) throw recErr;

      const { data: items } = await supabase
        .from(itemsTable)
        .select("*, product_variations(product:products(name))")
        .eq(fkCol, item.id);

      const invoiceItems: InvoiceItem[] = (items || []).map((it: any) => {
        const prodName = it.product_variations?.product?.name || it.item_name || "Purchase Item";
        return {
          name: prodName,
          qty: Number(it.quantity_ordered || it.quantity || 1),
          price: Number(it.unit_cost || it.unit_price || 0),
          taxPct: Number(it.tax_rate || 0),
          amount: Number(it.total_cost || it.total_price || (it.quantity_ordered || 1) * (it.unit_cost || 0)),
        };
      });

      const totalAmt = Number(record.total_amount || item.amount || 0);
      const balanceAmt = Number(item.balance || 0);
      const receivedAmt = Math.max(0, totalAmt - balanceAmt);

      return {
        type: "Purchase",
        partyName: selectedParty?.name || "Supplier",
        partyPhone: selectedParty?.contact_phone || "",
        invoiceNo:
          item.reference_number ||
          record.po_number ||
          record.invoice_number ||
          `PO-${item.id.slice(0, 6)}`,
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
      toast.error("Failed to load purchase details: " + err.message);
      return null;
    }
  };

  // Preview & Print Purchase Invoice
  const handlePreviewInvoice = async (item: any) => {
    const data = await loadPurchaseInvoiceData(item);
    if (data) {
      setPreviewData(data);
      setPreviewOpen(true);
    }
  };

  // Delete Purchase Transaction
  const handleDeleteTransaction = async (item: any) => {
    if (
      !confirm(
        `Are you sure you want to permanently delete ${item.type} (${item.reference_number || item.id.slice(0, 8)})? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      const isInvoice = item.type === "Purchase Invoice";
      const tableName = isInvoice ? "purchase_invoices" : "purchase_orders";
      const itemsTable = isInvoice ? "purchase_invoice_items" : "purchase_order_items";
      const fkCol = isInvoice ? "invoice_id" : "purchase_order_id";

      try {
        await supabase.from(itemsTable).delete().eq(fkCol, item.id);
      } catch (e) {
        console.warn("Item deletion notice:", e);
      }

      try {
        await supabase.from("journal_entries").delete().eq("reference_id", item.id);
      } catch (e) {
        console.warn("Journal entry deletion notice:", e);
      }

      const { error } = await supabase.from(tableName).delete().eq("id", item.id);
      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["supplier-history", selectedParty?.id] });
      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      await queryClient.invalidateQueries({ queryKey: ["supplier-dues"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      toast.success(`${item.type} deleted successfully`);
    } catch (err: any) {
      toast.error("Failed to delete transaction: " + err.message);
    }
  };

  if (loadingSuppliers || loadingTb || loadingDues) {
    return <div className="p-8 flex justify-center text-gray-500">Loading payable parties...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 font-body overflow-hidden">
      {/* Top Navigation / Action Bar */}
      <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center text-gray-800 font-semibold text-lg">
          Suppliers (Payable)
        </div>
        <div className="flex items-center gap-2">
          <PartyTopActionBar
            allowedModes={["supplier"]}
            onSupplierCreated={(newSupplier) => {
              setActiveTab("all");
              if (newSupplier?.id) setSelectedPartyId(newSupplier.id);
            }}
          />
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Supplier by name or phone"
                className="pl-9 bg-gray-50 border-gray-200 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <div className="flex mt-4 border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "due"
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("due");
                  setSelectedPartyId(null);
                }}
              >
                Due Suppliers
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600 font-semibold"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("all");
                  setSelectedPartyId(null);
                }}
              >
                All Suppliers ({suppliers.length})
              </button>
            </div>

            <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-500 px-2">
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
                className={`flex justify-between items-center p-4 cursor-pointer text-sm transition-colors border-l-4 ${
                  selectedParty?.id === party.id
                    ? "bg-blue-50 border-blue-500"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-800">{party.name}</div>
                  {party.contact_phone && (
                    <div className="text-xs text-gray-400">{party.contact_phone}</div>
                  )}
                </div>
                <div className={`font-semibold ${party.balance > 0 ? "text-red-500" : "text-gray-400"}`}>
                  OMR {party.balance.toFixed(3)}
                </div>
              </div>
            ))}
            {partiesWithBalance.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {activeTab === "due"
                  ? "No suppliers with due balance found."
                  : "No suppliers found."}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedParty ? (
            <>
              {/* Selected Supplier Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-800 uppercase">{selectedParty.name}</h2>
                    <button
                      onClick={handleOpenEdit}
                      title="Quick Edit Supplier"
                      className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-500">Phone & Details</div>
                  <div className="text-sm text-gray-800 font-medium flex items-center gap-3 mt-0.5">
                    <span>{selectedParty.contact_phone || "N/A"}</span>
                    {selectedParty.contact_email && (
                      <span className="text-gray-400 font-normal">| {selectedParty.contact_email}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Due Balance</div>
                    <div className="text-xl font-bold text-red-500">
                      OMR {selectedParty.balance.toFixed(3)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {selectedParty.contact_phone ? (
                      <a
                        href={`tel:${selectedParty.contact_phone}`}
                        title={`Call ${selectedParty.contact_phone}`}
                        className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
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
                    <Link
                      to="/admin/suppliers"
                      title="View Suppliers Management"
                      className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 hover:bg-blue-100 transition-colors"
                    >
                      <Info className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Transactions Table Section */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-700">Transactions</h3>
                    <span className="text-xs text-gray-500">({filteredHistory.length})</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-500">
                    <button
                      onClick={() => setShowTxSearch(!showTxSearch)}
                      title="Search in transactions"
                      className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
                        showTxSearch ? "bg-gray-200 text-blue-600" : ""
                      }`}
                    >
                      <Search className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handlePrintStatement}
                      title="Print Statement"
                      className="p-1.5 rounded hover:bg-gray-200 hover:text-gray-800 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleExportCSV}
                      title="Export to Excel / CSV"
                      className="p-1.5 rounded hover:bg-green-50 text-green-600 hover:text-green-700 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Transaction Search Filter */}
                {showTxSearch && (
                  <div className="p-3 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <Input
                      placeholder="Filter by ref number, type, or date..."
                      value={txSearchTerm}
                      onChange={(e) => setTxSearchTerm(e.target.value)}
                      className="h-8 bg-white text-xs border-gray-300"
                    />
                    {txSearchTerm && (
                      <button
                        onClick={() => setTxSearchTerm("")}
                        className="text-gray-400 hover:text-gray-600 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Type</th>
                        <th className="px-6 py-3 font-semibold">Number</th>
                        <th className="px-6 py-3 font-semibold">Date</th>
                        <th className="px-6 py-3 font-semibold text-right">Total</th>
                        <th className="px-6 py-3 font-semibold text-right">Balance Due</th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingHistory ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            {txSearchTerm
                              ? "No matching transactions found."
                              : "No transactions found for this supplier."}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item: any) => {
                          const balance = item.balance;
                          const dateObj = new Date(item.date);
                          const formattedDate = !isNaN(dateObj.getTime())
                            ? `${dateObj.getDate().toString().padStart(2, "0")}/${(
                                dateObj.getMonth() + 1
                              )
                                .toString()
                                .padStart(2, "0")}/${dateObj.getFullYear()}`
                            : "-";

                          return (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                              <td className="px-6 py-4 text-gray-800 font-medium">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                                    item.type === "Purchase Order"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-purple-50 text-purple-700"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700 font-mono text-xs">
                                {item.reference_number || "-"}
                              </td>
                              <td className="px-6 py-4 text-gray-600">{formattedDate}</td>
                              <td className="px-6 py-4 text-right text-gray-800 font-medium">
                                OMR {Number(item.amount || 0).toFixed(3)}
                              </td>
                              <td
                                className={`px-6 py-4 text-right font-medium ${
                                  balance > 0 ? "text-red-500 font-semibold" : "text-emerald-600"
                                }`}
                              >
                                OMR {balance.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1.5 hover:bg-gray-200 rounded-full outline-none transition-colors">
                                      <MoreVertical className="w-4 h-4 text-gray-600" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-52 bg-white border border-gray-200 shadow-md">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        to={`/admin/purchases/new?edit=${item.id}&type=${encodeURIComponent(
                                          item.type
                                        )}`}
                                        className="cursor-pointer flex items-center gap-2 font-medium text-blue-600 hover:text-blue-700"
                                      >
                                        <Edit className="w-4 h-4 text-blue-500" />
                                        View / Edit (Pay Due)
                                      </Link>
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handlePreviewInvoice(item)}
                                      className="cursor-pointer flex items-center gap-2 text-gray-700"
                                    >
                                      <Eye className="w-4 h-4 text-gray-500" />
                                      Preview & Print
                                    </DropdownMenuItem>

                                    <DropdownMenuItem
                                      onClick={() => handlePreviewInvoice(item)}
                                      className="cursor-pointer flex items-center gap-2 text-gray-700"
                                    >
                                      <FileText className="w-4 h-4 text-gray-500" />
                                      Download PDF
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                      onClick={() => handleDeleteTransaction(item)}
                                      className="cursor-pointer flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                      Delete
                                    </DropdownMenuItem>
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
              <Building2 className="w-12 h-12 text-gray-300" />
              <div>Select a supplier from the list to view details and transactions</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Quick Edit Supplier Modal ── */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Supplier Information</DialogTitle>
            <DialogDescription>Update contact details for this supplier.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Supplier Name</Label>
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
                placeholder="e.g. supplier@example.com"
                value={editForm.contact_email}
                onChange={(e) => setEditForm({ ...editForm, contact_email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Address</Label>
              <Input
                placeholder="e.g. Muscat, Oman"
                value={editForm.address}
                onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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

export default PayablePartiesPage;
