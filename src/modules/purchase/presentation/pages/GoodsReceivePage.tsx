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
import { Badge } from "@/components/ui/badge";
import { ArrowDownToLine, BookOpen, CheckCircle2, Eye, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { ReceiptItemPayload } from "../../application/services/receipt.service";
import { useGoodsReceive, usePostReceiptToJournal, useReceiptsJournalMap } from "../hooks/useGoodsReceive";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";


export default function GoodsReceivePage() {
  const { toast } = useToast();

  // ── Filter state (backend-driven) ──────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const receiptFilters = {
    ...(filterSearch ? { search: filterSearch } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterSupplier ? { supplierId: filterSupplier } : {}),
    ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
    ...(filterDateTo ? { dateTo: filterDateTo } : {}),
  };

  const { receipts, isLoading, receiveGoods, isReceiving } =
    useGoodsReceive(receiptFilters);
  const receiptIds = receipts?.map((r) => r.id) || [];
  const { data: journalMap = {} } = useReceiptsJournalMap(receiptIds);

  const { mutateAsync: postToJournal, isPending: isPostingJournal } = usePostReceiptToJournal();
  const [postingReceiptId, setPostingReceiptId] = useState<string | null>(null);


  const handleQuickPostJournal = async (rec: any) => {
    try {
      setPostingReceiptId(rec.id);
      await postToJournal({
        receiptId: rec.id,
        totalAmount: Number(rec.total_amount) || 0,
        receiptNumber: rec.receipt_number,
        customPayableAccountId: rec.suppliers?.payable_account_id,
      });
    } catch (e) {
      // Toast handled by hook
    } finally {
      setPostingReceiptId(null);
    }
  };

  const { warehouses } = useWarehouses();
  const { suppliers } = useSuppliers();
  const { orders } = usePurchaseOrders();


  const [isOpen, setIsOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState(`REC-${Date.now()}`);

  useEffect(() => {
    if (isOpen) {
      setReceiptNumber(`REC-${Date.now()}`);
    }
  }, [isOpen]);
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

        // Map PO items to receipt items with remaining quantity calculation
        if (po.purchase_order_items) {
          const mappedItems = po.purchase_order_items.map((item) => {
            const ordered = Number(item.quantity_ordered || 0);
            const alreadyReceived = Number(item.quantity_received || 0);
            const remaining = Math.max(0, ordered - alreadyReceived);
            return {
              po_item_id: item.id,
              variation_id: item.variation_id,
              uom_id: item.uom_id,
              quantity_received: remaining, // Default to remaining qty
              unit_cost: Number(item.unit_price || 0),
            };
          });
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
    newItems[index].quantity_received = Math.max(0, newQty);
    setItems(newItems);
  };

  const handleReceive = async () => {
    if (!supplierId || !warehouseId || items.length === 0 || !selectedPoId)
      return;

    const po = orders?.find((o) => o.id === selectedPoId);
    const validItems = items.filter((it) => Number(it.quantity_received) > 0);

    if (validItems.length === 0) {
      toast({
        title: "No items to receive",
        description: "Please enter a quantity greater than 0 to receive.",
        variant: "destructive",
      });
      return;
    }

    // Validate that no item exceeds remaining quantity
    for (const it of validItems) {
      const poItem = po?.purchase_order_items?.find(
        (poi) => (it.po_item_id && poi.id === it.po_item_id) || poi.variation_id === it.variation_id
      );
      if (poItem) {
        const ordered = Number(poItem.quantity_ordered || 0);
        const alreadyReceived = Number(poItem.quantity_received || 0);
        const remaining = Math.max(0, ordered - alreadyReceived);
        if (it.quantity_received > remaining) {
          toast({
            title: "Quantity Exceeds Remaining",
            description: `Cannot receive ${it.quantity_received} units for ${poItem.product_variations?.products?.name || "item"}. Only ${remaining} remaining.`,
            variant: "destructive",
          });
          return;
        }
      }
    }

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
        items: validItems,
      });
      setIsOpen(false);
      setSelectedPoId("");
      setItems([]);
      setReceiptNumber(`REC-${Date.now()}`);
    } catch (e) {
      // Handled by mutation toast
    }
  };

  // Include purchase orders that still have items waiting to be received
  const pendingOrders =
    orders?.filter((o) => {
      // Exclude purchase invoices (Goods Receive is strictly against purchase orders)
      if (o.type === "Purchase Invoice") return false;

      // Exclude cancelled orders
      if (o.status?.toLowerCase() === "cancelled") return false;

      // If items are loaded, check if at least one item has remaining unreceived quantity
      if (o.purchase_order_items && o.purchase_order_items.length > 0) {
        return o.purchase_order_items.some(
          (poi: any) => Number(poi.quantity_ordered || 0) > Number(poi.quantity_received || 0)
        );
      }

      // If items array is not populated, exclude only if already fully received
      return o.status?.toLowerCase() !== "received";
    }) || [];

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
                      {pendingOrders.length === 0 ? (
                        <div className="p-3 text-xs text-muted-foreground text-center">
                          No pending purchase orders available
                        </div>
                      ) : (
                        pendingOrders.map((o) => (
                          <SelectItem key={o.id} value={o.id}>
                            {o.po_number} {o.status ? `(${o.status})` : ""}
                          </SelectItem>
                        ))
                      )}
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
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Items from Purchase Order</h3>
                    <span className="text-xs text-muted-foreground">
                      Only items with remaining quantity need receiving
                    </span>
                  </div>

                  {items.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">
                            Ordered
                          </TableHead>
                          <TableHead className="text-right">
                            Already Recv
                          </TableHead>
                          <TableHead className="text-right">
                            Remaining
                          </TableHead>
                          <TableHead className="text-right">
                            Receive Now
                          </TableHead>
                          <TableHead className="text-right">
                            Unit Cost
                          </TableHead>
                          <TableHead className="text-right">
                            Total Val
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it, idx) => {
                          const poItem = orders
                            ?.find((o) => o.id === selectedPoId)
                            ?.purchase_order_items?.find(
                              (poi) => (it.po_item_id && poi.id === it.po_item_id) || poi.variation_id === it.variation_id,
                            );
                          const orderedQty = Number(poItem?.quantity_ordered || 0);
                          const alreadyRecv = Number(poItem?.quantity_received || 0);
                          const remainingQty = Math.max(0, orderedQty - alreadyRecv);

                          return (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">
                                <span className="font-medium">
                                  {poItem?.product_variations?.products?.name ||
                                    "Unknown Product"}
                                </span>
                                <span className="block text-xs text-muted-foreground font-mono">
                                  SKU: {poItem?.product_variations?.sku || it.variation_id}
                                </span>
                              </TableCell>
                              <TableCell className="text-right text-muted-foreground font-medium">
                                {orderedQty}
                              </TableCell>
                              <TableCell className="text-right text-blue-600 font-medium">
                                {alreadyRecv}
                              </TableCell>
                              <TableCell className="text-right font-bold text-amber-600">
                                {remainingQty}
                              </TableCell>
                              <TableCell className="text-right">
                                {remainingQty <= 0 ? (
                                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    Fully Received
                                  </Badge>
                                ) : (
                                  <Input
                                    type="number"
                                    min="0"
                                    max={remainingQty}
                                    className="w-24 ml-auto text-right"
                                    value={it.quantity_received}
                                    onChange={(e) => {
                                      const val = Number(e.target.value);
                                      if (val > remainingQty) {
                                        toast({
                                          title: "Exceeds remaining",
                                          description: `Max quantity you can receive is ${remainingQty}`,
                                          variant: "destructive",
                                        });
                                        handleQtyChange(idx, remainingQty);
                                      } else {
                                        handleQtyChange(idx, Math.max(0, val));
                                      }
                                    }}
                                  />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                ${it.unit_cost}
                              </TableCell>
                              <TableCell className="text-right font-bold">
                                ${(it.quantity_received * it.unit_cost).toFixed(2)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No items found in this Purchase Order.
                    </p>
                  )}
                </div>
              )}

              <Button
                onClick={handleReceive}
                className="w-full"
                disabled={
                  isReceiving ||
                  items.length === 0 ||
                  !items.some((it) => Number(it.quantity_received) > 0) ||
                  !warehouseId ||
                  !selectedPoId
                }
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

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-3 items-end p-3 border rounded-lg bg-muted/10">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search receipt number..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          {filterSearch && (
            <button
              onClick={() => setFilterSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="w-44">
          <Select value={filterSupplier || "all"} onValueChange={(v) => setFilterSupplier(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Suppliers</SelectItem>
              {suppliers?.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="w-36">
          <Select value={filterStatus || "all"} onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Return">Return</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            title="Date From"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            className="w-36"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            title="Date To"
          />
        </div>
        {(filterSearch ||
          filterStatus ||
          filterSupplier ||
          filterDateFrom ||
          filterDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSearch("");
              setFilterStatus("");
              setFilterSupplier("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
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
                  <TableCell>
                    {rec.purchase_orders?.po_number || "N/A"}
                  </TableCell>
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
                  <TableCell className="text-right flex items-center justify-end gap-1">
                    {journalMap[rec.id] ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300 text-xs flex items-center gap-1 py-1 font-normal">
                        <CheckCircle2 className="w-3 h-3" /> Posted ({journalMap[rec.id].entry_number})
                      </Badge>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickPostJournal(rec)}
                        disabled={isPostingJournal && postingReceiptId === rec.id}
                        title="Post to Journal (জাবেদা পোস্ট করুন)"
                        className="text-xs gap-1.5 h-8 border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                      >
                        {isPostingJournal && postingReceiptId === rec.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <BookOpen className="w-3.5 h-3.5" />
                        )}
                        Post Journal
                      </Button>
                    )}
                    <Link to={`/admin/goods-receive/${rec.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </TableCell>


                </TableRow>
              ))
            )}
            {(!receipts || receipts.length === 0) && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={7}
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
