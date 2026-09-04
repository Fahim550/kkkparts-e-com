import React, { useState, useMemo } from "react";
import { useInventory } from "../hooks/useInventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, Layers, Search, X } from "lucide-react";
import { format } from "date-fns";

export default function FifoCostLayersPage() {
  const { fifoLayers, isLoadingFifo } = useInventory();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLayers = useMemo(() => {
    if (!fifoLayers) return [];
    if (!searchTerm.trim()) return fifoLayers;
    const q = searchTerm.toLowerCase();
    return fifoLayers.filter((layer) => {
      // @ts-ignore
      const name = layer.product_variations?.products?.name?.toLowerCase() || "";
      // @ts-ignore
      const sku = layer.product_variations?.sku?.toLowerCase() || "";
      // @ts-ignore
      const wh = layer.warehouses?.name?.toLowerCase() || "";
      return name.includes(q) || sku.includes(q) || wh.includes(q);
    });
  }, [fifoLayers, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">FIFO Cost Layers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all active stock lots, purchase costs, and remaining quantities. Layers are consumed First-In-First-Out on sales.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9 pr-8 h-9 text-sm"
            placeholder="Search product name, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="border rounded-md bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">Arrival Date</TableHead>
              <TableHead>Product Name & SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Original Qty</TableHead>
              <TableHead className="text-right">Remaining Qty</TableHead>
              <TableHead className="text-right">Unit Cost (OMR)</TableHead>
              <TableHead className="text-right">Current Value (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingFifo ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-600" />
                </TableCell>
              </TableRow>
            ) : filteredLayers?.map((layer) => {
              const d = new Date(layer.transaction_date);
              const isValidDate = !isNaN(d.getTime());
              // @ts-ignore
              const productName = layer.product_variations?.products?.name || "Product";
              // @ts-ignore
              const productSku = layer.product_variations?.sku || "—";
              // @ts-ignore
              const warehouseName = layer.warehouses?.name || "—";

              return (
                <TableRow key={layer.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Arrival Date in 2 rows: Date on row 1, Time on row 2 */}
                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">
                        {isValidDate ? format(d, "dd MMM yyyy") : "—"}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {isValidDate ? format(d, "hh:mm a") : ""}
                      </span>
                    </div>
                  </TableCell>

                  {/* Product in 2 rows: Product Name on row 1, SKU on row 2 */}
                  <TableCell>
                    <div className="flex flex-col max-w-[320px]">
                      <span className="font-semibold text-gray-900 text-sm truncate" title={productName}>
                        {productName}
                      </span>
                      <div className="flex items-center text-xs text-muted-foreground font-mono mt-0.5">
                        <Layers className="w-3 h-3 mr-1 text-indigo-500 shrink-0" />
                        <span>{productSku}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-sm text-gray-700">{warehouseName}</TableCell>
                  <TableCell className="text-right text-muted-foreground text-sm">{layer.original_quantity}</TableCell>
                  <TableCell className="text-right font-bold text-blue-600 text-sm">{layer.quantity_remaining}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-sm">
                    OMR {Number(layer.unit_cost).toFixed(3)}
                  </TableCell>
                  <TableCell className="text-right font-bold font-mono text-gray-900 text-sm">
                    OMR {(Number(layer.quantity_remaining) * Number(layer.unit_cost)).toFixed(3)}
                  </TableCell>
                </TableRow>
              );
            })}
            {(!filteredLayers || filteredLayers.length === 0) && !isLoadingFifo && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  {searchTerm ? "No FIFO cost layers match your search." : "No active FIFO cost layers found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
