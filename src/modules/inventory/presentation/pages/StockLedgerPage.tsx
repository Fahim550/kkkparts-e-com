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
import { Loader2, ArrowRightLeft, ArrowUpRight, ArrowDownRight, PackageMinus, Settings2 } from "lucide-react";
import { format } from "date-fns";

export default function StockLedgerPage() {
  const { ledgers, isLoadingLedgers } = useInventory();

  const getMovementIcon = (type: string) => {
    switch(type) {
      case 'PURCHASE_RECEIPT': return <ArrowDownRight className="w-4 h-4 text-green-500 mr-2" />;
      case 'SALES_DELIVERY': return <ArrowUpRight className="w-4 h-4 text-blue-500 mr-2" />;
      case 'INVENTORY_ADJUSTMENT': return <Settings2 className="w-4 h-4 text-purple-500 mr-2" />;
      case 'DAMAGE_WRITE_OFF': return <PackageMinus className="w-4 h-4 text-red-500 mr-2" />;
      case 'INTERNAL_TRANSFER': return <ArrowRightLeft className="w-4 h-4 text-orange-500 mr-2" />;
      default: return <ArrowRightLeft className="w-4 h-4 text-gray-500 mr-2" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Stock Movement Ledger</h1>
      </div>
      <p className="text-muted-foreground">Comprehensive, immutable audit trail of all inventory movements handled by the Inventory Engine.</p>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Movement Type</TableHead>
              <TableHead>Product SKU</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Reference ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoadingLedgers ? (
              <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : ledgers?.map((ledger) => (
              <TableRow key={ledger.id}>
                <TableCell className="whitespace-nowrap">
                  {format(new Date(ledger.transaction_date), "yyyy-MM-dd HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    {getMovementIcon(ledger.reference_type)}
                    <span className="text-sm font-medium">{ledger.reference_type}</span>
                  </div>
                </TableCell>
                {/* @ts-ignore */}
                <TableCell>{ledger.product_variations?.sku}</TableCell>
                {/* @ts-ignore */}
                <TableCell>{ledger.warehouses?.name}</TableCell>
                <TableCell className="text-right">
                  <span className={`font-bold ${ledger.quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {ledger.quantity > 0 ? '+' : ''}{ledger.quantity}
                  </span>
                </TableCell>
                <TableCell className="text-right text-xs font-mono text-muted-foreground truncate max-w-[150px]" title={ledger.reference_id}>
                  {ledger.reference_id.substring(0, 8)}...
                </TableCell>
              </TableRow>
            ))}
            {(!ledgers || ledgers.length === 0) && !isLoadingLedgers && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No stock movements found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
