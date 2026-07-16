import React, { useState } from "react";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useProducts } from "@/hooks/useDatabase";
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
import { Loader2, Plus, ArrowDownToLine } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ReceiptItemPayload } from "../../application/services/receipt.service";

export default function GoodsReceivePage() {
  const { receipts, isLoading, receiveGoods, isReceiving } = useGoodsReceive();
  const { warehouses } = useWarehouses();
  const { suppliers } = useSuppliers();
  const { data: products = [] } = useProducts();

  const [isOpen, setIsOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Date.now()}`);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [receiptDate, setReceiptDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [items, setItems] = useState<ReceiptItemPayload[]>([]);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [qty, setQty] = useState(1);
  const [cost, setCost] = useState(0);

  const handleAddItem = () => {
    if (!selectedVariation || qty <= 0 || cost < 0) return;
    const uom_id = "00000000-0000-0000-0000-000000000000"; // Placeholder
    
    setItems([...items, { 
      variation_id: selectedVariation, 
      uom_id, 
      quantity_received: qty, 
      unit_cost: cost 
    }]);
    setSelectedVariation("");
    setQty(1);
    setCost(0);
  };

  const handleReceive = async () => {
    if (!supplierId || !warehouseId || items.length === 0) return;
    try {
      await receiveGoods({
        receipt: {
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          receipt_number: receiptNumber,
          receipt_date: receiptDate,
          status: "Completed", // Goods are received instantly in this flow
        },
        items,
      });
      setIsOpen(false);
      setItems([]);
      setReceiptNumber(`REC-${Date.now()}`);
    } catch (e) {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Goods Receive (GRN)</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Receive Goods</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receive Goods & Create FIFO Lots</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Receipt Number</Label>
                  <Input value={receiptNumber} onChange={e => setReceiptNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Receipt Date</Label>
                  <Input type="date" value={receiptDate} onChange={e => setReceiptDate(e.target.value)} />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination Warehouse</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger><SelectValue placeholder="Select warehouse" /></SelectTrigger>
                    <SelectContent>
                      {warehouses?.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border p-4 rounded-md space-y-4 bg-muted/20">
                <h3 className="font-semibold">Receive Items (FIFO Costing)</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product Variation</Label>
                    <Select value={selectedVariation} onValueChange={setSelectedVariation}>
                      <SelectTrigger><SelectValue placeholder="Select variation" /></SelectTrigger>
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
                    <Label>Unit Cost</Label>
                    <Input type="number" min="0" step="0.01" value={cost} onChange={e => setCost(Number(e.target.value))} />
                  </div>
                  <Button type="button" onClick={handleAddItem}>Add</Button>
                </div>

                {items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variation ID</TableHead>
                        <TableHead className="text-right">Qty Received</TableHead>
                        <TableHead className="text-right">Unit Cost</TableHead>
                        <TableHead className="text-right">Total Val</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{it.variation_id}</TableCell>
                          <TableCell className="text-right">{it.quantity_received}</TableCell>
                          <TableCell className="text-right">${it.unit_cost}</TableCell>
                          <TableCell className="text-right font-bold">${it.quantity_received * it.unit_cost}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Button onClick={handleReceive} className="w-full" disabled={isReceiving || items.length === 0 || !warehouseId}>
                {isReceiving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Receipt & Update Stock
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Receipt Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : receipts?.map((rec) => (
              <TableRow key={rec.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <ArrowDownToLine className="w-4 h-4 mr-2 text-green-600" />
                    {rec.receipt_number}
                  </div>
                </TableCell>
                {/* @ts-ignore */}
                <TableCell>{rec.suppliers?.name}</TableCell>
                {/* @ts-ignore */}
                <TableCell>{rec.warehouses?.name}</TableCell>
                <TableCell>{new Date(rec.receipt_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">{rec.status}</span>
                </TableCell>
              </TableRow>
            ))}
            {(!receipts || receipts.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No receipts found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
