import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Printer,
  Search,
  X
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";

export default function PurchaseOrdersPage() {
  // ── Filter state ─────────────────────────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [cardFilter, setCardFilter] = useState<"all" | "paid" | "unpaid" | "overdue">("all");

  const filters = {
    ...(filterSearch ? { search: filterSearch } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterSupplier ? { supplierId: filterSupplier } : {}),
    ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
    ...(filterDateTo ? { dateTo: filterDateTo } : {}),
  };

  const { orders, isLoading } = usePurchaseOrders(filters);
  const { suppliers } = useSuppliers();

  // ── Date range preset handler ───────────────────────────────────────────
  const handlePeriodChange = (preset: string) => {
    setSelectedPeriod(preset);
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();

    if (preset === "this-month") {
      const start = new Date(y, m, 1).toISOString().split("T")[0];
      const end = new Date(y, m + 1, 0).toISOString().split("T")[0];
      setFilterDateFrom(start);
      setFilterDateTo(end);
    } else if (preset === "last-month") {
      const start = new Date(y, m - 1, 1).toISOString().split("T")[0];
      const end = new Date(y, m, 0).toISOString().split("T")[0];
      setFilterDateFrom(start);
      setFilterDateTo(end);
    } else if (preset === "today") {
      const today = now.toISOString().split("T")[0];
      setFilterDateFrom(today);
      setFilterDateTo(today);
    } else if (preset === "yesterday") {
      const yesterday = new Date(now.setDate(now.getDate() - 1)).toISOString().split("T")[0];
      setFilterDateFrom(yesterday);
      setFilterDateTo(yesterday);
    } else if (preset === "this-week") {
      const d = new Date();
      const day = d.getDay() || 7;
      d.setDate(d.getDate() - day + 1);
      const start = d.toISOString().split("T")[0];
      const end = new Date(d.setDate(d.getDate() + 6)).toISOString().split("T")[0];
      setFilterDateFrom(start);
      setFilterDateTo(end);
    } else if (preset === "this-year") {
      setFilterDateFrom(`${y}-01-01`);
      setFilterDateTo(`${y}-12-31`);
    } else if (preset === "all") {
      setFilterDateFrom("");
      setFilterDateTo("");
    }
  };

  // Helper to determine if an item has overdue balance
  const isItemOverdue = (order: any) => {
    const balance = Number(order.balance_due || 0);
    if (balance <= 0) return false;
    if (order.status?.toLowerCase() === "cancelled") return false;

    if (order.expected_delivery_date) {
      return new Date(order.expected_delivery_date).getTime() < Date.now();
    }
    if (order.order_date) {
      const orderTime = new Date(order.order_date).getTime();
      return orderTime + 30 * 86_400_000 < Date.now();
    }
    return false;
  };

  // ── Metrics calculation: Paid + Unpaid + Overdue = Total ─────────────────
  const metrics = useMemo(() => {
    let paid = 0;
    let unpaid = 0;
    let overdue = 0;
    let total = 0;

    (orders || []).forEach((order) => {
      if (order.status?.toLowerCase() === "cancelled") return;

      const orderTotal = Number(order.total_amount || 0);
      const orderPaid = Number(order.paid_amount || 0);
      const orderBalance = Number(
        order.balance_due ?? Math.max(0, orderTotal - orderPaid)
      );

      total += orderTotal;
      paid += Math.min(orderPaid, orderTotal);

      if (isItemOverdue(order)) {
        overdue += orderBalance;
      } else {
        unpaid += orderBalance;
      }
    });

    return {
      paid,
      unpaid,
      overdue,
      total,
    };
  }, [orders]);

  // ── Filtered list with card selection ───────────────────────────────────
  const displayedOrders = useMemo(() => {
    return (orders || []).filter((order) => {
      if (cardFilter === "paid") {
        return (
          Number(order.balance_due || 0) <= 0 ||
          order.status?.toLowerCase() === "paid"
        );
      }
      if (cardFilter === "unpaid") {
        return (
          Number(order.balance_due || 0) > 0 && !isItemOverdue(order)
        );
      }
      if (cardFilter === "overdue") {
        return isItemOverdue(order);
      }
      return true;
    });
  }, [orders, cardFilter]);

  // ── Export CSV ───────────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (!displayedOrders || displayedOrders.length === 0) return;
    const headers = [
      "Date",
      "Type",
      "Reference No",
      "Supplier",
      "Payment Type",
      "Status",
      "Amount (OMR)",
      "Balance Due (OMR)",
    ];
    const rows = displayedOrders.map((o: any) => [
      o.order_date || "",
      o.type || "Purchase Order",
      o.po_number || "",
      o.suppliers?.name || "N/A",
      o.payment_type || "Cash",
      o.status || "",
      Number(o.total_amount || 0).toFixed(3),
      Number(o.balance_due || 0).toFixed(3),
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join(
        "\n"
      );
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `purchases_report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Purchases</h1>
          <p className="text-sm text-muted-foreground">
            Manage and track supplier purchases, payments, and dues.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 text-gray-700 hover:text-green-700 hover:border-green-300"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            <span>Excel Report</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-gray-700 hover:text-blue-700"
          >
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
        </div>
      </div>

      {/* ── Filter Bar matching screenshot ── */}
      <div className="flex flex-wrap items-center gap-3 p-3 border rounded-xl bg-white shadow-xs">
        {/* Period Preset Dropdown */}
        <div className="w-36">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="font-medium bg-gray-50 border-gray-200">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Between Date Pickers */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-1.5 rounded-md">
            Between
          </span>
          <Input
            type="date"
            className="w-36 bg-gray-50 border-gray-200 text-xs"
            value={filterDateFrom}
            onChange={(e) => {
              setFilterDateFrom(e.target.value);
              setSelectedPeriod("custom");
            }}
            title="Date From"
          />
          <span className="text-xs font-semibold text-gray-500">To</span>
          <Input
            type="date"
            className="w-36 bg-gray-50 border-gray-200 text-xs"
            value={filterDateTo}
            onChange={(e) => {
              setFilterDateTo(e.target.value);
              setSelectedPeriod("custom");
            }}
            title="Date To"
          />
        </div>

        {/* Supplier Dropdown */}
        <div className="w-44">
          <Select
            value={filterSupplier || "all"}
            onValueChange={(v) => setFilterSupplier(v === "all" ? "" : v)}
          >
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Dropdown */}
        <div className="w-36">
          <Select
            value={filterStatus || "all"}
            onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}
          >
            <SelectTrigger className="bg-gray-50 border-gray-200">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Paid">Paid</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(filterSearch ||
          filterStatus ||
          filterSupplier ||
          filterDateFrom ||
          filterDateTo ||
          cardFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSearch("");
              setFilterStatus("");
              setFilterSupplier("");
              setFilterDateFrom("");
              setFilterDateTo("");
              setSelectedPeriod("all");
              setCardFilter("all");
            }}
            className="text-gray-500 hover:text-gray-900"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* ── Summary Calculation Cards: Paid + Unpaid + Overdue = Total ── */}
      <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5 sm:gap-3 py-1">
        {/* Paid Card */}
        <button
          type="button"
          onClick={() => setCardFilter((prev) => (prev === "paid" ? "all" : "paid"))}
          className={`flex-1 min-w-[140px] p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
            cardFilter === "paid"
              ? "ring-3 ring-emerald-500 shadow-md scale-[1.02]"
              : "hover:shadow-md hover:scale-[1.01]"
          } bg-[#D7F4EB] border border-[#B6EAD9]`}
        >
          <span className="text-xs sm:text-sm font-semibold text-[#0E6245] block">
            Paid
          </span>
          <div className="text-lg sm:text-2xl font-black text-[#064E3B] tracking-tight mt-1 truncate">
            OMR {metrics.paid.toFixed(3)}
          </div>
        </button>

        {/* Plus Symbol */}
        <span className="text-xl sm:text-2xl font-black text-gray-400 self-center shrink-0 px-1 select-none">
          +
        </span>

        {/* Unpaid Card */}
        <button
          type="button"
          onClick={() => setCardFilter((prev) => (prev === "unpaid" ? "all" : "unpaid"))}
          className={`flex-1 min-w-[140px] p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
            cardFilter === "unpaid"
              ? "ring-3 ring-blue-500 shadow-md scale-[1.02]"
              : "hover:shadow-md hover:scale-[1.01]"
          } bg-[#D9E8FF] border border-[#B9D5FD]`}
        >
          <span className="text-xs sm:text-sm font-semibold text-[#1E40AF] block">
            Unpaid
          </span>
          <div className="text-lg sm:text-2xl font-black text-[#1E3A8A] tracking-tight mt-1 truncate">
            OMR {metrics.unpaid.toFixed(3)}
          </div>
        </button>

        {/* Plus Symbol */}
        <span className="text-xl sm:text-2xl font-black text-gray-400 self-center shrink-0 px-1 select-none">
          +
        </span>

        {/* Overdue Card */}
        <button
          type="button"
          onClick={() => setCardFilter((prev) => (prev === "overdue" ? "all" : "overdue"))}
          className={`flex-1 min-w-[140px] p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
            cardFilter === "overdue"
              ? "ring-3 ring-rose-500 shadow-md scale-[1.02]"
              : "hover:shadow-md hover:scale-[1.01]"
          } bg-[#FCE3DD] border border-[#F9C5BA]`}
        >
          <span className="text-xs sm:text-sm font-semibold text-[#991B1B] block">
            Overdue
          </span>
          <div className="text-lg sm:text-2xl font-black text-[#7F1D1D] tracking-tight mt-1 truncate">
            OMR {metrics.overdue.toFixed(3)}
          </div>
        </button>

        {/* Equals Symbol */}
        <span className="text-xl sm:text-2xl font-black text-gray-400 self-center shrink-0 px-1 select-none">
          =
        </span>

        {/* Total Card */}
        <button
          type="button"
          onClick={() => setCardFilter("all")}
          className={`flex-1 min-w-[140px] p-4 sm:p-5 rounded-2xl text-left transition-all duration-200 cursor-pointer ${
            cardFilter === "all"
              ? "ring-3 ring-amber-500 shadow-md scale-[1.02]"
              : "hover:shadow-md hover:scale-[1.01]"
          } bg-[#FDE6A8] border border-[#FAD678]`}
        >
          <span className="text-xs sm:text-sm font-semibold text-[#92400E] block">
            Total
          </span>
          <div className="text-lg sm:text-2xl font-black text-[#78350F] tracking-tight mt-1 truncate">
            OMR {metrics.total.toFixed(3)}
          </div>
        </button>
      </div>

      {/* ── Transactions Table Section ── */}
      <div className="border rounded-xl bg-white overflow-hidden shadow-xs">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/70">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold tracking-wider text-gray-700 uppercase">
              Transactions
            </h2>
            <span className="text-xs bg-gray-200 text-gray-700 font-semibold px-2 py-0.5 rounded-full">
              {displayedOrders.length}
            </span>
            {cardFilter !== "all" && (
              <span className="text-xs bg-blue-100 text-blue-800 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                Filtered by {cardFilter}
                <X
                  className="w-3 h-3 cursor-pointer"
                  onClick={() => setCardFilter("all")}
                />
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-xs bg-white"
              placeholder="Search reference, supplier..."
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
            />
            {filterSearch && (
              <button
                onClick={() => setFilterSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gray-50/60">
              <TableRow>
                <TableHead className="text-xs uppercase font-bold text-gray-600">
                  Date
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600">
                  Invoice / PO No.
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600">
                  Party Name
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600">
                  Payment Type
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600">
                  Status
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600 text-right">
                  Amount
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600 text-right">
                  Balance Due
                </TableHead>
                <TableHead className="text-xs uppercase font-bold text-gray-600 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" />
                    <p className="text-xs text-gray-500 mt-2">Loading transactions...</p>
                  </TableCell>
                </TableRow>
              ) : (
                displayedOrders.map((order: any) => {
                  const balance = Number(order.balance_due || 0);
                  const isOverdue = isItemOverdue(order);
                  const orderDate = order.order_date
                    ? new Date(order.order_date).toLocaleDateString("en-GB")
                    : "-";

                  return (
                    <TableRow key={order.id} className="hover:bg-gray-50/80 transition-colors">
                      <TableCell className="text-xs text-gray-700 font-medium whitespace-nowrap">
                        {orderDate}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-gray-900 font-semibold text-xs">
                            {order.po_number || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-xs text-gray-800">
                        {order.suppliers?.name || "N/A"}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-semibold ${
                            order.payment_type === "Bank"
                              ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                              : order.payment_type === "Credit"
                              ? "bg-amber-50 text-amber-700 border border-amber-200"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          }`}
                        >
                          {order.payment_type || "Cash"}
                        </span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            order.status?.toLowerCase() === "received" ||
                            order.status?.toLowerCase() === "paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.status?.toLowerCase() === "confirmed"
                              ? "bg-blue-100 text-blue-800"
                              : order.status?.toLowerCase() === "cancelled"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {order.status || "Draft"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs text-gray-900 whitespace-nowrap">
                        OMR {Number(order.total_amount || 0).toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <span
                          className={`font-bold text-xs ${
                            balance > 0
                              ? isOverdue
                                ? "text-rose-600 bg-rose-50 px-2 py-0.5 rounded"
                                : "text-amber-700 bg-amber-50 px-2 py-0.5 rounded"
                              : "text-emerald-700"
                          }`}
                        >
                          OMR {balance.toFixed(3)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-1">
                          <Link
                            to={`/admin/purchases/new?edit=${order.id}&type=${encodeURIComponent(
                              order.type || "Purchase Order"
                            )}`}
                            title="Edit / Pay Due"
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                            </Button>
                          </Link>
                          <Link
                            to={`/admin/purchase-orders/${order.id}`}
                            title="View Details"
                          >
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="w-3.5 h-3.5 text-gray-500" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
              {(!displayedOrders || displayedOrders.length === 0) && !isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center py-12 text-muted-foreground"
                  >
                    No purchases found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}

