import { useParams, Link, useLocation } from "react-router-dom";
import { useOrders, useUpdateOrderStatus } from "@/hooks/useDatabase";
import {
  printInvoice,
  printCourierSlip,
} from "@/components/admin/InvoicePrint";
import {
  Printer,
  Truck,
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import DirhamIcon from "@/components/DirhamIcon";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
  confirmed: "bg-blue-100 text-blue-700 border-blue-200",
  shipped: "bg-purple-100 text-purple-700 border-purple-200",
  delivered: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
};

const statusSteps = ["pending", "confirmed", "shipped", "delivered"];

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const OrderDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const backLink = location.pathname.includes("/dealer-orders")
    ? "/admin/dealer-orders"
    : "/admin/orders";
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();

  const order = orders.find((o) => o.id === id);

  const handleStatusChange = async (status: string) => {
    if (!order) return;
    try {
      await updateStatus.mutateAsync({ id: order.id, status });
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">Loading...</p>
    );
  if (!order)
    return (
      <div className="text-center py-20">
        <p className="font-heading text-2xl font-bold text-foreground mb-2">
          Order Not Found
        </p>
        <Link
          to={backLink}
          className="font-body text-sm text-primary hover:underline"
        >
          ← Back to Orders
        </Link>
      </div>
    );

  const items = (order.items as any[]) || [];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Link
            to={backLink}
            className="p-2 hover:bg-secondary rounded-md transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-muted-foreground" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-heading text-2xl md:text-3xl font-bold uppercase tracking-wider text-foreground">
                {order.order_number}
              </h1>
              <span
                className={`px-3 py-1 text-xs font-body font-bold rounded-full uppercase border ${statusColors[order.status] || ""}`}
              >
                {order.status}
              </span>
            </div>
            <p className="font-body text-sm text-muted-foreground mt-1">
              Placed on{" "}
              {new Date(order.created_at).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}{" "}
              at{" "}
              {new Date(order.created_at).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => printInvoice(order)}
            className="gap-1.5"
          >
            <Printer className="h-3.5 w-3.5" /> Print Invoice
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printCourierSlip(order)}
            className="gap-1.5"
          >
            <Truck className="h-3.5 w-3.5" /> Courier Slip
          </Button>
        </div>
      </div>

      {/* Status Timeline */}
      {!isCancelled && (
        <div className="bg-card border border-border rounded-lg p-6 mb-6">
          <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-6">
            Order Progress
          </h3>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border" />
            <div
              className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500"
              style={{
                width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%`,
              }}
            />
            {statusSteps.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div
                  key={step}
                  className="relative flex flex-col items-center z-10"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border-2 border-border text-muted-foreground"
                    } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`font-body text-xs mt-2 capitalize ${isCompleted ? "text-foreground font-semibold" : "text-muted-foreground"}`}
                  >
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Order Items
              </h3>
            </div>
            <div className="divide-y divide-border">
              {items.map((item: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex-1">
                    <Link
                      to={
                        item.productId
                          ? `/admin/products?view=${item.productId}`
                          : `/admin/products?${new URLSearchParams({
                              name: String(item.productName || ""),
                              price: String(item.price || ""),
                              color: String(item.color || ""),
                              size: String(item.size || ""),
                            }).toString()}`
                      }
                      className="font-body text-sm font-semibold text-primary hover:underline"
                    >
                      {item.productName}
                    </Link>
                    <p className="font-body text-xs text-muted-foreground mt-0.5">
                      Size: {item.size} · Color: {item.color} · Qty:{" "}
                      {item.quantity}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm font-bold text-foreground flex items-center gap-1 justify-end">
                      <DirhamIcon /> {(item.price * item.quantity).toFixed(3)}
                    </p>
                    {item.quantity > 1 && (
                      <p className="font-body text-xs text-muted-foreground">
                        {Number(item.price).toFixed(3)} each
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>
                  Subtotal (
                  {items.reduce((s: number, i: any) => s + i.quantity, 0)}{" "}
                  items)
                </span>
                <span className="flex items-center gap-1">
                  <DirhamIcon /> {Number(order.total).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm text-muted-foreground">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              <div className="flex justify-between font-heading text-lg font-bold text-foreground pt-2 border-t border-border">
                <span>Total</span>
                <span className="text-primary flex items-center gap-1">
                  <DirhamIcon /> {Number(order.total).toFixed(3)}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Order Notes
              </h3>
              <p className="font-body text-sm text-foreground">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Right Column - Customer & Actions */}
        <div className="space-y-6">
          {/* Update Status */}
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
              Update Status
            </h3>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full px-4 py-2.5 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Customer Info */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Customer
              </h3>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-body text-sm font-semibold text-foreground">
                  {order.customer_name}
                </p>
              </div>
              <div>
                <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                  Phone
                </p>
                <a
                  href={`tel:${order.customer_phone}`}
                  className="font-body text-sm text-primary hover:underline"
                >
                  {order.customer_phone}
                </a>
              </div>
              {order.customer_email && (
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-0.5">
                    Email
                  </p>
                  <a
                    href={`mailto:${order.customer_email}`}
                    className="font-body text-sm text-primary hover:underline"
                  >
                    {order.customer_email}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Shipping Address
              </h3>
            </div>
            <p className="font-body text-sm text-foreground leading-relaxed">
              {order.shipping_address}
            </p>
          </div>

          {/* Payment */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Payment
              </h3>
            </div>
            <p className="font-body text-sm font-semibold text-foreground uppercase">
              {order.payment_method}
            </p>
          </div>

          {/* Timestamps */}
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-heading text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Timeline
              </h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="text-foreground">
                  {new Date(order.created_at).toLocaleDateString("en-GB")}
                </span>
              </div>
              <div className="flex justify-between font-body text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-foreground">
                  {new Date(order.updated_at).toLocaleDateString("en-GB")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsPage;
