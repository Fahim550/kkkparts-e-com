import React from "react";
import { useInventory } from "../hooks/useInventory";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, Layers } from "lucide-react";
import { format } from "date-fns";

export default function FifoCostLayersPage() {
  const { fifoLayers, isLoadingFifo } = useInventory();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">FIFO Cost Layers</h1>
      </div>
      <p className="text-muted-foreground">View all active stock lots and their respective valuation costs. These layers are consumed strictly in First-In-First-Out order during outbound movements.</p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Arrival Date</TableHead>
              <TableHead>Product SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Original Qty</TableHead>
              <TableHead className="text-right">Remaining Qty</TableHead>
              <TableHead className="text-right">Unit Cost (OMR)</TableHead>
              <TableHead className="text-right">Current Value (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingFifo ? (
              <TableRow><TableCell colSpan={7} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : fifoLayers?.map((layer) => (
              <TableRow key={layer.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(layer.transaction_date), "yyyy-MM-dd HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center font-medium">
                    <Layers className="w-4 h-4 mr-2 text-indigo-500" />
                    {/* @ts-ignore */}
                    {layer.product_variations?.sku}
                  </div>
                </TableCell>
                {/* @ts-ignore */}
                <TableCell>{layer.warehouses?.name}</TableCell>
                <TableCell className="text-right text-muted-foreground">{layer.original_quantity}</TableCell>
                <TableCell className="text-right font-bold text-blue-600">{layer.quantity_remaining}</TableCell>
                <TableCell className="text-right font-mono">OMR {Number(layer.unit_cost).toFixed(3)}</TableCell>
                <TableCell className="text-right font-bold font-mono">
                  OMR {(Number(layer.quantity_remaining) * Number(layer.unit_cost)).toFixed(3)}
                </TableCell>
              </TableRow>
            ))}
            {(!fifoLayers || fifoLayers.length === 0) && !isLoadingFifo && (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No active FIFO cost layers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
