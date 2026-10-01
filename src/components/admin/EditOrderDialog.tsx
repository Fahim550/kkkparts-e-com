import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProductCombobox } from "@/components/ProductCombobox";
import { useCustomers, useCustomerDues } from "@/modules/customer/presentation/hooks/useCustomers";
import { useProducts, useUpdateOrder } from "@/hooks/useDatabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { toast } from "sonner";
import {
  Store,
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Edit,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  UserCheck,
  ShieldAlert,
  Loader2,
} from "lucide-react";

export interface EditOrderItem {
  id: string;
  variationId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  availableStock?: number;
  total: number;
}

interface EditOrderDialogProps {
  order: any;
  trigger?: React.ReactNode;
  onOrderUpdated?: (order: any) => void;
}

export const EditOrderDialog: React.FC<EditOrderDialogProps> = ({
  order,
  trigger,
  onOrderUpdated,
}) => {
  const [open, setOpen] = useState(false);
  const { user, isAdmin } = useAdminAuth();
  const { customers = [] } = useCustomers();
  const { data: customerDueMap = {} } = useCustomerDues();
  const { data: products = [] } = useProducts();
  const updateOrderMutation = useUpdateOrder();

  // Status check for ERP standards
  const orderStatus = (order?.status || "").toLowerCase();
  // In real-life enterprise ERPs (SAP, NetSuite, Odoo), only Pending or Confirmed orders prior to shipment can be edited
  const canEdit = ["pending", "confirmed"].includes(orderStatus);

  const [items, setItems] = useState<EditOrderItem[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string>("");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize or re-populate items when dialog opens
  useEffect(() => {
    if (open && order) {
      setOrderNotes(order.notes || "");
      const existingItems: EditOrderItem[] = (order.items || []).map((i: any, idx: number) => {
        const qty = Number(i.quantity_ordered || i.quantity || 1);
        const price = Number(i.unit_price ?? i.price ?? 0);
        return {
          id: i.id || `edit-item-${idx}-${Date.now()}`,
          variationId: i.product_variation_id || i.variation_id || "",
          productName: i.productName || i.name || i.product_name || "Auto Part",
          sku: i.sku || "",
          price,
          quantity: qty,
          availableStock: 99,
          total: price * qty,
        };
      });
      setItems(existingItems);
    }
  }, [open, order]);

  // Customer details
  const customerId = order?.customer_id;
  const selectedCustomer = useMemo(() => {
    return customers.find((c: any) => c.id === customerId) || null;
  }, [customers, customerId]);

  const customerName = order?.customer_name || selectedCustomer?.name || "Client Shop";
  const customerGroup = order?.customer_group || selectedCustomer?.customer_group || "Customer";
  const isDealer = customerGroup === "Dealer";

  // Handle adding new item to this existing order
  const handleAddProduct = (variationId: string) => {
    if (!variationId) return;

    let resolvedProduct: any = null;
    let resolvedVariation: any = null;

    for (const p of products) {
      const v = p.variations?.find((v: any) => v.id === variationId);
      if (v) {
        resolvedProduct = p;
        resolvedVariation = v;
        break;
      }
    }

    if (!resolvedProduct) {
      resolvedProduct = products.find((p: any) => p.id === variationId);
    }

    // Auto-fill price: dealer_price for dealers, retail price for retail
    let price = 0;
    if (isDealer) {
      price =
        Number(resolvedProduct?.dealer_price) ||
        Number(resolvedProduct?.dealer_original_price) ||
        Number(resolvedProduct?.price) ||
        0;
    } else {
      price =
        Number(resolvedProduct?.price) ||
        Number(resolvedProduct?.original_price) ||
        0;
    }

    // Check if already in order
    const existingIndex = items.findIndex(
      (item) => item.variationId === variationId
    );

    if (existingIndex >= 0) {
      setItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price,
              }
            : item
        )
      );
      toast.info(`Increased quantity for ${resolvedProduct?.name || "Item"}`);
      return;
    }

    const totalStock = resolvedProduct?.variations?.reduce(
      (acc: number, v: any) => acc + (Number(v.stock) || 0),
      0
    ) || Number(resolvedProduct?.stock || 0);

    const partName = resolvedProduct?.name || resolvedVariation?.sku || "Auto Part";

    const newItem: EditOrderItem = {
      id: `new-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      variationId,
      productName: partName,
      sku: resolvedVariation?.sku || resolvedProduct?.item_code || "",
      price,
      quantity: 1,
      availableStock: totalStock,
      total: price * 1,
    };

    setItems([...items, newItem]);
    toast.success(`Added ${partName} to order`);
  };

  const handleUpdateQuantity = (id: string, qty: number) => {
    const validQty = Math.max(1, qty);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, quantity: validQty, total: validQty * item.price }
          : item
      )
    );
  };

  const handleUpdatePrice = (id: string, price: number) => {
    const validPrice = Math.max(0, price);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, price: validPrice, total: item.quantity * validPrice }
          : item
      )
    );
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      toast.error("An order must have at least one product item.");
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Calculate new total amount
  const newTotalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [items]);

  const oldTotalAmount = Number(order?.total || order?.total_amount || 0);
  const difference = newTotalAmount - oldTotalAmount;

  const handleSaveOrder = async () => {
    if (!canEdit) {
      toast.error(`Cannot edit: Order is ${order.status.toUpperCase()}`);
      return;
    }
    if (items.length === 0) {
      toast.error("Please ensure the order has at least one item.");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateOrderMutation.mutateAsync({
        id: order.id,
        total: newTotalAmount,
        notes: orderNotes,
        items: items.map((i) => ({
          product_variation_id: i.variationId,
          variation_id: i.variationId,
          product_name: i.productName,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.total,
        })),
      });

      toast.success(`Order ${order.order_number} updated successfully!`);
      setOpen(false);
      if (onOrderUpdated) {
        onOrderUpdated({ ...order, total: newTotalAmount, total_amount: newTotalAmount });
      }
    } catch (err: any) {
      console.error("Failed to update order:", err);
      toast.error(err.message || "Failed to save order updates.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8 px-2.5 gap-1 text-slate-700 bg-white hover:bg-slate-50 hover:text-blue-600"
            title="Edit Order Items & Quantities"
          >
            <Edit className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Edit</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto font-body p-4 sm:p-6">
        <DialogHeader className="border-b border-gray-100 pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <span>Edit Order: {order?.order_number}</span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      canEdit
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    {order?.status}
                  </span>
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500 mt-0.5">
                  Client: <span className="font-semibold text-gray-800">{customerName}</span> ({customerGroup})
                </DialogDescription>
              </div>
            </div>

            {/* ERP Lifecycle Status Indicator */}
            {canEdit ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Editable (Prior to Dispatch)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <Lock className="w-3.5 h-3.5 text-rose-600" />
                <span>Locked (Read-Only)</span>
              </span>
            )}
          </div>
        </DialogHeader>

        {/* Real-Life ERP Standard Banner */}
        {!canEdit ? (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5 mt-2">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">ERP Workflow Protection Active</p>
              <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                This order is in <strong>{order?.status?.toUpperCase()}</strong> status. In real-life enterprise ERPs,
                orders that have already shipped or been delivered are locked to preserve physical inventory counts,
                dispatch manifests, and tax ledger integrity. If the customer requires additional spare parts, please
                book a separate supplementary field order.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-blue-900 text-[11px] flex items-center gap-2 mt-2">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              <strong>ERP Standard:</strong> You can add parts, adjust quantities, or update prices while the order is
              in <strong>{order?.status?.toUpperCase()}</strong> status before warehouse packing.
            </span>
          </div>
        )}

        <div className="space-y-4 py-3">
          {/* 1. Add Product Search (Only if editable) */}
          {canEdit && (
            <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                <span>Search & Add Additional Spare Parts</span>
              </Label>
              <ProductCombobox
                products={products}
                value={selectedVariationId}
                onChange={(val) => {
                  setSelectedVariationId(val);
                  handleAddProduct(val);
                }}
                placeholder="Search auto parts by name, SKU, or OEM number..."
              />
            </div>
          )}

          {/* 2. Order Line Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">
                Order Line Items ({items.length})
              </span>
              <span className="text-slate-500 text-[11px]">
                {isDealer ? "Wholesale Dealer Pricing Applied" : "Retail Pricing Applied"}
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-900">
                        {idx + 1}. {item.productName}
                      </span>
                      {item.sku && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">
                          {item.sku}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Unit Price Controls */}
                  <div className="flex items-center gap-3 shrink-0 flex-wrap justify-between sm:justify-end">
                    {/* Unit Price */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Price:
                      </span>
                      {canEdit ? (
                        <div className="relative w-20">
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)
                            }
                            className="h-7 text-xs font-semibold text-right pr-1 pl-1"
                          />
                        </div>
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">
                          OMR {item.price.toFixed(3)}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase">
                        Qty:
                      </span>
                      {canEdit ? (
                        <div className="flex items-center border border-slate-200 rounded-md bg-white">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100 text-slate-600 transition"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-10 text-center text-xs font-bold border-0 focus:outline-none p-0"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="px-2 py-0.5 text-xs font-bold hover:bg-slate-100 text-slate-600 transition"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-slate-900 px-2 py-0.5 bg-slate-100 rounded">
                          {item.quantity}
                        </span>
                      )}
                    </div>

                    {/* Line Total */}
                    <div className="min-w-[80px] text-right font-bold text-xs text-slate-900">
                      OMR {item.total.toFixed(3)}
                    </div>

                    {/* Delete Item (Only if editable) */}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Order Notes */}
          <div className="space-y-1">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Special Delivery Instructions & Order Notes</span>
            </Label>
            <textarea
              disabled={!canEdit}
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="Add client delivery notes, preferred timeslot, or PO number..."
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
              rows={2}
            />
          </div>

          {/* 4. Financial Summary Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs space-y-0.5 text-center sm:text-left">
              <div className="text-slate-400 text-[11px]">
                Original Total: <span className="text-white font-semibold">OMR {oldTotalAmount.toFixed(3)}</span>
              </div>
              {canEdit && difference !== 0 && (
                <div className={`text-[11px] font-semibold ${difference > 0 ? "text-emerald-400" : "text-amber-400"}`}>
                  {difference > 0 ? `+OMR ${difference.toFixed(3)} increase` : `-OMR ${Math.abs(difference).toFixed(3)} reduction`}
                </div>
              )}
            </div>

            <div className="text-center sm:text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Updated Order Total
              </div>
              <div className="text-2xl font-black text-emerald-400">
                OMR {newTotalAmount.toFixed(3)}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-2 border-t border-gray-100 flex flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            className="text-xs h-9"
          >
            {canEdit ? "Cancel" : "Close"}
          </Button>

          {canEdit && (
            <Button
              type="button"
              onClick={handleSaveOrder}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 gap-1.5 shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Updates...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Order Changes</span>
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditOrderDialog;
