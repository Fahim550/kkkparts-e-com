import React, { useState } from "react";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useProducts } from "../../../product/presentation/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Edit, FileText } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PurchaseOrder } from "../../domain/types";

export default function PurchaseOrdersPage() {
  const { orders, isLoading, createOrder, isCreating } = usePurchaseOrders();
  const { suppliers } = useSuppliers();
  const { products } = useProducts();

  const [isOpen, setIsOpen] = useState(false);
  const [poNumber, setPoNumber] = useState(`PO-${Date.now()}`);
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Minimal item management for UI
  const [items, setItems] = useState<{ variation_id: string; uom_id: string; quantity_ordered: number; unit_price: number }[]>([]);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handleAddItem = () => {
    if (!selectedVariation || qty <= 0 || price < 0) return;
    // Mock UOM for now since we don't fetch UOMs in this simple UI, just grab first one or default
    // Ideally we'd fetch variation details to get its base UOM
    const uom_id = "00000000-0000-0000-0000-000000000000"; // Placeholder: replace with actual uom_id in real app
    
    setItems([...items, { variation_id: selectedVariation, uom_id, quantity_ordered: qty, unit_price: price }]);
    setSelectedVariation("");
    setQty(1);
    setPrice(0);
  };

  const handleCreate = async () => {
    if (!supplierId || items.length === 0) return;
    try {
      await createOrder({
        po: {
          supplier_id: supplierId,
          po_number: poNumber,
          order_date: orderDate,
          status: "Draft",
        },
        items,
      });
      setIsOpen(false);
      setItems([]);
      setPoNumber(`PO-${Date.now()}`);
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New PO</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PO Number</Label>
                  <Input value={poNumber} onChange={e => setPoNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <Input type="date" value={orderDate} onChange={e => setOrderDate(e.target.value)} />
                </div>
              </div>

              <div className="border p-4 rounded-md space-y-4">
                <h3 className="font-semibold">Add Items</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product Variation</Label>
                    <Select value={selectedVariation} onValueChange={setSelectedVariation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select variation" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          p.product_variations?.map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>{p.name} - {v.sku}</SelectItem>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} />
                  </div>
                  <div className="w-32">
                    <Label>Unit Price</Label>
                    <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} />
                  </div>
                  <Button type="button" onClick={handleAddItem}>Add</Button>
                </div>

                {items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variation ID</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{it.variation_id}</TableCell>
                          <TableCell className="text-right">{it.quantity_ordered}</TableCell>
                          <TableCell className="text-right">${it.unit_price}</TableCell>
                          <TableCell className="text-right font-bold">${it.quantity_ordered * it.unit_price}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isCreating || items.length === 0}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

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
            {isLoading ? (
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
            {(!orders || orders.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No Purchase Orders found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
