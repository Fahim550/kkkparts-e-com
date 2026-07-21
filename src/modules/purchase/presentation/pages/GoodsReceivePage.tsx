import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowDownToLine, Loader2, Plus } from "lucide-react";
import { useState, useEffect } from "react";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { ReceiptItemPayload } from "../../application/services/receipt.service";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";

export default function GoodsReceivePage() {
  const { receipts, isLoading, receiveGoods, isReceiving } = useGoodsReceive();
  const { warehouses } = useWarehouses();
  const { orders } = usePurchaseOrders();

  const [isOpen, setIsOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Date.now()}`);
  const [selectedPoId, setSelectedPoId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [receiptDate, setReceiptDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  const [items, setItems] = useState<ReceiptItemPayload[]>([]);

  // Auto-populate when a PO is selected
  useEffect(() => {
    if (selectedPoId && orders) {
      const po = orders.find((o) => o.id === selectedPoId);
      if (po) {
        setSupplierId(po.supplier_id || "");
        
        // Map PO items to receipt items
        if (po.purchase_order_items) {
          const mappedItems = po.purchase_order_items.map(item => ({
            variation_id: item.variation_id,
            uom_id: item.uom_id,
            quantity_received: item.quantity_ordered, // Default to ordered qty
            unit_cost: item.unit_price,
          }));
          setItems(mappedItems);
        } else {
          setItems([]);
        }
      }
    } else {
      setSupplierId("");
      setItems([]);
    }
  }, [selectedPoId, orders]);

  const handleQtyChange = (index: number, newQty: number) => {
    const newItems = [...items];
    newItems[index].quantity_received = newQty;
    setItems(newItems);
  };

  const handleReceive = async () => {
    if (!supplierId || !warehouseId || items.length === 0 || !selectedPoId) return;
    try {
      await receiveGoods({
        receipt: {
          supplier_id: supplierId,
          warehouse_id: warehouseId,
          purchase_order_id: selectedPoId,
          receipt_number: receiptNumber,
          receipt_date: receiptDate,
          status: "Completed",
        },
        items,
      });
      setIsOpen(false);
      setSelectedPoId("");
      setItems([]);
      setReceiptNumber(`REC-${Date.now()}`);
    } catch (e) {
      // handled
    }
  };

  const pendingOrders = orders?.filter(o => o.status !== "Received") || [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Goods Receive (GRN)
        </h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Receive Goods
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Receive Goods Against Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Purchase Order</Label>
                  <Select value={selectedPoId} onValueChange={setSelectedPoId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select PO" />
                    </SelectTrigger>
                    <SelectContent>
                      {pendingOrders.map((o) => (
                        <SelectItem key={o.id} value={o.id}>
                          {o.po_number}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Destination Warehouse</Label>
                  <Select value={warehouseId} onValueChange={setWarehouseId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select warehouse" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Receipt Number</Label>
                  <Input
                    value={receiptNumber}
                    onChange={(e) => setReceiptNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Receipt Date</Label>
                  <Input
                    type="date"
                    value={receiptDate}
                    onChange={(e) => setReceiptDate(e.target.value)}
                  />
                </div>
              </div>

              {selectedPoId && (
                <div className="border p-4 rounded-md space-y-4 bg-muted/20">
                  <h3 className="font-semibold">Items from Purchase Order</h3>
                  
                  {items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Variation ID</TableHead>
                          <TableHead className="text-right">Ordered Qty</TableHead>
                          <TableHead className="text-right">Qty Received</TableHead>
                          <TableHead className="text-right">Unit Cost</TableHead>
                          <TableHead className="text-right">Total Val</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it, idx) => {
                          const poItem = orders?.find(o => o.id === selectedPoId)?.purchase_order_items?.find(poi => poi.variation_id === it.variation_id);
                          const orderedQty = poItem?.quantity_ordered || 0;
                          
                          return (
                            <TableRow key={idx}>
                              <TableCell className="font-mono text-xs">
                                {it.variation_id}
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground">
                                {orderedQty}
                              </TableCell>
                              <TableCell className="text-right">
                                <Input
                                  type="number"
                                  min="0"
                                  max={orderedQty}
                                  className="w-24 ml-auto text-right"
                                  value={it.quantity_received}
                                  onChange={(e) => handleQtyChange(idx, Number(e.target.value))}
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                ${it.unit_cost}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                ${it.quantity_received * it.unit_cost}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">No items found in this Purchase Order.</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleReceive}
                className="w-full"
                disabled={isReceiving || items.length === 0 || !warehouseId || !selectedPoId}
              >
                {isReceiving && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
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
              <TableHead>PO Reference</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Warehouse</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              receipts?.map((rec) => (
                <TableRow key={rec.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <ArrowDownToLine className="w-4 h-4 mr-2 text-green-600" />
                      {rec.receipt_number}
                    </div>
                  </TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{rec.purchase_orders?.po_number || "N/A"}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{rec.suppliers?.name}</TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{rec.warehouses?.name}</TableCell>
                  <TableCell>
                    {new Date(rec.receipt_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                      {rec.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
            {(!receipts || receipts.length === 0) && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No receipts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
