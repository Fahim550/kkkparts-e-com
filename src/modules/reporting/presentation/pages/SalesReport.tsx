import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useSalesReport } from "../hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  FileText,
  Monitor,
  ArrowDownToLine,
  Search,
  ShoppingBag,
  DollarSign,
  Receipt,
  X,
  Calendar,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesReport() {
  const { data: sales, isLoading } = useSalesReport();
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateQuickFilter, setDateQuickFilter] = useState("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  // Filtered sales
  const filteredSales = useMemo(() => {
    if (!sales) return [];

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
    const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 86400000);
    const startOf30DaysAgo = new Date(startOfToday.getTime() - 30 * 86400000);
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return sales.filter((item) => {
      const itemDate = new Date(item.date);

      // Search match
      const matchSearch =
        !searchTerm ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer?.toLowerCase().includes(searchTerm.toLowerCase());

      // Source match
      const matchSource =
        sourceFilter === "all" || item.source.toLowerCase() === sourceFilter.toLowerCase();

      // Status match
      const matchStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();

      // Date match
      let matchDate = true;
      if (dateQuickFilter === "today") {
        matchDate = itemDate >= startOfToday;
      } else if (dateQuickFilter === "yesterday") {
        matchDate = itemDate >= startOfYesterday && itemDate < startOfToday;
      } else if (dateQuickFilter === "7d") {
        matchDate = itemDate >= startOf7DaysAgo;
      } else if (dateQuickFilter === "30d") {
        matchDate = itemDate >= startOf30DaysAgo;
      } else if (dateQuickFilter === "this_month") {
        matchDate = itemDate >= startOfThisMonth;
      } else if (dateQuickFilter === "custom" && customStartDate) {
        const from = new Date(customStartDate);
        from.setHours(0, 0, 0, 0);
        const to = customEndDate ? new Date(customEndDate) : new Date();
        to.setHours(23, 59, 59, 999);
        matchDate = itemDate >= from && itemDate <= to;
      }

      return matchSearch && matchSource && matchStatus && matchDate;
    });
  }, [sales, searchTerm, sourceFilter, statusFilter, dateQuickFilter, customStartDate, customEndDate]);

  // Derived metrics dynamically based on filtered data
  const metrics = useMemo(() => {
    const list = filteredSales;
    const totalRevenue = list.reduce((sum, s) => sum + (s.amount || 0), 0);
    const orderSales = list.filter((s) => s.source === "Order").reduce((sum, s) => sum + (s.amount || 0), 0);
    const posSales = list.filter((s) => s.source === "POS").reduce((sum, s) => sum + (s.amount || 0), 0);
    const invoiceSales = list.filter((s) => s.source === "Invoice").reduce((sum, s) => sum + (s.amount || 0), 0);
    return {
      totalRevenue,
      orderSales,
      posSales,
      invoiceSales,
      count: list.length,
    };
  }, [filteredSales]);

  // Paginated records
  const totalPages = Math.max(1, Math.ceil(filteredSales.length / pageSize));
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredSales.slice(start, start + pageSize);
  }, [filteredSales, currentPage, pageSize]);

  const handleExport = () => {
    if (!filteredSales || filteredSales.length === 0) return;
    const headers = "Date,Reference,Customer,Source,Status,Amount (OMR)\n";
    const rows = filteredSales
      .map(
        (s) =>
          `"${new Date(s.date).toLocaleString()}","${s.reference}","${s.customer}","${s.source}","${s.status}",${s.amount.toFixed(3)}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSourceFilter("all");
    setStatusFilter("all");
    setDateQuickFilter("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales & Revenue Report</h1>
          <p className="text-sm text-muted-foreground">Unified ledger across customer orders, POS in-store walk-in receipts, and invoices.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!filteredSales || filteredSales.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export CSV ({filteredSales.length})
        </Button>
      </div>

      {/* Dynamic Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Filtered Sales Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">OMR {metrics.totalRevenue.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.count} transactions in selection</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Customer Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">OMR {metrics.orderSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct sales orders</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">POS Store Sales</CardTitle>
            <Monitor className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">OMR {metrics.posSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Counter walk-in receipts</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Sales Invoices</CardTitle>
            <Receipt className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">OMR {metrics.invoiceSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct billed invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 border rounded-lg shadow-sm space-y-3">
        {/* Row 1: Search, Source, Status */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              className="pl-9"
              placeholder="Search reference, customer name..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="w-36">
            <Select
              value={sourceFilter}
              onValueChange={(v) => {
                setSourceFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Sources" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="order">Orders</SelectItem>
                <SelectItem value="pos">POS Receipts</SelectItem>
                <SelectItem value="invoice">Invoices</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-36">
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="invoiced">Invoiced</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 2: Date Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t text-sm">
          <span className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5" /> Date:
          </span>
          {[
            { key: "all", label: "All Time" },
            { key: "today", label: "Today" },
            { key: "yesterday", label: "Yesterday" },
            { key: "7d", label: "Last 7 Days" },
            { key: "this_month", label: "This Month" },
            { key: "30d", label: "Last 30 Days" },
            { key: "custom", label: "Custom Range" },
          ].map((df) => (
            <button
              key={df.key}
              onClick={() => {
                setDateQuickFilter(df.key);
                setCurrentPage(1);
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                dateQuickFilter === df.key
                  ? "bg-blue-600 text-white font-medium"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {df.label}
            </button>
          ))}

          {dateQuickFilter === "custom" && (
            <div className="flex items-center gap-1 ml-2">
              <Input
                type="date"
                className="w-32 h-8 text-xs"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
              <span className="text-xs text-gray-400">to</span>
              <Input
                type="date"
                className="w-32 h-8 text-xs"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          )}

          {(searchTerm || sourceFilter !== "all" || statusFilter !== "all" || dateQuickFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-xs h-8 text-gray-500 hover:text-gray-800"
              onClick={handleResetFilters}
            >
              <X className="w-3.5 h-3.5 mr-1" /> Reset All Filters
            </Button>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-semibold">
            Transactions ({filteredSales.length})
          </CardTitle>
          <div className="text-xs text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount (OMR)</TableHead>
                  <TableHead className="text-center w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSales.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.date).toLocaleString("en-GB", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        {item.source === "POS" ? (
                          <span className="inline-flex items-center text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <Monitor className="w-3 h-3 mr-1" /> POS
                          </span>
                        ) : item.source === "Order" ? (
                          <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <ShoppingBag className="w-3 h-3 mr-1" /> Order
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs font-semibold">
                            <FileText className="w-3 h-3 mr-1" /> Invoice
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.detail_url ? (
                        <Link
                          to={item.detail_url}
                          className="font-mono text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"
                        >
                          {item.reference}
                          <ExternalLink className="w-3 h-3 text-gray-400" />
                        </Link>
                      ) : (
                        <span className="font-mono text-sm font-semibold text-gray-900">{item.reference}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-gray-700">{item.customer}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status.toLowerCase() === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : item.status.toLowerCase() === "invoiced"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900 font-mono">
                      OMR {item.amount.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.detail_url && (
                        <Link to={item.detail_url}>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="View details">
                            <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                          </Button>
                        </Link>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No sales transactions found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-4 text-sm text-gray-600">
              <div>
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredSales.length)} of {filteredSales.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                <span className="text-xs font-medium">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
