import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { useGoodsReceipt } from "../hooks/useGoodsReceive";

export default function GoodsReceiveDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: receipt, isLoading } = useGoodsReceipt(id || "");

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Goods Receipt not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/goods-receive">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Goods Receipt {receipt.receipt_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            View detailed information for this goods receipt.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">General Information</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Receipt Number</div>
            <div className="font-medium">{receipt.receipt_number}</div>
            
            <div className="text-muted-foreground">Purchase Order</div>
            <div className="font-medium">
              {receipt.purchase_orders?.po_number || "N/A"}
            </div>
            
            <div className="text-muted-foreground">Supplier</div>
            <div className="font-medium">{receipt.suppliers?.name || "N/A"}</div>
            
            <div className="text-muted-foreground">Warehouse</div>
            <div className="font-medium">{receipt.warehouses?.name || "N/A"}</div>
            
            <div className="text-muted-foreground">Receipt Date</div>
            <div className="font-medium">
              {new Date(receipt.receipt_date).toLocaleDateString()}
            </div>
            
            <div className="text-muted-foreground">Status</div>
            <div>
              <Badge variant="secondary">{receipt.status}</Badge>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Total Items</div>
            <div className="font-medium">
              {receipt.purchase_receipt_items?.length || 0}
            </div>
            <div className="text-muted-foreground">Total Quantity Received</div>
            <div className="font-medium">
              {receipt.purchase_receipt_items?.reduce(
                (sum, item) => sum + item.quantity_received,
                0,
              )}
            </div>
            <div className="text-muted-foreground mt-4 font-bold text-lg">
              Total Amount
            </div>
            <div className="font-bold text-lg text-primary text-right">
              ${receipt.total_amount}
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Received Items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Qty Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {receipt.purchase_receipt_items?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No items found in this receipt.
                </TableCell>
              </TableRow>
            ) : (
              receipt.purchase_receipt_items?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    {item.product_variations?.products?.name || "Unknown Product"}
                  </TableCell>
                  <TableCell className="text-xs font-mono">
                    {item.product_variations?.sku || "N/A"}
                  </TableCell>
                  <TableCell>
                    {item.units_of_measure?.abbreviation || item.uom_id}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {item.quantity_received}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
