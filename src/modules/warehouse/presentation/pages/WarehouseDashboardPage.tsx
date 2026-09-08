import React, { useState, useMemo, useEffect } from "react";
import { useWarehouses } from "../hooks/useWarehouses";
import { useStock } from "../hooks/useStock";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Loader2,
  PackageSearch,
  ShoppingCart,
  TrendingDown,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function WarehouseDashboardPage() {
  const navigate = useNavigate();
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");
  const [filterMode, setFilterMode] = useState<"all" | "negative" | "positive">("all");

  const { balances, isLoadingBalances } = useStock(selectedWarehouse);

  // Default to first warehouse once loaded
  useEffect(() => {
    if (!selectedWarehouse && warehouses && warehouses.length > 0) {
      setSelectedWarehouse(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouse]);

  // Compute stock health metrics
  const { inStockCount, negativeBalances, negativeCount, totalDeficitQty } = useMemo(() => {
    if (!balances) {
      return { inStockCount: 0, negativeBalances: [], negativeCount: 0, totalDeficitQty: 0 };
    }
    const inStock = balances.filter((b) => Number(b.quantity) > 0).length;
    const negative = balances.filter((b) => Number(b.quantity) < 0);
    const deficitQty = negative.reduce((sum, b) => sum + Math.abs(Number(b.quantity)), 0);

    return {
      inStockCount: inStock,
      negativeBalances: negative,
      negativeCount: negative.length,
      totalDeficitQty: deficitQty,
    };
  }, [balances]);

  // Filter list based on selected tab
  const filteredBalances = useMemo(() => {
    if (!balances) return [];
    if (filterMode === "negative") {
      return balances.filter((b) => Number(b.quantity) < 0);
    }
    if (filterMode === "positive") {
      return balances.filter((b) => Number(b.quantity) > 0);
    }
    return balances;
  }, [balances, filterMode]);

  if (isLoadingWarehouses)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Warehouse Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time inventory balances, track negative stock deficits, and initiate purchase reorders.
          </p>
        </div>

        <div className="w-72">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">Selected Warehouse</Label>
          <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
            <SelectTrigger className="h-10 mt-1">
              <SelectValue placeholder="Select a warehouse..." />
            </SelectTrigger>
            <SelectContent>
              {warehouses?.map((wh) => (
                <SelectItem key={wh.id} value={wh.id}>
                  {wh.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedWarehouse && (
        <>
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Total Tracked Items
                  </p>
                  <p className="text-2xl font-bold mt-1">{balances?.length || 0}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Product variations in location</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <Boxes className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    In Stock (Healthy)
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">{inStockCount}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Available for dispatch</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>

            <Card
              className={`shadow-sm transition-all cursor-pointer ${
                negativeCount > 0
                  ? "border-red-300 dark:border-red-900 bg-red-50/50 dark:bg-red-950/20"
                  : ""
              }`}
              onClick={() => setFilterMode(negativeCount > 0 ? "negative" : "all")}
            >
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-red-600 dark:text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Negative Stock Deficit
                  </p>
                  <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                    {negativeCount} Items
                  </p>
                  <p className="text-xs text-red-700/80 dark:text-red-400/80 mt-0.5 font-medium">
                    {totalDeficitQty} units need purchasing
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-950 text-red-600 flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Negative Stock Alert Banner */}
          {negativeCount > 0 && (
            <div className="rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-semibold text-red-900 dark:text-red-200">
                    Action Required: {negativeCount} Product(s) Sold on Deficit
                  </h4>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                    Items were sold via quick sale/POS without prior purchase entry. A total of{" "}
                    <strong>{totalDeficitQty} units</strong> must be purchased to reconcile inventory balances.
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant={filterMode === "negative" ? "default" : "destructive"}
                className="shrink-0 h-8 text-xs font-semibold"
                onClick={() => setFilterMode("negative")}
              >
                {filterMode === "negative" ? "Viewing Deficit Items" : "View Deficit Items Only"}
              </Button>
            </div>
          )}

          {/* Main Balances Table Card */}
          <Card>
            <CardHeader className="pb-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="flex items-center text-base">
                <PackageSearch className="w-5 h-5 mr-2 text-primary" /> Stock Balances & Deficit Manager
              </CardTitle>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted/60 border text-xs">
                <Button
                  type="button"
                  variant={filterMode === "all" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setFilterMode("all")}
                >
                  All Items ({balances?.length || 0})
                </Button>
                <Button
                  type="button"
                  variant={filterMode === "positive" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3"
                  onClick={() => setFilterMode("positive")}
                >
                  In Stock ({inStockCount})
                </Button>
                <Button
                  type="button"
                  variant={filterMode === "negative" ? "destructive" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3 flex items-center gap-1.5"
                  onClick={() => setFilterMode("negative")}
                >
                  Deficit / Negative
                  {negativeCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-red-600 text-white text-[10px] font-bold">
                      {negativeCount}
                    </span>
                  )}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-4">
              {isLoadingBalances ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="animate-spin w-6 h-6 text-primary" />
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead>Bin Location</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead>Inventory Status</TableHead>
                        <TableHead className="text-right">Reorder Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBalances.map((balance) => {
                        const qty = Number(balance.quantity || 0);
                        const isNegative = qty < 0;
                        const isZero = qty === 0;

                        return (
                          <TableRow
                            key={balance.id}
                            className={
                              isNegative ? "bg-red-50/40 dark:bg-red-950/20 hover:bg-red-50/60" : ""
                            }
                          >
                            <TableCell className="font-medium">
                              {/* @ts-ignore */}
                              {balance.product_variations?.products?.name || "Unnamed Product"}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                              {/* @ts-ignore */}
                              {balance.product_variations?.sku || "—"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {/* @ts-ignore */}
                              {balance.warehouse_bins?.name || "Unassigned"}
                            </TableCell>
                            <TableCell
                              className={`text-right font-bold text-sm ${
                                isNegative
                                  ? "text-red-600 dark:text-red-400 font-mono"
                                  : isZero
                                  ? "text-muted-foreground"
                                  : "text-emerald-600 dark:text-emerald-400"
                              }`}
                            >
                              {qty}
                            </TableCell>
                            <TableCell>
                              {isNegative ? (
                                <Badge variant="destructive" className="text-[11px] font-semibold gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Deficit ({Math.abs(qty)} Units Short)
                                </Badge>
                              ) : isZero ? (
                                <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                  Out of Stock
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[11px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                                  Available
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {isNegative ? (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white gap-1.5 shadow-sm"
                                  onClick={() =>
                                    navigate(
                                      `/admin/purchases/new?variation_id=${balance.variation_id}&qty=${Math.abs(
                                        qty
                                      )}&warehouse_id=${selectedWarehouse}`
                                    )
                                  }
                                >
                                  <ShoppingCart className="w-3.5 h-3.5" />
                                  Reorder ({Math.abs(qty)})
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1"
                                  onClick={() =>
                                    navigate(
                                      `/admin/purchases/new?variation_id=${balance.variation_id}&warehouse_id=${selectedWarehouse}`
                                    )
                                  }
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                  Purchase
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {filteredBalances.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                            {filterMode === "negative"
                              ? "✅ Great news! No negative stock deficits found in this warehouse."
                              : "No stock balances found in this warehouse."}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
