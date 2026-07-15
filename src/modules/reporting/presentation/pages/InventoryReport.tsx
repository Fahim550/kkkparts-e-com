import React from "react";
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
import { Loader2, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function InventoryReport() {
  const { data: inventory, isLoading } = useInventoryReport();

  const handleExport = () => {
    if (!inventory) return;
    const headers = "SKU,Product Name,Quantity on Hand,Total Value (FIFO cost)\n";
    const rows = inventory.map(i => `${i.sku},"${i.name}",${i.quantity},${i.total_value}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_valuation_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const grandTotalValue = inventory?.reduce((sum, item) => sum + item.total_value, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Valuation Report</h1>
        <Button variant="outline" onClick={handleExport} disabled={!inventory || inventory.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
          <CardTitle>Current Stock & Value</CardTitle>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Total Warehouse Value</p>
            <p className="text-2xl font-bold text-blue-600">${grandTotalValue.toFixed(2)}</p>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Product Name</TableHead>
                  <TableHead className="text-right">Quantity on Hand</TableHead>
                  <TableHead className="text-right">Total FIFO Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventory?.map((item) => (
                  <TableRow key={item.variation_id}>
                    <TableCell className="font-mono">{item.sku}</TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell className="text-right">
                      <span className={item.quantity < 10 ? 'text-red-500 font-bold' : ''}>
                        {item.quantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${item.total_value.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!inventory || inventory.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No inventory data found.</TableCell>
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
