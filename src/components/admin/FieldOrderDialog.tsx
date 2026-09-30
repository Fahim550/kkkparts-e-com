import { useState, useMemo } from "react";
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
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
import { useCustomers, useCustomerDues } from "@/modules/customer/presentation/hooks/useCustomers";
import { useProducts, useAddOrder } from "@/hooks/useDatabase";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Store,
  ShoppingCart,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  MessageSquare,
  UserCheck,
  Building2,
  Calendar,
  FileText,
  DollarSign,
} from "lucide-react";

interface FieldOrderItem {
  id: string;
  variationId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  availableStock: number;
  total: number;
}

interface FieldOrderDialogProps {
  trigger?: React.ReactNode;
  defaultCustomerId?: string;
  onOrderCreated?: (order: any) => void;
}

export const FieldOrderDialog = ({
  trigger,
  defaultCustomerId,
  onOrderCreated,
}: FieldOrderDialogProps) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { user, isSalesman, isAdmin } = useAdminAuth();

  const { customers = [] } = useCustomers();
  const { data: customerDueMap = {} } = useCustomerDues();
  const { data: products = [] } = useProducts();
  const addOrderMutation = useAddOrder();

  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(
    defaultCustomerId || ""
  );
  const [items, setItems] = useState<FieldOrderItem[]>([]);
  const [selectedVariationId, setSelectedVariationId] = useState<string>("");
  const [paymentType, setPaymentType] = useState<string>("Credit");
  const [orderNotes, setOrderNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<any | null>(null);

  // Active salesman identity
  const currentSalesmanName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Sales Representative";
  const currentSalesmanId = user?.id || null;

  // Selected customer details
  const selectedCustomer = useMemo(() => {
    return customers.find((c: any) => c.id === selectedCustomerId) || null;
  }, [customers, selectedCustomerId]);

  // Selected customer due & credit limit
  const customerDue = useMemo(() => {
    if (!selectedCustomerId) return 0;
    return Number(customerDueMap[selectedCustomerId] || 0);
  }, [customerDueMap, selectedCustomerId]);

  const creditLimit = Number(selectedCustomer?.credit_limit || 0);
  const isOverCredit = creditLimit > 0 && customerDue > creditLimit;

  // Calculate totals
  const totalAmount = useMemo(() => {
    return items.reduce((sum, item) => sum + Number(item.total || 0), 0);
  }, [items]);

  // Handle adding product item
  const handleProductSelect = (variationId: string, variation?: any, product?: any) => {
    setSelectedVariationId("");
    if (!variationId || !variation) return;

    // Check if already in items
    const existingIndex = items.findIndex((i) => i.variationId === variationId);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      updated[existingIndex].total =
        updated[existingIndex].quantity * updated[existingIndex].price;
      setItems(updated);
      return;
    }

    const price = Number(
      selectedCustomer?.customer_group === "Dealer"
        ? variation.dealer_price || variation.price || 0
        : variation.price || 0
    );

    const totalStock = (variation.stock_balances || []).reduce(
      (s: number, b: any) => s + Number(b.quantity || 0),
      0
    );

    const newItem: FieldOrderItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      variationId: variation.id,
      productName: product?.name || variation.sku || "Auto Part",
      sku: variation.sku || "",
      price,
      quantity: 1,
      availableStock: totalStock,
      total: price * 1,
    };

    setItems([...items, newItem]);
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
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleResetForm = () => {
    setSelectedCustomerId("");
    setItems([]);
    setSelectedVariationId("");
    setPaymentType("Credit");
    setOrderNotes("");
    setSuccessOrder(null);
  };

  const handleSubmitOrder = async () => {
    if (!selectedCustomerId) {
      toast.error("Please select a customer or shop first.");
      return;
    }
    if (items.length === 0) {
      toast.error("Please add at least one spare part item to the order.");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = `SO-FLD-${Date.now().toString().slice(-6)}`;

      const payload = {
        order_number: orderNumber,
        customer_id: selectedCustomerId,
        customer_name: selectedCustomer?.name || "Field Customer",
        customer_email: selectedCustomer?.contact_email || "",
        customer_phone: selectedCustomer?.contact_phone || "",
        total: totalAmount.toString(),
        subtotal: totalAmount.toString(),
        discount_amount: "0",
        tax_amount: "0",
        status: "pending",
        salesman_id: currentSalesmanId,
        salesman_name: currentSalesmanName,
        order_source: "field_marketing",
        items: items.map((i) => ({
          product_variation_id: i.variationId,
          product_name: i.productName,
          quantity: i.quantity,
          unit_price: i.price,
          total_price: i.total,
        })),
      };

      const mutationPromise = addOrderMutation.mutateAsync(payload as any);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out. Please verify your connection.")), 15000)
      );

      const result = await Promise.race([mutationPromise, timeoutPromise]);

      queryClient.invalidateQueries({ queryKey: ["orders"] });
      queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
      queryClient.invalidateQueries({ queryKey: ["customer-dues"] });

      setSuccessOrder({
        orderNumber,
        customerName: selectedCustomer?.name,
        customerPhone: selectedCustomer?.contact_phone,
        total: totalAmount,
        itemsCount: items.length,
        notes: orderNotes,
      });

      toast.success(`Field order ${orderNumber} placed successfully!`);
      if (onOrderCreated) onOrderCreated(result);
    } catch (err: any) {
      console.error("Failed to place field order:", err);
      toast.error(err.message || "Failed to submit field order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp share link generator
  const getWhatsAppShareLink = () => {
    if (!successOrder) return "";
    const phone = (successOrder.customerPhone || "").replace(/[^0-9]/g, "");
    const lines = [
      `*Auto Parts Order Confirmation*`,
      `Order #: ${successOrder.orderNumber}`,
      `Customer: ${successOrder.customerName}`,
      `Booked By Rep: ${currentSalesmanName}`,
      `Total Items: ${successOrder.itemsCount}`,
      `Total Amount: OMR ${Number(successOrder.total).toFixed(3)}`,
      `Payment Term: ${paymentType}`,
      `Status: Confirmed / Processing`,
      `Thank you for doing business with us!`,
    ];
    const text = encodeURIComponent(lines.join("\n"));
    return phone ? `https://wa.me/${phone}?text=${text}` : `https://wa.me/?text=${text}`;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm">
            <Store className="w-4 h-4" />
            <span>Take Shop Order (Field)</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto font-body">
        <DialogHeader className="border-b pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-gray-900">
                  Shop-to-Shop Field Order Booking
                </DialogTitle>
                <DialogDescription className="text-xs text-gray-500">
                  Book wholesale/retail orders directly while visiting client shops &amp; garages
                </DialogDescription>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold">
              <UserCheck className="w-3.5 h-3.5 text-amber-600" />
              <span className="truncate max-w-[120px]">{currentSalesmanName}</span>
            </div>
          </div>
        </DialogHeader>

        {successOrder ? (
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Order Booked Successfully!
              </h3>
              <p className="text-sm font-semibold text-blue-600 mt-1">
                {successOrder.orderNumber}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Booked for <span className="font-semibold text-gray-800">{successOrder.customerName}</span> • OMR {Number(successOrder.total).toFixed(3)}
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl text-left text-xs space-y-1.5 max-w-md mx-auto">
              <div className="flex justify-between text-gray-600">
                <span>Sales Representative:</span>
                <span className="font-semibold text-gray-900">{currentSalesmanName}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Items Ordered:</span>
                <span className="font-semibold text-gray-900">{successOrder.itemsCount} lines</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Terms:</span>
                <span className="font-semibold text-gray-900">{paymentType}</span>
              </div>
              <div className="flex justify-between text-gray-600 pt-1 border-t border-gray-200">
                <span className="font-bold text-gray-800">Total Amount:</span>
                <span className="font-bold text-emerald-600 text-sm">OMR {Number(successOrder.total).toFixed(3)}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <a
                href={getWhatsAppShareLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Share via WhatsApp</span>
              </a>
              <Button
                variant="outline"
                onClick={handleResetForm}
                className="w-full sm:w-auto text-xs font-semibold gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Take Next Shop Order</span>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Step 1: Customer / Shop Selection */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700 flex items-center justify-between">
                <span>1. Select Shop / Customer / Garage</span>
                {selectedCustomer && (
                  <span className="text-[11px] font-normal text-gray-500">
                    {selectedCustomer.contact_phone || "No phone registered"}
                  </span>
                )}
              </Label>
              <CustomerCombobox
                customers={customers}
                value={selectedCustomerId}
                onChange={(val) => setSelectedCustomerId(val)}
              />

              {/* Shop Due & Credit Balance Pill */}
              {selectedCustomer && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-50 border border-gray-200 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Category:</span>
                    <span className="font-semibold text-gray-800">
                      {selectedCustomer.customer_group || "Customer"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div>
                      <span className="text-gray-500 mr-1">Current Due:</span>
                      <span
                        className={`font-bold ${
                          customerDue > 0 ? "text-amber-700" : "text-emerald-700"
                        }`}
                      >
                        OMR {customerDue.toFixed(3)}
                      </span>
                    </div>

                    {creditLimit > 0 && (
                      <div>
                        <span className="text-gray-500 mr-1">Credit Limit:</span>
                        <span className="font-bold text-gray-800">
                          OMR {creditLimit.toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {isOverCredit && (
                <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 text-red-700 text-xs border border-red-200">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                  <span>
                    Warning: This shop has exceeded its credit limit (Due: OMR{" "}
                    {customerDue.toFixed(3)} / Limit: OMR {creditLimit.toFixed(3)}).
                  </span>
                </div>
              )}
            </div>

            {/* Step 2: Add Products */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <Label className="text-xs font-semibold text-gray-700">
                2. Search &amp; Add Auto Spare Parts
              </Label>
              <ProductCombobox
                products={products}
                value={selectedVariationId}
                onChange={handleProductSelect}
                quickSaleMode={true}
              />
            </div>

            {/* Items List */}
            {items.length > 0 ? (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-gray-200 text-[11px] font-semibold text-gray-500 uppercase">
                    <tr>
                      <th className="p-2.5">Part / SKU</th>
                      <th className="p-2.5 w-20 text-center">Qty</th>
                      <th className="p-2.5 w-24 text-right">Price</th>
                      <th className="p-2.5 w-24 text-right">Subtotal</th>
                      <th className="p-2.5 w-10 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60">
                        <td className="p-2.5">
                          <div className="font-semibold text-gray-900 truncate max-w-[200px]" title={item.productName}>
                            {item.productName}
                          </div>
                          {item.sku && (
                            <span className="text-[10px] text-gray-400">
                              SKU: {item.sku}
                            </span>
                          )}
                        </td>
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-1.5 py-1 text-xs text-center border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2 text-right">
                          <input
                            type="number"
                            step="0.001"
                            min="0"
                            value={item.price}
                            onChange={(e) =>
                              handleUpdatePrice(item.id, parseFloat(e.target.value) || 0)
                            }
                            className="w-20 px-1.5 py-1 text-xs text-right border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                          />
                        </td>
                        <td className="p-2.5 text-right font-bold text-gray-900">
                          OMR {item.total.toFixed(3)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-6 border-2 border-dashed border-gray-200 rounded-lg text-center text-xs text-gray-400">
                <ShoppingCart className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                No parts added to cart yet. Use search above to add items.
              </div>
            )}

            {/* Step 3: Payment Type & Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-gray-100">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Payment Term</Label>
                <select
                  value={paymentType}
                  onChange={(e) => setPaymentType(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:bg-white focus:border-blue-500"
                >
                  <option value="Credit">Credit (Add to Shop Account Due)</option>
                  <option value="Cash">Cash Collected in Hand</option>
                  <option value="Cheque">Cheque Payment</option>
                  <option value="Bank">Bank Transfer</option>
                </select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold text-gray-700">Field Notes / Delivery Time</Label>
                <Input
                  type="text"
                  placeholder="e.g. Urgent delivery before 3 PM"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
            </div>

            {/* Total Summary Footer */}
            <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 font-medium">Order Total:</span>
                <div className="text-xl font-bold text-blue-700">
                  OMR {totalAmount.toFixed(3)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="text-xs h-9 font-medium"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting || items.length === 0 || !selectedCustomerId}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-9 font-semibold gap-1.5 px-4 shadow-sm"
                >
                  {isSubmitting ? "Placing Order..." : "Confirm & Submit Order"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
