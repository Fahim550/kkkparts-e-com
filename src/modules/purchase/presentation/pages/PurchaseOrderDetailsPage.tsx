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
import { usePurchaseOrder } from "../hooks/usePurchaseOrders";

export default function PurchaseOrderDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading } = usePurchaseOrder(id || "");

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        Order not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/purchase-orders">
          <Button variant="outline" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Purchase Order {order.po_number}
          </h1>
          <p className="text-sm text-muted-foreground">
            View detailed information for this purchase order.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">General Information</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">PO Number</div>
            <div className="font-medium">{order.po_number}</div>
            <div className="text-muted-foreground">Supplier</div>
            <div className="font-medium">{order.suppliers?.name || "N/A"}</div>
            <div className="text-muted-foreground">Order Date</div>
            <div className="font-medium">
              {new Date(order.order_date).toLocaleDateString()}
            </div>
            <div className="text-muted-foreground">Status</div>
            <div>
              <Badge variant="secondary">{order.status}</Badge>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 bg-card space-y-4">
          <h2 className="text-lg font-semibold">Summary</h2>
          <div className="grid grid-cols-2 gap-y-2 text-sm">
            <div className="text-muted-foreground">Total Items</div>
            <div className="font-medium">
              {order.purchase_order_items?.length || 0}
            </div>
            <div className="text-muted-foreground">Total Quantity</div>
            <div className="font-medium">
              {order.purchase_order_items?.reduce(
                (sum, item) => sum + item.quantity_ordered,
                0,
              )}
            </div>
            <div className="text-muted-foreground mt-4 font-bold text-lg">
              Total Amount
            </div>
            <div className="font-bold text-lg text-primary text-right">
              ${order.total_amount}
            </div>
          </div>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Order Items</h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Ordered</TableHead>
              <TableHead className="text-right">Received</TableHead>
              <TableHead className="text-right">Remaining</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Total Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.purchase_order_items?.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No items found in this order.
                </TableCell>
              </TableRow>
            ) : (
              order.purchase_order_items?.map((item) => {
                const ordered = Number(item.quantity_ordered || 0);
                const received = Number(item.quantity_received || 0);
                const remaining = Math.max(0, ordered - received);

                return (
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
                    <TableCell className="text-right font-medium">
                      {ordered}
                    </TableCell>
                    <TableCell className="text-right text-blue-600 font-medium">
                      {received}
                    </TableCell>
                    <TableCell className="text-right font-bold text-amber-600">
                      {remaining}
                    </TableCell>
                    <TableCell className="text-right">
                      ${item.unit_price}
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${item.total_price || ordered * item.unit_price}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
