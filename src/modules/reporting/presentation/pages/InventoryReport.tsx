import React, { useState, useMemo } from "react";
import { useInventoryReport } from "../hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  ArrowDownToLine,
  Search,
  X,
  AlertTriangle,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  Warehouse,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function InventoryReport() {
  const { data: inventory, isLoading } = useInventoryReport();
  const [searchTerm, setSearchTerm] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 25;

  const filteredInventory = useMemo(() => {
    if (!inventory) return [];
    return inventory.filter((item) => {
      const matchSearch =
        !searchTerm ||
        item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchLowStock = !lowStockOnly || item.quantity <= 5;
      return matchSearch && matchLowStock;
    });
  }, [inventory, searchTerm, lowStockOnly]);

  const grandTotalValue = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (item.total_value || 0), 0);
  }, [filteredInventory]);

  const totalUnits = useMemo(() => {
    return filteredInventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [filteredInventory]);

  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / pageSize));
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredInventory.slice(start, start + pageSize);
  }, [filteredInventory, currentPage, pageSize]);

  const handleExport = () => {
    if (!filteredInventory || filteredInventory.length === 0) return;
    const headers = "SKU,Product Name,Quantity on Hand,Average Unit Cost (OMR),Total Value (OMR),Warehouses\n";
    const rows = filteredInventory
      .map((i) => {
        const avgCost = i.unit_cost ?? (i.quantity > 0 ? i.total_value / i.quantity : 0);
        const whStr = (i.warehouse_breakdown || []).map((w) => `${w.warehouse_name}:${w.quantity}`).join("; ");
        return `"${i.sku}","${i.name.replace(/"/g, '""')}",${i.quantity},${avgCost.toFixed(3)},${i.total_value.toFixed(3)},"${whStr}"`;
      })
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_valuation_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
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
          <h1 className="text-2xl font-bold tracking-tight">Inventory Valuation Report</h1>
          <p className="text-sm text-muted-foreground">
            Current stock lots, unit costs, and warehouse valuation calculated via FIFO layers.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleExport}
          disabled={!filteredInventory || filteredInventory.length === 0}
        >
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export CSV ({filteredInventory.length})
        </Button>
      </div>

      {/* Summary KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Warehouse Value</CardTitle>
            <Layers className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">OMR {grandTotalValue.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Based on active FIFO purchase costs</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Physical Units</CardTitle>
            <Package className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUnits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all warehouses & bins</p>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Unique Active SKUs</CardTitle>
            <Warehouse className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{filteredInventory.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Products with stock on hand &gt; 0</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 border rounded-lg shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Search by SKU or Product Name..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
          {searchTerm && (
            <button
              onClick={() => {
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          variant={lowStockOnly ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setLowStockOnly(!lowStockOnly);
            setCurrentPage(1);
          }}
          className="gap-1.5"
        >
          <AlertTriangle className="w-4 h-4" />
          {lowStockOnly ? "Showing Low Stock (≤ 5)" : "Filter Low Stock (≤ 5)"}
        </Button>

        {(searchTerm || lowStockOnly) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearchTerm("");
              setLowStockOnly(false);
              setCurrentPage(1);
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Reset
          </Button>
        )}
      </div>

      {/* Inventory Table */}
      <Card className="bg-white shadow-sm border">
        <CardHeader className="flex flex-row justify-between items-center pb-3">
          <CardTitle className="text-base font-semibold">
            Stock Valuation ({filteredInventory.length} SKUs)
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
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Warehouse Breakdown</TableHead>
                  <TableHead className="text-right">Qty on Hand</TableHead>
                  <TableHead className="text-right">Avg Unit Cost (OMR)</TableHead>
                  <TableHead className="text-right">Total FIFO Value (OMR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => {
                  const avgCost =
                    item.unit_cost ?? (item.quantity > 0 ? item.total_value / item.quantity : 0);
                  const isLowStock = item.quantity <= 5;

                  return (
                    <TableRow key={item.variation_id} className="hover:bg-slate-50/80 transition-colors">
                      <TableCell className="font-mono text-sm font-semibold text-gray-900">
                        {item.sku}
                      </TableCell>
                      <TableCell className="font-medium text-sm text-gray-800">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {item.warehouse_breakdown && item.warehouse_breakdown.length > 0 ? (
                            item.warehouse_breakdown.map((wh, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs font-normal">
                                {wh.warehouse_name}: <strong className="ml-1">{wh.quantity}</strong>
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-gray-400">Main Warehouse</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isLowStock ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {item.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-gray-600">
                        OMR {avgCost.toFixed(3)}
                      </TableCell>
                      <TableCell className="text-right font-bold text-sm text-blue-700 font-mono">
                        OMR {item.total_value.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredInventory.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                      No inventory items found matching your criteria.
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
                {Math.min(currentPage * pageSize, filteredInventory.length)} of {filteredInventory.length} SKUs
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
