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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Eye, Loader2, Printer, Trash2, Truck, UserCheck } from "lucide-react";
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
  const [salesmanFilter, setSalesmanFilter] = useState("all");

  const availableSalesmen = useMemo(() => {
    const names = new Set<string>();
    orders.forEach((o) => {
      if (o.salesman_name) names.add(o.salesman_name);
    });
    return Array.from(names).sort();
  }, [orders]);

  const filtered = useMemo(() => {
    let result = orders.filter((o) => o.customer_group === 'Dealer');
    if (statusFilter === "all") {
      result = result.filter((o) => (o.status || "").toLowerCase() !== "delivered");
    } else {
      result = result.filter((o) => (o.status || "").toLowerCase() === statusFilter.toLowerCase());
    }
    if (salesmanFilter !== "all") {
      result = result.filter((o) => o.salesman_name === salesmanFilter);
    }
    return result;
  }, [orders, statusFilter, salesmanFilter]);

  const statusCounts = useMemo(() => {
    const dealerOrders = orders.filter((o) => o.customer_group === 'Dealer');
    const counts: Record<string, number> = {
      all: dealerOrders.filter((o) => (o.status || "").toLowerCase() !== "delivered").length,
    };
    statuses.forEach((s) => {
      counts[s] = dealerOrders.filter((o) => (o.status || "").toLowerCase() === s.toLowerCase()).length;
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

  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteOrder.mutateAsync(orderToDelete.id);
      toast.success(`Order ${orderToDelete.orderNumber} deleted and reversed successfully`);
      setOrderToDelete(null);
    } catch {
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
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
            {statusCounts["all"]} active orders · {statusCounts["delivered"] || 0} delivered
          </p>
        </div>
        <AddOrderDialog />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap gap-2">
          {["all", ...statuses].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-md font-body text-sm font-medium transition-colors ${
                statusFilter === s
                  ? s === "delivered"
                    ? "bg-emerald-600 text-white font-semibold"
                    : "bg-primary text-primary-foreground"
                  : s === "delivered"
                  ? "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 font-semibold"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
              }`}
            >
              {s === "all" ? "All Orders" : s.charAt(0).toUpperCase() + s.slice(1)}
              <span className="ml-1.5 text-xs opacity-70">
                ({statusCounts[s] || 0})
              </span>
            </button>
          ))}
        </div>

        {availableSalesmen.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Sales Rep:</span>
            <select
              value={salesmanFilter}
              onChange={(e) => setSalesmanFilter(e.target.value)}
              className="px-3 py-1.5 border border-border bg-background rounded-md text-xs font-medium text-foreground focus:outline-none focus:border-primary"
            >
              <option value="all">All Sales Reps</option>
              {availableSalesmen.map((rep) => (
                <option key={rep} value={rep}>
                  👤 {rep}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-lg text-center">
            <p className="text-base font-bold text-foreground">
              {statusFilter === "delivered"
                ? "No delivered dealer orders found"
                : statusFilter === "all"
                ? "No active dealer orders found"
                : `No dealer orders with status "${statusFilter}"`}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {statusFilter === "all"
                ? "Delivered orders have been moved to the Delivered Orders tab."
                : "Try selecting a different status filter."}
            </p>
          </div>
        ) : (
          filtered.map((order) => {
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
                    {order.salesman_name && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-body font-semibold rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <UserCheck className="w-3 h-3 text-amber-600" />
                        <span>Rep: {order.salesman_name}</span>
                        {order.order_source === "field_marketing" && (
                          <span className="ml-1 text-[10px] text-emerald-700 font-bold bg-emerald-100 px-1 rounded">
                            Field
                          </span>
                        )}
                      </span>
                    )}
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
                  <Link to={`/admin/pos/receipt/${order.id}`}>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Printer className="h-3.5 w-3.5" /> Receipt
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
                    onClick={() => setOrderToDelete({ id: order.id, orderNumber: order.order_number })}
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
        })
      )}
      </div>

      {/* Modern In-App Confirmation Dialog for Delete */}
      <AlertDialog
        open={!!orderToDelete}
        onOpenChange={(open) => {
          if (!open && !isDeleting) setOrderToDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-5 h-5" />
              Delete Dealer Order
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              {orderToDelete && (
                <>
                  <p className="text-foreground text-sm">
                    Are you sure you want to delete order{" "}
                    <strong className="font-semibold text-foreground">
                      {orderToDelete.orderNumber}
                    </strong>
                    ?
                  </p>
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive text-xs space-y-1 font-medium">
                    <p className="font-bold flex items-center gap-1.5">
                      ⚠️ Automatic System Reversal
                    </p>
                    <p>Deleting this order will automatically:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-destructive/90">
                      <li>Restore deducted product quantities back to warehouse inventory</li>
                      <li>Remove stock out ledger entries and restore FIFO cost layers</li>
                      <li>Reverse dealer dues and void general ledger journal entries</li>
                    </ul>
                  </div>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DealerOrdersManager;
