import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Check,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Receipt,
  ShoppingCart,
  Store,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useOrders } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "admin_read_orders";

// Soft chime sound using Web Audio API
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch (err) {
    // Browser audio autoplay restrictions may silently suppress
  }
};

const formatTimeAgo = (dateStr?: string) => {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export const AdminOrderNotification = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: orders = [] } = useOrders();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "today" | "all">("new");

  // Read orders tracking
  const [readOrderIds, setReadOrderIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch {
      return new Set();
    }
  });

  const prevOrderCountRef = useRef<number>(orders.length);
  const isFirstRender = useRef(true);

  // Mark order as read in state & localStorage
  const markAsRead = (id: string) => {
    setReadOrderIds((prev) => {
      const updated = new Set(prev);
      updated.add(id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(updated)));
      } catch (e) {
        console.error("Failed to save read orders", e);
      }
      return updated;
    });
  };

  const markAllAsRead = () => {
    const allIds = orders.map((o) => o.id);
    const updated = new Set(allIds);
    setReadOrderIds(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allIds));
      toast.success("All order notifications marked as read");
    } catch (e) {
      console.error("Failed to save read orders", e);
    }
  };

  // Realtime subscription for sales_orders and pos_receipts
  useEffect(() => {
    const channel = supabase
      .channel("admin_orders_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "sales_orders" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          playChime();
          const orderNum = payload.new?.so_number || "New Order";
          toast.info(`🔔 New Sales Order Received: ${orderNum}`, {
            description: "Click notification bell to view details",
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pos_receipts" },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ["orders"] });
          playChime();
          const receiptNum = payload.new?.receipt_number || "New POS Sale";
          toast.info(`🛒 New POS Sale: ${receiptNum}`, {
            description: "New transaction completed in POS",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Audio alert and toast when order count increments during session
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      prevOrderCountRef.current = orders.length;
      return;
    }

    if (orders.length > prevOrderCountRef.current) {
      const latestOrder = orders[0];
      if (latestOrder) {
        playChime();
        const isDealer = latestOrder.customer_group === "Dealer";
        toast.info(
          `🔔 New ${isDealer ? "Dealer" : "Customer"} Order: ${latestOrder.order_number}`,
          {
            description: `${latestOrder.customer_name} • OMR ${Number(latestOrder.total || 0).toFixed(3)}`,
            action: {
              label: "View",
              onClick: () => {
                markAsRead(latestOrder.id);
                const link =
                  latestOrder.type === "pos_receipt"
                    ? `/admin/pos/receipt/${latestOrder.id}`
                    : isDealer
                    ? `/admin/dealer-orders/${latestOrder.id}`
                    : `/admin/orders/${latestOrder.id}`;
                navigate(link);
              },
            },
          }
        );
      }
    }
    prevOrderCountRef.current = orders.length;
  }, [orders, navigate]);

  // Orders filtered by today
  const todayOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      const d = new Date(o.created_at || new Date());
      return (
        d.getDate() === now.getDate() &&
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });
  }, [orders]);

  // Unread orders
  const unreadOrders = useMemo(() => {
    return orders.filter((o) => !readOrderIds.has(o.id));
  }, [orders, readOrderIds]);

  const unreadCount = unreadOrders.length;

  // Items to display based on activeTab
  const displayList = useMemo(() => {
    if (activeTab === "new") return unreadOrders.slice(0, 10);
    if (activeTab === "today") return todayOrders.slice(0, 10);
    return orders.slice(0, 10);
  }, [activeTab, unreadOrders, todayOrders, orders]);

  const handleOrderClick = (order: any) => {
    markAsRead(order.id);
    setOpen(false);
    if (order.type === "pos_receipt") {
      navigate(`/admin/pos/receipt/${order.id}`);
    } else if (order.customer_group === "Dealer") {
      navigate(`/admin/dealer-orders/${order.id}`);
    } else {
      navigate(`/admin/orders/${order.id}`);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Order Notifications"
          className="relative p-2 rounded-full text-gray-700 bg-white hover:bg-gray-100 hover:text-blue-600 border border-gray-200 transition focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          title={
            unreadCount > 0
              ? `${unreadCount} new order${unreadCount > 1 ? "s" : ""}`
              : "Order Notifications"
          }
        >
          <Bell className="h-4 w-4" />

          {/* Active Ping & Badge for Unread Orders */}
          {unreadCount > 0 && (
            <>
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-white text-[9px] font-bold items-center justify-center shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            </>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-xl border border-gray-200 rounded-xl bg-white overflow-hidden z-50"
      >
        {/* Header */}
        <div className="p-3.5 px-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/20 text-blue-300 rounded-lg">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Order Notifications
                </h4>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-[11px] text-gray-300">
                {unreadCount > 0
                  ? `${unreadCount} unread order${unreadCount > 1 ? "s" : ""}`
                  : "All orders caught up"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-[11px] text-blue-300 hover:text-white flex items-center gap-1 font-medium transition"
              title="Mark all as read"
            >
              <Check className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-gray-100 text-xs">
          <button
            onClick={() => setActiveTab("new")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition ${
              activeTab === "new"
                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            New ({unreadCount})
          </button>
          <button
            onClick={() => setActiveTab("today")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition ${
              activeTab === "today"
                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Today ({todayOrders.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`flex-1 py-1 px-2 rounded-md font-medium text-center transition ${
              activeTab === "all"
                ? "bg-white text-gray-900 shadow-2xs font-semibold"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All Recent
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-gray-100">
          {displayList.length > 0 ? (
            displayList.map((order) => {
              const isUnread = !readOrderIds.has(order.id);
              const isDealer = order.customer_group === "Dealer";
              const isPos = order.type === "pos_receipt";

              return (
                <div
                  key={order.id}
                  onClick={() => handleOrderClick(order)}
                  className={`p-3 px-4 flex items-start gap-3 hover:bg-slate-50 cursor-pointer transition relative group ${
                    isUnread ? "bg-blue-50/40" : "bg-white"
                  }`}
                >
                  {/* Status Indicator Icon */}
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      isDealer
                        ? "bg-purple-100 text-purple-700"
                        : isPos
                        ? "bg-amber-100 text-amber-700"
                        : "bg-blue-100 text-blue-700"
                    }`}
                  >
                    {isDealer ? (
                      <Store className="w-4 h-4" />
                    ) : isPos ? (
                      <Receipt className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>

                  {/* Order Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="font-bold text-xs text-gray-900 group-hover:text-blue-600 transition">
                          {order.order_number || order.id.slice(0, 8)}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full border ${
                            isDealer
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          }`}
                        >
                          {isDealer ? "Dealer" : "Customer"}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 shrink-0">
                        {formatTimeAgo(order.created_at)}
                      </span>
                    </div>

                    <div className="text-xs text-gray-700 truncate mt-0.5 font-medium">
                      {order.customer_name || "Walk-in Customer"}
                    </div>

                    <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-gray-100/60">
                      <span className="text-gray-500 font-medium">
                        OMR {Number(order.total || 0).toFixed(3)}
                      </span>
                      <span className="text-[10px] uppercase font-semibold text-gray-500 px-1.5 py-0.2 bg-gray-100 rounded">
                        {order.status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Unread dot */}
                  {isUnread && (
                    <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 self-center" />
                  )}
                </div>
              );
            })
          ) : (
            <div className="py-10 px-4 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
              <p className="text-xs font-semibold text-gray-800">
                {activeTab === "new"
                  ? "No new unread orders"
                  : activeTab === "today"
                  ? "No orders received today yet"
                  : "No recent orders"}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
                New incoming orders will trigger instant notification
              </p>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-2.5 px-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs">
          <Link
            to="/admin/orders"
            onClick={() => setOpen(false)}
            className="text-blue-600 hover:text-blue-800 font-semibold hover:underline"
          >
            Customer Orders
          </Link>
          <span className="text-gray-300">•</span>
          <Link
            to="/admin/dealer-orders"
            onClick={() => setOpen(false)}
            className="text-purple-600 hover:text-purple-800 font-semibold hover:underline"
          >
            Dealer Orders
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
