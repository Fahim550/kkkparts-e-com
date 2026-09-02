import React, { useState, useMemo } from "react";
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
import { Loader2, FileText, Monitor, ArrowDownToLine, Search, ShoppingBag, DollarSign, Receipt, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesReport() {
  const { data: sales, isLoading } = useSalesReport();
  const [searchTerm, setSearchTerm] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filtered sales
  const filteredSales = useMemo(() => {
    if (!sales) return [];
    return sales.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.customer?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchSource =
        sourceFilter === "all" || item.source.toLowerCase() === sourceFilter.toLowerCase();
      const matchStatus =
        statusFilter === "all" || item.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchSource && matchStatus;
    });
  }, [sales, searchTerm, sourceFilter, statusFilter]);

  // Derived metrics
  const metrics = useMemo(() => {
    const list = sales || [];
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
  }, [sales]);

  const handleExport = () => {
    if (!filteredSales || filteredSales.length === 0) return;
    const headers = "Date,Reference,Customer,Source,Status,Amount (OMR)\n";
    const rows = filteredSales
      .map(
        (s) =>
          `"${new Date(s.date).toLocaleString()}","${s.reference}","${s.customer}","${s.source}","${s.status}",${s.amount.toFixed(3)}`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
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
          <p className="text-sm text-muted-foreground">Unified report across Customer Orders, POS In-Store Sales, and Invoices.</p>
        </div>
        <Button variant="outline" onClick={handleExport} disabled={!filteredSales || filteredSales.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sales Revenue</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">OMR {metrics.totalRevenue.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">{metrics.count} total transactions</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Customer Orders</CardTitle>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">OMR {metrics.orderSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct customer orders</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">POS Sales</CardTitle>
            <Monitor className="w-4 h-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">OMR {metrics.posSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">In-store walk-in receipts</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Invoices</CardTitle>
            <Receipt className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">OMR {metrics.invoiceSales.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Direct billing invoices</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 border rounded-lg shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search reference, customer name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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

        <div className="w-40">
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="order">Orders</SelectItem>
              <SelectItem value="pos">POS</SelectItem>
              <SelectItem value="invoice">Invoices</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-40">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {(searchTerm || sourceFilter !== "all" || statusFilter !== "all") && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setSourceFilter("all");
              setStatusFilter("all");
            }}
          >
            <X className="w-4 h-4 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Transactions Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Transactions ({filteredSales.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount (OMR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <TableCell className="whitespace-nowrap text-sm text-gray-600">
                      {new Date(item.date).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm font-medium">
                        {item.source === "POS" ? (
                          <span className="inline-flex items-center text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-xs">
                            <Monitor className="w-3 h-3 mr-1" /> POS
                          </span>
                        ) : item.source === "Order" ? (
                          <span className="inline-flex items-center text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-xs">
                            <ShoppingBag className="w-3 h-3 mr-1" /> Order
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-xs">
                            <FileText className="w-3 h-3 mr-1" /> Invoice
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm font-semibold text-gray-900">{item.reference}</TableCell>
                    <TableCell className="text-sm text-gray-700">{item.customer}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          item.status.toLowerCase() === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold text-gray-900">
                      OMR {item.amount.toFixed(3)}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredSales.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No sales transactions found matching your criteria.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
