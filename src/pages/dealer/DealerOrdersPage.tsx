import React, { useState } from "react";
import DealerLayout from "./DealerLayout";
import { useAuth } from "@/context/AuthContext";
import { useCustomerOrders, useDealerDeleteOrder } from "@/hooks/useDatabase";
import {
  ShoppingCart,
  Clock,
  CheckCircle2,
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  Trash2,
  Truck,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  Loader2,
} from "lucide-react";
import DirhamIcon from "@/components/DirhamIcon";
import { toast } from "sonner";
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

const defaultDemoOrders = [
  {
    id: "ORD-DLR-8901",
    order_number: "ORD-DLR-8901",
    created_at: new Date().toISOString(),
    status: "confirmed",
    shipping_address: "Dealer Main Branch, Muscat",
    total_amount: 1450,
    items: [
      { productName: "Toyota Corolla Brake Pads", size: 42, color: "Ceramic", quantity: 10, price: 95 },
      { productName: "Mobil 1 Synthetic Motor Oil 5W-30", size: 4, color: "Gold Bottle", quantity: 10, price: 50 },
    ],
  },
  {
    id: "ORD-DLR-8842",
    order_number: "ORD-DLR-8842",
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    status: "pending",
    shipping_address: "Dealer Depot, Ruwi",
    total_amount: 680,
    items: [
      { productName: "NGK Iridium Spark Plugs (Pack of 4)", size: 1, color: "Standard", quantity: 8, price: 85 },
    ],
  },
];

export default function DealerOrdersPage() {
  const { user } = useAuth();
  const { data: dbOrders = [], isLoading } = useCustomerOrders(user?.email);
  const deleteDealerOrder = useDealerDeleteOrder();
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [orderToDelete, setOrderToDelete] = useState<{ id: string; orderNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!orderToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDealerOrder.mutateAsync(orderToDelete.id);
      toast.success("Order removed from history");
      setOrderToDelete(null);
    } catch {
      toast.error("Failed to remove order");
    } finally {
      setIsDeleting(false);
    }
  };

  const safeOrders = Array.isArray(dbOrders) && dbOrders.length > 0
    ? dbOrders
    : defaultDemoOrders;

  const filteredOrders = safeOrders.filter((o) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const orderNum = String(o.order_number || o.id || "");
    const status = String(o.status || "");
    const items = o.items ? JSON.stringify(o.items).toLowerCase() : "";
    return (
      orderNum.toLowerCase().includes(term) ||
      status.toLowerCase().includes(term) ||
      items.includes(term)
    );
  });

  const totalSpent = safeOrders.reduce((acc, o) => acc + (Number(o.total_amount) || 0), 0);
  const pendingCount = safeOrders.filter((o) => o.status === "pending").length;
  const completedCount = safeOrders.filter(
    (o) => o.status === "delivered" || o.status === "shipped",
  ).length;

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Orders
              </p>
              <h3 className="text-2xl font-extrabold text-gray-900 mt-0.5">
                {safeOrders.length}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Pending Approval
              </p>
              <h3 className="text-2xl font-extrabold text-amber-600 mt-0.5">
                {pendingCount}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Shipped / Delivered
              </p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-0.5">
                {completedCount}
              </h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Total Order Value
              </p>
              <div className="flex items-center gap-1 text-2xl font-extrabold text-gray-900 mt-0.5">
                <DirhamIcon size={20} />
                <span>{totalSpent.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order # or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <p className="text-xs text-gray-500 font-medium">
            Showing <strong className="text-gray-900">{filteredOrders.length}</strong> of {safeOrders.length} orders
          </p>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-gray-500 font-medium">
              Loading order history...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                No Orders Found
              </h4>
              <p className="text-sm text-gray-500">
                {searchTerm
                  ? "No orders match your search query."
                  : "You haven't placed any wholesale orders yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6">Order Number</th>
                    <th className="py-4 px-4">Date</th>
                    <th className="py-4 px-4">Status</th>
                    <th className="py-4 px-4">Address</th>
                    <th className="py-4 px-4">Total</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredOrders.map((o) => {
                    const isExpanded = expandedId === o.id;
                    const itemsList = Array.isArray(o.items) ? o.items : [];
                    const statusColors: Record<string, string> = {
                      pending: "bg-amber-50 text-amber-700 border-amber-200",
                      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
                      shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
                      delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
                      cancelled: "bg-red-50 text-red-700 border-red-200",
                    };

                    return (
                      <React.Fragment key={o.id}>
                        <tr className="hover:bg-gray-50/70 transition-colors group">
                          <td className="py-4 px-6 font-bold text-gray-900 font-mono">
                            {o.order_number || o.id.slice(0, 8)}
                          </td>
                          <td className="py-4 px-4 text-gray-600">
                            {new Date(o.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${
                                statusColors[o.status] || "bg-gray-50 text-gray-700"
                              }`}
                            >
                              {o.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-gray-600 max-w-xs truncate">
                            {o.shipping_address || "Standard Address"}
                          </td>
                          <td className="py-4 px-4 font-extrabold text-gray-900">
                            <div className="flex items-center gap-1">
                              <DirhamIcon size={14} />
                              <span>{Number(o.total_amount).toLocaleString()}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-right space-x-2">
                            <button
                              onClick={() =>
                                setExpandedId(isExpanded ? null : o.id)
                              }
                              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <span>Items ({itemsList.length})</span>
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              onClick={() => setOrderToDelete({ id: o.id, orderNumber: o.order_number || o.id })}
                              disabled={deleteDealerOrder.isPending || isDeleting}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center"
                              title="Delete from history"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>

                        {/* Expanded Item Details */}
                        {isExpanded && (
                          <tr className="bg-gray-50/90">
                            <td colSpan={6} className="p-6">
                              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
                                <h5 className="font-bold text-xs uppercase tracking-wider text-gray-500 border-b border-gray-100 pb-2">
                                  Order Items & Details
                                </h5>
                                <div className="divide-y divide-gray-100">
                                  {itemsList.map((item: any, idx: number) => (
                                    <div
                                      key={idx}
                                      className="py-2.5 flex items-center justify-between text-sm"
                                    >
                                      <div>
                                        <p className="font-bold text-gray-900">
                                          {item.productName || item.name || "Product"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                          Quantity: {item.quantity} | Size: {item.size || "N/A"} | Color: {item.color || "Standard"}
                                        </p>
                                      </div>
                                      <div className="font-bold text-gray-900 flex items-center gap-1">
                                        <DirhamIcon size={14} />
                                        <span>
                                          {(
                                            (Number(item.price) || 0) *
                                            (Number(item.quantity) || 1)
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
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
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Remove Order
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2 text-left">
              {orderToDelete && (
                <>
                  <p className="text-gray-800 text-sm">
                    Are you sure you want to remove order{" "}
                    <strong className="font-semibold text-gray-950">
                      {orderToDelete.orderNumber}
                    </strong>{" "}
                    from your history?
                  </p>
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs space-y-1 font-medium">
                    <p className="font-bold flex items-center gap-1.5">
                      ⚠️ Automatic System Reversal
                    </p>
                    <p>Deleting this order will automatically:</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-red-600">
                      <li>Restore reserved product quantities to warehouse inventory</li>
                      <li>Reverse outstanding order dues</li>
                      <li>Remove order records from dealer portal</li>
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
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                "Remove Order"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DealerLayout>
  );
}
