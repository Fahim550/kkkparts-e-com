import React, { useState } from "react";
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
import { Loader2, PackageSearch } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function WarehouseDashboardPage() {
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  const { balances, isLoadingBalances } = useStock(selectedWarehouse);

  if (isLoadingWarehouses)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Warehouse Dashboard
        </h1>
      </div>

      <div className="w-72">
        <Label>Select Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger>
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

      {selectedWarehouse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PackageSearch className="w-5 h-5 mr-2" /> Current Stock Balances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingBalances ? (
              <div className="flex justify-center p-8">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Bin</TableHead>
                      <TableHead>Batch Number</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead>Last Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances?.map((balance) => (
                      <TableRow key={balance.id}>
                        {/* @ts-ignore - complex relations not typed perfectly in simple schema */}
                        <TableCell className="font-medium">
                          {balance.product_variations?.products?.name}
                        </TableCell>
                        {/* @ts-ignore */}
                        <TableCell>{balance.product_variations?.sku}</TableCell>
                        {/* @ts-ignore */}
                        <TableCell>
                          {balance.warehouse_bins?.name || "N/A"}
                        </TableCell>
                        <TableCell>{balance.batch_number || "N/A"}</TableCell>
                        <TableCell className="text-right font-bold">
                          {balance.quantity}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(
                            balance.last_updated_at || "",
                          ).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!balances || balances.length === 0) && (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-muted-foreground"
                        >
                          No stock found in this warehouse.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
