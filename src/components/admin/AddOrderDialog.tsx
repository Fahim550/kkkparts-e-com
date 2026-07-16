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
import { Textarea } from "@/components/ui/textarea";
import { useAddOrder, useProducts } from "@/hooks/useDatabase";
import { PackagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface OrderItem {
  productName: string;
  size: string;
  color: string;
  quantity: number;
  price: number;
}

const AddOrderDialog = () => {
  const [open, setOpen] = useState(false);
  const addOrder = useAddOrder();
  const { data: products = [] } = useProducts();

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { productName: "", size: "", color: "", quantity: 1, price: 0 },
  ]);

  const resetForm = () => {
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setShippingAddress("");
    setNotes("");
    setItems([{ productName: "", size: "", color: "", quantity: 1, price: 0 }]);
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      { productName: "", size: "", color: "", quantity: 1, price: 0 },
    ]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const updateItem = (
    index: number,
    field: keyof OrderItem,
    value: string | number,
  ) => {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  };

  const selectProduct = (index: number, productName: string) => {
    const product = products.find((p) => p.name === productName);
    if (product) {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                productName: product.name,
                price: product.price,
                color: product.colors?.[0] || "",
                size: product.sizes?.[0] ? String(product.sizes[0]) : "",
              }
            : item,
        ),
      );
    } else {
      updateItem(index, "productName", productName);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const handleSubmit = async () => {
    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !shippingAddress.trim()
    ) {
      toast.error("Please fill in customer name, phone, and address");
      return;
    }
    if (items.length === 0 || items.some((i) => !i.productName.trim())) {
      toast.error("Please add at least one item with a product name");
      return;
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;

    try {
      await addOrder.mutateAsync({
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail || "",
        customer_phone: customerPhone,
        shipping_address: shippingAddress,
        notes: notes || "",
        items: items as any,
        total,
        status: "pending",
        payment_method: "cod",
      });
      toast.success(`Order ${orderNumber} created successfully`);
      resetForm();
      setOpen(false);
    } catch {
      toast.error("Failed to create order");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PackagePlus className="h-4 w-4" /> Add Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl font-bold uppercase tracking-wider">
            Create New Order
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Customer Info */}
          <div>
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
              Customer Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="font-body text-xs">Name *</Label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                />
              </div>
              <div>
                <Label className="font-body text-xs">Phone *</Label>
                <Input
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+971..."
                />
              </div>
              <div>
                <Label className="font-body text-xs">Email</Label>
                <Input
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
              <div>
                <Label className="font-body text-xs">Shipping Address *</Label>
                <Input
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Block, Street, Area"
                />
              </div>
            </div>
            <div className="mt-3">
              <Label className="font-body text-xs">Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Order notes..."
                rows={2}
              />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Order Items
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={addItem}
                className="gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" /> Add Item
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs font-semibold text-muted-foreground">
                      Item {index + 1}
                    </span>
                    {items.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(index)}
                        className="h-7 w-7 p-0 text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  <div>
                    <Label className="font-body text-xs">Product *</Label>
                    <select
                      value={item.productName}
                      onChange={(e) => selectProduct(index, e.target.value)}
                      className="w-full px-3 py-2 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                    >
                      <option value="">Select a product...</option>
                      {products
                        .filter((p) => p.is_active)
                        .map((p) => (
                          <option key={p.id} value={p.name}>
                            {p.name} - OMR {p.price}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="font-body text-xs">Size</Label>
                      <Input
                        value={item.size}
                        onChange={(e) =>
                          updateItem(index, "size", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Color</Label>
                      <Input
                        value={item.color}
                        onChange={(e) =>
                          updateItem(index, "color", e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Qty</Label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "quantity",
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="font-body text-xs">Price</Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={item.price}
                        onChange={(e) =>
                          updateItem(index, "price", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total & Submit */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <div>
              <span className="font-heading text-lg font-bold text-foreground">
                Total:{" "}
              </span>
              <span className="font-heading text-lg font-bold text-primary">
                OMR {total}
              </span>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={addOrder.isPending}
              className="gap-2"
            >
              {addOrder.isPending ? "Creating..." : "Create Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddOrderDialog;
