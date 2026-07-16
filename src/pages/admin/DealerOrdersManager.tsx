import AddOrderDialog from "@/components/admin/AddOrderDialog";
import {
  printCourierSlip,
  printInvoice,
} from "@/components/admin/InvoicePrint";
import DirhamIcon from "@/components/DirhamIcon";
import { Button } from "@/components/ui/button";
import {
  useDeleteOrder,
  useOrders,
  useUpdateOrderStatus,
} from "@/hooks/useDatabase";
import { Eye, Printer, Trash2, Truck } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const statuses = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const DealerOrdersManager = () => {
  const { data: orders = [], isLoading } = useOrders();
  const updateStatus = useUpdateOrderStatus();
  const deleteOrder = useDeleteOrder();
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    let result = orders.filter((o) => o.customer_email);
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result;
  }, [orders, statusFilter]);

  const statusCounts = useMemo(() => {
    const dealerOrders = orders.filter((o) => o.customer_email);
    const counts: Record<string, number> = { all: dealerOrders.length };
    statuses.forEach((s) => {
      counts[s] = dealerOrders.filter((o) => o.status === s).length;
    });
    return counts;
  }, [orders]);

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Order updated to ${status}`);
    } catch {
      toast.error("Failed to update");
    }
  };

  const handleDelete = async (id: string, orderNumber: string) => {
    if (
      !window.confirm(`Are you sure you want to delete order ${orderNumber}?`)
    )
      return;
    try {
      await deleteOrder.mutateAsync(id);
      toast.success(`Order ${orderNumber} deleted`);
    } catch {
      toast.error("Failed to delete order");
    }
  };

  if (isLoading)
    return (
      <p className="text-center py-10 text-muted-foreground">
        Loading orders...
      </p>
    );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground">
            Dealer Orders
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {statusCounts["all"]} total orders
          </p>
        </div>
        <AddOrderDialog />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {["all", ...statuses].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 rounded-md font-body text-sm font-medium transition-colors ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className="ml-1.5 text-xs opacity-70">
              ({statusCounts[s] || 0})
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.map((order) => {
          const items = (order.items as any[]) || [];
          return (
            <div
              key={order.id}
              className="bg-card border border-border p-6 rounded-lg hover:border-primary/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-heading text-lg font-bold uppercase text-foreground">
                      {order.order_number}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs font-body font-bold rounded-full uppercase ${statusColors[order.status] || ""}`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="font-body text-sm text-muted-foreground mt-1">
                    {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/admin/dealer-orders/${order.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" /> View
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printInvoice(order)}
                    className="gap-1.5"
                  >
                    <Printer className="h-3.5 w-3.5" /> Invoice
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => printCourierSlip(order)}
                    className="gap-1.5"
                  >
                    <Truck className="h-3.5 w-3.5" /> Courier Slip
                  </Button>
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleStatusChange(order.id, e.target.value)
                    }
                    className="px-4 py-2 border border-border bg-background rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(order.id, order.order_number)}
                    className="gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Customer
                  </p>
                  <p className="font-body text-sm font-semibold text-foreground">
                    {order.customer_name}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {order.customer_email}
                  </p>
                  <p className="font-body text-xs text-muted-foreground">
                    {order.customer_phone}
                  </p>
                  <p className="font-body text-xs text-muted-foreground mt-1">
                    {order.shipping_address}
                  </p>
                </div>
                <div>
                  <p className="font-body text-xs uppercase tracking-wider text-muted-foreground mb-2">
                    Items
                  </p>
                  {items.map((item: any, i: number) => (
                    <div
                      key={i}
                      className="flex justify-between font-body text-sm py-1 text-foreground"
                    >
                      <span>
                        {item.productName} (Size {item.size}, {item.color}) x
                        {item.quantity}
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        <DirhamIcon /> {item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between font-heading text-base font-bold mt-2 pt-2 border-t border-border text-foreground">
                    <span>Total</span>
                    <span className="text-primary flex items-center gap-1">
                      <DirhamIcon /> {Number(order.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DealerOrdersManager;
