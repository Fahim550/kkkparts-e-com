import React from "react";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowRightLeft, FileText, ArrowDownToLine } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PurchaseHistoryPage() {
  const { orders, isLoading: loadingOrders } = usePurchaseOrders();
  const { receipts, isLoading: loadingReceipts } = useGoodsReceive();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Purchase History & Returns</h1>
      </div>

      <Tabs defaultValue="orders" className="w-full">
        <TabsList>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="receipts">Goods Receipts</TabsTrigger>
        </TabsList>
        
        <TabsContent value="orders" className="mt-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingOrders ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
                ) : orders?.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                        {order.po_number}
                      </div>
                    </TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{order.suppliers?.name}</TableCell>
                    <TableCell>{new Date(order.order_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-secondary">{order.status}</span>
                    </TableCell>
                    <TableCell className="text-right font-bold">${order.total_amount}</TableCell>
                  </TableRow>
                ))}
                {(!orders || orders.length === 0) && !loadingOrders && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Purchase Orders found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        
        <TabsContent value="receipts" className="mt-4">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt / Return Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Warehouse</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingReceipts ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
                ) : receipts?.map((rec) => (
                  <TableRow key={rec.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {rec.status === 'Return' ? (
                           <ArrowRightLeft className="w-4 h-4 mr-2 text-orange-500" />
                        ) : (
                           <ArrowDownToLine className="w-4 h-4 mr-2 text-green-600" />
                        )}
                        {rec.receipt_number}
                      </div>
                    </TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{rec.suppliers?.name}</TableCell>
                    {/* @ts-ignore */}
                    <TableCell>{rec.warehouses?.name}</TableCell>
                    <TableCell>{new Date(rec.receipt_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${rec.status === 'Return' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {rec.status === 'Return' ? 'Return' : 'Receipt'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
                {(!receipts || receipts.length === 0) && !loadingReceipts && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No receipts found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
