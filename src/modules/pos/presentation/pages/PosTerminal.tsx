import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CreditCard,
  Search,
  ShoppingCart,
  Trash2,
  User,
  Plus,
  Minus,
  Package,
  Store,
  X,
  AlertTriangle,
  Tag,
  CheckCircle2,
  Banknote,
  Landmark,
  Clock,
  Printer,
  FileCheck,
  RotateCcw,
  LayoutGrid,
  ChevronRight,
} from "lucide-react";
import React, { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCustomers } from "../../../customer/presentation/hooks/useCustomers";
import { useCategories } from "@/hooks/useCategories";
import { useProductTemplates } from "../../../product/presentation/hooks/useProducts";
import PosPaymentModal from "../components/PosPaymentModal";
import { usePosCart } from "../hooks/usePosCart";
import { usePosSession } from "../hooks/usePosSession";
import { usePreviousWalkIns } from "../hooks/usePreviousWalkIns";
import { useToast } from "@/hooks/use-toast";

export default function PosTerminal() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentShift, isLoadingShift, registers } = usePosSession();
  const { data: products = [], isLoading: isLoadingProducts } = useProductTemplates();
  const { customers } = useCustomers();
  const { data: categories = [] } = useCategories();
  const { data: previousWalkIns } = usePreviousWalkIns();

  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");

  // Mobile / Tablet Tab Switcher ("catalog" vs "cart")
  const [activeMobileTab, setActiveMobileTab] = useState<"catalog" | "cart">("catalog");

  // In-Sidebar Order & Payment State
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card" | "Bank Transfer" | "Due">("Cash");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [paymentRef, setPaymentRef] = useState<string>("");
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [completedReceipt, setCompletedReceipt] = useState<any>(null);

  // Split payment entries — each line is one tender (method + amount + optional ref)
  type PaymentEntry = { method: "Cash" | "Card" | "Bank Transfer" | "Due"; amount: string; reference_code: string };
  const [splitPayments, setSplitPayments] = useState<PaymentEntry[]>([{ method: "Cash", amount: "", reference_code: "" }]);


  const selectedCustomer = customers?.find((c) => c.id === selectedCustomerId);
  const register = registers?.find((r) => r.id === currentShift?.register_id);
  const warehouseId = register?.warehouse_id || "";

  // ── 1. Fetch Real-time Stock Balances for the active warehouse ───────────
  const { data: warehouseStock = [] } = useQuery({
    queryKey: ["pos-warehouse-stock", warehouseId],
    queryFn: async () => {
      if (!warehouseId) return [];
      const { data, error } = await supabase
        .from("stock_balances")
        .select("variation_id, quantity")
        .eq("warehouse_id", warehouseId);
      if (error) throw error;
      return data || [];
    },
    enabled: !!warehouseId,
  });

  const stockMap = useMemo(() => {
    const map = new Map<string, number>();
    warehouseStock.forEach((s) => map.set(s.variation_id, Number(s.quantity || 0)));
    return map;
  }, [warehouseStock]);

  // ── 2. Fetch Price List Items ────────────────────────────────────────────
  const { data: priceListItems = [] } = useQuery({
    queryKey: ["pos-price-list-items"],
    queryFn: async () => {
      const { data } = await supabase
        .from("price_list_items")
        .select("variation_id, price, price_list_id, price_lists(name)");
      return data || [];
    },
  });

  const priceMap = useMemo(() => {
    const map = new Map<string, { retail?: number; wholesale?: number }>();
    priceListItems.forEach((pli: any) => {
      const entry = map.get(pli.variation_id) || {};
      const listName = pli.price_lists?.name?.toLowerCase() || "";
      if (listName.includes("retail")) entry.retail = Number(pli.price);
      if (listName.includes("wholesale") || listName.includes("dealer")) entry.wholesale = Number(pli.price);
      map.set(pli.variation_id, entry);
    });
    return map;
  }, [priceListItems]);

  // ── 3. POS Cart Hook ─────────────────────────────────────────────────────
  const isDealer = selectedCustomerId === "dealer" || selectedCustomer?.customer_group === "Dealer";

  const {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    total,
    checkout,
    isCheckingOut,
  } = usePosCart(
    warehouseId,
    currentShift?.id,
    selectedCustomerId === "dealer" ? undefined : selectedCustomerId,
    isDealer ? "Dealer" : selectedCustomer?.customer_group || "",
  );

  // Map of variation_id -> quantity added in cart
  const cartQtyMap = useMemo(() => {
    const map = new Map<string, number>();
    cart.forEach((item) => {
      map.set(item.variation_id, item.quantity);
    });
    return map;
  }, [cart]);

  const totalCartItemsCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Helper: compute display price
  const getDisplayPrice = (variationId: string, product: any): number => {
    const pli = priceMap.get(variationId);
    if (isDealer) {
      if (pli?.wholesale && pli.wholesale > 0) return pli.wholesale;
      if (product.dealer_price && Number(product.dealer_price) > 0) return Number(product.dealer_price);
    }
    if (pli?.retail && pli.retail > 0) return pli.retail;
    return Number(product.price || product.original_price || 0);
  };

  // Helper: compute stock
  const getStock = (variationId: string, product: any): number => {
    if (stockMap.has(variationId)) {
      return stockMap.get(variationId)!;
    }
    return Number(product.stock || 0);
  };

  // Tender calculations
  const effectiveTendered = amountTendered === "" ? total : Number(amountTendered) || 0;
  const changeAmount = Math.max(0, effectiveTendered - total);
  const remainingAmount = Math.max(0, total - effectiveTendered);

  // ── 4. Filtered Products ─────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p) => {
      const matchCategory =
        selectedCategory === "all" || p.category_id === selectedCategory;

      const q = searchInput.trim().toLowerCase();
      if (!q) return matchCategory;

      const matchName = p.name?.toLowerCase().includes(q);
      const matchSku = p.variations?.some(
        (v: any) =>
          v.sku?.toLowerCase().includes(q) || v.barcode?.toLowerCase().includes(q)
      );

      return matchCategory && (matchName || matchSku);
    });
  }, [products, searchInput, selectedCategory]);

  if (isLoadingShift) {
    return <div className="p-12 text-center text-muted-foreground">Loading POS Session...</div>;
  }

  if (!currentShift) {
    return (
      <div className="p-12 text-center space-y-4 max-w-md mx-auto bg-white rounded-xl border shadow-sm my-8">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">No Active Register Shift</h2>
        <p className="text-sm text-muted-foreground">
          You must open a register shift before accessing the terminal to sell items.
        </p>
        <Button onClick={() => navigate("/admin/pos")} className="w-full">
          Open Register Shift
        </Button>
      </div>
    );
  }

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    const term = searchInput.trim().toLowerCase();
    for (const p of products || []) {
      const v = p.variations?.find(
        (v: any) =>
          v.barcode?.toLowerCase() === term || v.sku?.toLowerCase() === term
      );
      if (v) {
        handleAddToCart(v, p);
        setSearchInput("");
        return;
      }
    }
  };

  const handleAddToCart = (variation: any, product: any) => {
    const stock = getStock(variation.id, product);
    if (stock <= 0) {
      toast({
        variant: "destructive",
        title: "Item Out of Stock",
        description: `"${product.name}" has 0 quantity available in this warehouse.`,
      });
      return;
    }
    addItem(variation, product, 1);
  };

  // Direct In-Sidebar Checkout Handler
  const handleDirectOrderCreate = async () => {
    if (cart.length === 0) return;

    // Check Due customer validation
    if (paymentMethod === "Due" && !selectedCustomerId && selectedCustomerId !== "dealer" && !walkInName.trim()) {
      toast({
        variant: "destructive",
        title: "Customer Required",
        description: "Please provide a customer name for Due / Credit sales.",
      });
      return;
    }

    try {
      const receipt = await checkout({
        payments: [
          {
            method: paymentMethod,
            amount: paymentMethod === "Due" ? total : (amountTendered === "" ? total : Math.min(effectiveTendered, total)),
            reference_code: paymentRef || undefined,
          },
        ],
        walkInName: selectedCustomerId === "" ? walkInName : undefined,
        walkInPhone: selectedCustomerId === "" ? walkInPhone : undefined,
        walkInDealerName: selectedCustomerId === "dealer" ? walkInName : undefined,
        walkInDealerPhone: selectedCustomerId === "dealer" ? walkInPhone : undefined,
      });

      setCompletedReceipt(receipt);
      setAmountTendered("");
      setPaymentRef("");
      setSelectedCustomerId("");
      setWalkInName("");
      setWalkInPhone("");
      setActiveMobileTab("catalog");
    } catch (e: any) {}
  };

  // Split Payment Completed Handler (used for both single + multi-tender)
  const handleSplitPaymentComplete = async (paymentsArg?: { method: string; amount: number; reference_code?: string }[]) => {
    const entries = paymentsArg ?? splitPayments.map(p => ({
      method: p.method,
      amount: parseFloat(p.amount) || 0,
      reference_code: p.reference_code || undefined,
    })).filter(p => p.amount > 0);

    if (entries.length === 0) return;

    // Validate: Due needs a customer name
    const hasDue = entries.some(p => p.method === "Due");
    if (hasDue && !selectedCustomerId && selectedCustomerId !== "dealer" && !walkInName.trim()) {
      toast({ variant: "destructive", title: "Customer Required", description: "Please provide a customer name for Due / Credit sales." });
      return;
    }

    try {
      const receipt = await checkout({
        payments: entries,
        walkInName: selectedCustomerId === "" ? walkInName : undefined,
        walkInPhone: selectedCustomerId === "" ? walkInPhone : undefined,
        walkInDealerName: selectedCustomerId === "dealer" ? walkInName : undefined,
        walkInDealerPhone: selectedCustomerId === "dealer" ? walkInPhone : undefined,
      });
      setIsPaymentModalOpen(false);
      setCompletedReceipt(receipt);
      setSplitPayments([{ method: "Cash", amount: "", reference_code: "" }]);
      setSelectedCustomerId("");
      setWalkInName("");
      setWalkInPhone("");
      setActiveMobileTab("catalog");
    } catch (e) {}
  };

  return (
    <div
      className="flex flex-col gap-2.5 w-full max-w-full overflow-hidden"
      style={{ height: 'calc(100vh - 6.5rem)' }}
    >
      {/* ── Mobile / Small-Screen Tab Switcher (hidden on md+) ── */}
      <div className="md:hidden flex items-center bg-slate-200/80 p-1 rounded-lg shrink-0">
        <button
          type="button"
          onClick={() => setActiveMobileTab("catalog")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "catalog"
              ? "bg-white text-blue-700 shadow-xs"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMobileTab("cart")}
          className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
            activeMobileTab === "cart"
              ? "bg-blue-600 text-white shadow-xs"
              : "text-gray-700 hover:text-gray-900"
          }`}
        >
          <ShoppingCart className="w-3.5 h-3.5" />
          <span>Order ({totalCartItemsCount})</span>
          {total > 0 && <span className="font-bold ml-1">OMR {total.toFixed(3)}</span>}
        </button>
      </div>

      {/* ── Main Container: Side-by-Side on md+, tabbed on small ── */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 min-h-0 overflow-hidden">
        {/* ── Left Panel: Catalog, Search & Product Grid ── */}
        <div
          className={`flex-1 min-w-0 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden ${
            activeMobileTab === "cart" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* Top Header Bar */}
          <div className="p-2.5 sm:p-3 border-b bg-white flex items-center gap-2 sm:gap-3">
            <Link to="/admin/pos">
              <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8 text-gray-600" title="Return to POS Overview">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div className="hidden sm:flex items-center gap-2 pr-3 border-r">
              <Store className="w-4 h-4 text-blue-600" />
              <div>
                <div className="text-xs font-semibold text-gray-900 leading-none truncate max-w-[120px]">
                  {register?.name || "Main Counter"}
                </div>
                <div className="text-[10px] text-emerald-600 font-medium">Active Shift</div>
              </div>
            </div>

            {/* Live Search & Barcode Form */}
            <form onSubmit={handleBarcodeSubmit} className="flex-1 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <Input
                  autoFocus
                  placeholder="Search products, scan barcode..."
                  className="pl-8 pr-7 h-7 sm:h-8 text-xs bg-slate-50 border-gray-200"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => setSearchInput("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Category Filter Chips */}
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 border-b bg-slate-50 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
            <Button
              type="button"
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              className={`h-5 sm:h-6 px-2 sm:px-2.5 text-[10px] sm:text-[11px] rounded-full shrink-0 ${
                selectedCategory === "all" ? "bg-slate-900 text-white" : "bg-white text-gray-700"
              }`}
              onClick={() => setSelectedCategory("all")}
            >
              All ({products.length})
            </Button>
            {categories.map((cat: any) => (
              <Button
                key={cat.id}
                type="button"
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className={`h-5 sm:h-6 px-2 sm:px-2.5 text-[10px] sm:text-[11px] rounded-full shrink-0 whitespace-nowrap ${
                  selectedCategory === cat.id ? "bg-slate-900 text-white" : "bg-white text-gray-700"
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.name}
              </Button>
            ))}
          </div>

          {/* Responsive Products Grid */}
          <ScrollArea className="flex-1 p-2 sm:p-3 bg-slate-50/50">
            {isLoadingProducts ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-32 bg-slate-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Package className="w-8 h-8 mb-1.5 text-gray-300" />
                <p className="font-medium text-xs text-gray-700">No products match</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Try adjusting your search</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                {filteredProducts.map((p) =>
                  p.variations?.map((v: any) => {
                    const stock = getStock(v.id, p);
                    const price = getDisplayPrice(v.id, p);
                    const isOutOfStock = stock <= 0;
                    const isLowStock = stock > 0 && stock <= 10;
                    const cartQty = cartQtyMap.get(v.id) || 0;

                    return (
                      <div
                        key={v.id}
                        onClick={() => !isOutOfStock && cartQty === 0 && handleAddToCart(v, p)}
                        className={`group relative bg-white border rounded-lg p-2 sm:p-2.5 flex flex-col justify-between transition-all select-none ${
                          isOutOfStock
                            ? "opacity-50 bg-slate-100 border-dashed border-red-200 cursor-not-allowed"
                            : cartQty > 0
                            ? "border-blue-500 ring-1 ring-blue-400 bg-blue-50/10 shadow-2xs"
                            : "hover:border-blue-400 hover:shadow-2xs cursor-pointer active:scale-[0.99]"
                        }`}
                      >
                        <div>
                          {/* Top: SKU & In-Cart / Stock Badges */}
                          <div className="flex justify-between items-center mb-1 gap-1">
                            <span className="font-mono text-[9px] text-gray-400 truncate max-w-[70px]" title={v.sku}>
                              {v.sku}
                            </span>
                            
                            {cartQty > 0 ? (
                              <Badge className="bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0">
                                {cartQty} in cart
                              </Badge>
                            ) : isOutOfStock ? (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-red-50 text-red-700 border-red-200">
                                Out
                              </Badge>
                            ) : isLowStock ? (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-amber-50 text-amber-700 border-amber-200">
                                Low: {stock}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                {stock} left
                              </Badge>
                            )}
                          </div>

                          {/* Product Title */}
                          <h4 className="font-semibold text-xs text-gray-900 line-clamp-2 min-h-[1.75rem] leading-tight" title={p.name}>
                            {p.name}
                          </h4>
                        </div>

                        {/* Price & Add/Qty Action */}
                        <div className="mt-2 pt-1.5 border-t flex items-center justify-between">
                          <div>
                            <div className="text-[8px] uppercase font-bold text-gray-400">Price</div>
                            <div className="text-xs font-bold text-blue-700">
                              OMR {price.toFixed(3)}
                            </div>
                          </div>

                          {cartQty > 0 ? (
                            <div className="flex items-center border rounded bg-white overflow-hidden shadow-2xs">
                              <button
                                type="button"
                                className="w-4 sm:w-5 h-5 sm:h-6 flex items-center justify-center text-gray-600 hover:bg-slate-100 active:bg-slate-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(v.id, cartQty - 1);
                                }}
                              >
                                <Minus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </button>
                              <span className="w-5 sm:w-6 text-center text-[11px] font-bold text-blue-700">{cartQty}</span>
                              <button
                                type="button"
                                className="w-4 sm:w-5 h-5 sm:h-6 flex items-center justify-center text-gray-600 hover:bg-slate-100 active:bg-slate-200"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(v.id, cartQty + 1);
                                }}
                              >
                                <Plus className="w-2 h-2 sm:w-2.5 sm:h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              disabled={isOutOfStock}
                              className={`h-5 sm:h-6 px-1.5 sm:px-2 text-[10px] sm:text-[11px] font-medium ${
                                isOutOfStock
                                  ? "bg-slate-200 text-slate-400"
                                  : "bg-blue-600 hover:bg-blue-700 text-white"
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(v, p);
                              }}
                            >
                              <Plus className="w-2.5 h-2.5 mr-0.5" /> Add
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </ScrollArea>

          {/* Mobile Bottom Floating Checkout Button - only on small screens */}
          {totalCartItemsCount > 0 && activeMobileTab === "catalog" && (
            <div className="md:hidden p-2 bg-slate-900 text-white flex items-center justify-between shadow-lg shrink-0">
              <div className="flex items-center gap-2 pl-2">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-medium">{totalCartItemsCount} items</span>
                <span className="text-xs font-bold text-emerald-400">OMR {total.toFixed(3)}</span>
              </div>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-7 px-3 font-semibold"
                onClick={() => setActiveMobileTab("cart")}
              >
                Proceed to Pay <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          )}
        </div>

        {/* ── Right Panel: Order Summary ── */}
        <div
          className={`w-full md:w-72 lg:w-80 xl:w-88 flex flex-col bg-white rounded-xl border shadow-sm overflow-hidden shrink-0 ${
            activeMobileTab === "catalog" ? "hidden md:flex" : "flex"
          }`}
        >
          {/* ── 1. Customer Header ── */}
          <div className="p-3 border-b bg-slate-50 space-y-2 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-xs text-gray-800">
                <ShoppingCart className="w-3.5 h-3.5 text-blue-600" />
                <span>Order Summary</span>
              </div>
              {totalCartItemsCount > 0 && (
                <Badge className="text-[10px] px-1.5 py-0 bg-blue-100 text-blue-800 border-0">
                  {totalCartItemsCount} items
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-gray-400 shrink-0" />
              <select
                className="flex-1 border rounded-md bg-white text-xs px-2 py-1 font-medium text-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                value={selectedCustomerId}
                onChange={(e) => {
                  setSelectedCustomerId(e.target.value);
                  if (e.target.value && e.target.value !== "dealer") {
                    setWalkInName("");
                    setWalkInPhone("");
                  }
                }}
              >
                <option value="">Walk-in Customer (Retail)</option>
                <option value="dealer">Walk-in Dealer (Wholesale)</option>
                {customers?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customer_group})
                  </option>
                ))}
              </select>
            </div>

            {(selectedCustomerId === "" || selectedCustomerId === "dealer") && (
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  placeholder={selectedCustomerId === "dealer" ? "Dealer Name" : "Customer Name"}
                  className="text-xs h-7 bg-white"
                  value={walkInName}
                  list="walk-in-names"
                  onChange={(e) => {
                    setWalkInName(e.target.value);
                    const match = previousWalkIns?.find(
                      (w) =>
                        w.name === e.target.value &&
                        w.type === (selectedCustomerId === "dealer" ? "dealer" : "customer")
                    );
                    if (match && match.phone) setWalkInPhone(match.phone);
                  }}
                />
                <datalist id="walk-in-names">
                  {previousWalkIns
                    ?.filter((w) => w.type === (selectedCustomerId === "dealer" ? "dealer" : "customer"))
                    .map((w, idx) => <option key={idx} value={w.name} />)}
                </datalist>
                <Input
                  placeholder="Phone (Optional)"
                  className="text-xs h-7 bg-white"
                  value={walkInPhone}
                  onChange={(e) => setWalkInPhone(e.target.value)}
                />
              </div>
            )}
          </div>

          {/* ── 2. Cart Items — scrollable, fills all available height ── */}
          <ScrollArea className="flex-1 min-h-0">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground px-4">
                <ShoppingCart className="w-10 h-10 mb-2 text-slate-200" />
                <p className="text-xs font-semibold text-gray-500">Cart is empty</p>
                <p className="text-[11px] text-gray-400 mt-0.5">Select products from the left panel</p>
              </div>
            ) : (
              <div className="p-2.5 space-y-1.5">
                {cart.map((item) => (
                  <div
                    key={item.variation_id}
                    className="bg-white border border-slate-100 rounded-lg p-2 flex items-center gap-2 shadow-2xs hover:border-slate-200 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-xs text-gray-900 truncate leading-tight" title={item.name}>
                        {item.name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">{item.sku}</div>
                      <div className="text-[11px] font-bold text-blue-700 mt-0.5">
                        OMR {item.unit_price.toFixed(3)} × {item.quantity}
                      </div>
                    </div>

                    {/* Qty Stepper */}
                    <div className="flex items-center border border-slate-200 rounded-md bg-slate-50 overflow-hidden shrink-0">
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                        onClick={() => updateQuantity(item.variation_id, item.quantity - 1)}
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-gray-800 select-none">{item.quantity}</span>
                      <button
                        type="button"
                        className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-slate-200 active:bg-slate-300 transition-colors"
                        onClick={() => updateQuantity(item.variation_id, item.quantity + 1)}
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Line total + remove */}
                    <div className="text-right shrink-0 pl-0.5">
                      <div className="font-bold text-xs text-gray-900">{item.total_price.toFixed(3)}</div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.variation_id)}
                        className="text-slate-300 hover:text-red-500 mt-0.5 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* ── 3. Footer: Totals + CTA ── */}
          <div className="p-3 border-t bg-white space-y-2.5 shrink-0">
            {/* Totals */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>Subtotal</span>
                <span className="font-medium text-gray-700">OMR {subtotal.toFixed(3)}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount</span>
                  <span className="font-semibold">− OMR {totalDiscount.toFixed(3)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-dashed">
                <span className="text-sm font-bold text-gray-800">Total</span>
                <span className="text-lg font-extrabold text-blue-700 tracking-tight">OMR {total.toFixed(3)}</span>
              </div>
            </div>

            {/* Proceed to Payment */}
            <Button
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm rounded-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              disabled={cart.length === 0 || isCheckingOut}
              onClick={() => setIsPaymentModalOpen(true)}
            >
              <CreditCard className="w-4 h-4" />
              Proceed to Payment
            </Button>

            {/* Clear cart */}
            {cart.length > 0 && (
              <button
                type="button"
                className="w-full text-[11px] text-gray-400 hover:text-red-500 transition-colors py-0.5 flex items-center justify-center gap-1"
                onClick={clearCart}
                disabled={isCheckingOut}
              >
                <Trash2 className="w-3 h-3" /> Clear all items
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════
          Payment — Single or Split Tender
      ════════════════════════════════════════ */}
      <Dialog
        open={isPaymentModalOpen}
        onOpenChange={(open) => {
          if (!open && !isCheckingOut) {
            setIsPaymentModalOpen(false);
            setSplitPayments([{ method: "Cash", amount: "", reference_code: "" }]);
          }
          if (open) {
            setSplitPayments([{ method: "Cash", amount: total.toFixed(3), reference_code: "" }]);
          }
        }}
      >
        <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0">
          {/* Dark header */}
          <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-900 to-slate-700 text-white shrink-0">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-white">Complete Payment</DialogTitle>
            </DialogHeader>
            <p className="text-xs text-slate-300 mt-0.5">Add one or more payment methods (split allowed)</p>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="bg-white/10 rounded-lg px-2 py-1.5">
                <div className="text-[10px] text-slate-400">Items</div>
                <div className="text-sm font-bold">{cart.reduce((s, i) => s + i.quantity, 0)}</div>
              </div>
              <div className="bg-white/10 rounded-lg px-2 py-1.5">
                <div className="text-[10px] text-slate-400">Order Total</div>
                <div className="text-sm font-bold">OMR {total.toFixed(3)}</div>
              </div>
              {(() => {
                const tendered = splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const remaining = total - tendered;
                const isOverpaid = tendered > total;
                return (
                  <div className={`rounded-lg px-2 py-1.5 ${
                    remaining > 0.001 ? "bg-red-500/30" : isOverpaid ? "bg-amber-500/30" : "bg-emerald-500/30"
                  }`}>
                    <div className="text-[10px] text-slate-300">
                      {remaining > 0.001 ? "Remaining" : isOverpaid ? "Change" : "Settled ✓"}
                    </div>
                    <div className={`text-sm font-bold ${
                      remaining > 0.001 ? "text-red-300" : isOverpaid ? "text-amber-300" : "text-emerald-300"
                    }`}>
                      OMR {Math.abs(remaining).toFixed(3)}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Payment lines */}
          <ScrollArea className="max-h-[55vh]">
            <div className="p-4 space-y-3 bg-slate-50">
              {splitPayments.map((entry, idx) => {
                const methodIcons: Record<string, React.ReactNode> = {
                  Cash: <Banknote className="w-4 h-4" />,
                  Card: <CreditCard className="w-4 h-4" />,
                  "Bank Transfer": <Landmark className="w-4 h-4" />,
                  Due: <Clock className="w-4 h-4" />,
                };
                const methodColors: Record<string, string> = {
                  Cash: "border-emerald-500 bg-emerald-50 text-emerald-800",
                  Card: "border-blue-500 bg-blue-50 text-blue-800",
                  "Bank Transfer": "border-indigo-500 bg-indigo-50 text-indigo-800",
                  Due: "border-amber-500 bg-amber-50 text-amber-800",
                };
                const alreadyPaid = splitPayments.slice(0, idx).reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                const remaining = Math.max(0, total - alreadyPaid);

                return (
                  <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                        {splitPayments.length > 1 ? `Payment ${idx + 1}` : "Payment Method"}
                      </span>
                      {splitPayments.length > 1 && (
                        <button
                          type="button"
                          className="text-slate-300 hover:text-red-500 transition-colors"
                          onClick={() => setSplitPayments(prev => prev.filter((_, i) => i !== idx))}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Method selector pills */}
                    <div className="grid grid-cols-4 gap-1.5">
                      {(["Cash", "Card", "Bank Transfer", "Due"] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, method: m } : p))}
                          className={`flex flex-col items-center gap-0.5 py-1.5 px-1 rounded-lg border-2 text-[10px] font-semibold transition-all ${
                            entry.method === m
                              ? methodColors[m]
                              : "border-slate-200 bg-white text-gray-500 hover:bg-slate-50"
                          }`}
                        >
                          {methodIcons[m]}
                          <span>{m === "Bank Transfer" ? "Bank" : m}</span>
                        </button>
                      ))}
                    </div>

                    {/* Amount + quick fill */}
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <div className="text-[10px] text-gray-500 mb-1 font-medium">Amount (OMR)</div>
                        <Input
                          type="number"
                          step="0.001"
                          min="0"
                          placeholder="0.000"
                          className="h-10 text-base font-bold bg-white text-center tracking-widest"
                          value={entry.amount}
                          onChange={(e) => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount: e.target.value } : p))}
                          autoFocus={idx === splitPayments.length - 1}
                        />
                      </div>
                      <div className="flex flex-col gap-1 pb-0.5">
                        <button
                          type="button"
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-semibold text-gray-600 whitespace-nowrap transition-colors"
                          onClick={() => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount: remaining.toFixed(3) } : p))}
                        >
                          Exact
                        </button>
                        <button
                          type="button"
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded font-semibold text-gray-600 whitespace-nowrap transition-colors"
                          onClick={() => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, amount: (Math.ceil(remaining / 5) * 5 || 5).toFixed(3) } : p))}
                        >
                          Rnd 5
                        </button>
                      </div>
                    </div>

                    {/* Change indicator */}
                    {(() => {
                      const amt = parseFloat(entry.amount) || 0;
                      const change = amt - remaining;
                      if (amt === 0) return null;
                      return (
                        <div className={`text-xs rounded-lg px-3 py-1.5 font-semibold flex justify-between ${
                          change > 0.001 ? "bg-amber-50 text-amber-700 border border-amber-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                        }`}>
                          <span>{change > 0.001 ? "Change to return" : "Amount received"}</span>
                          <span className="font-extrabold">{change > 0.001 ? `OMR ${change.toFixed(3)}` : `OMR ${amt.toFixed(3)}`}</span>
                        </div>
                      );
                    })()}

                    {/* Reference for Card / Bank */}
                    {(entry.method === "Card" || entry.method === "Bank Transfer") && (
                      <Input
                        placeholder={entry.method === "Card" ? "Card last 4 / approval code" : "Bank ref / transfer ID"}
                        className="h-8 text-xs bg-slate-50"
                        value={entry.reference_code}
                        onChange={(e) => setSplitPayments(prev => prev.map((p, i) => i === idx ? { ...p, reference_code: e.target.value } : p))}
                      />
                    )}

                    {/* Due credit note */}
                    {entry.method === "Due" && (
                      <div className="bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-1.5 text-[10px] text-amber-800 flex items-start gap-1.5">
                        <Clock className="w-3 h-3 mt-0.5 shrink-0 text-amber-600" />
                        <span>Recorded as credit owed by the customer</span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Add another payment line */}
              {splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) < total - 0.001 && (
                <button
                  type="button"
                  className="w-full border-2 border-dashed border-slate-300 rounded-xl py-3 text-xs font-semibold text-slate-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-1.5"
                  onClick={() => {
                    const paid = splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
                    const left = Math.max(0, total - paid);
                    setSplitPayments(prev => [...prev, { method: "Cash", amount: left.toFixed(3), reference_code: "" }]);
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Another Payment Method (Split)
                </button>
              )}
            </div>
          </ScrollArea>

          {/* Footer actions */}
          <div className="p-4 bg-white border-t flex gap-2">
            <Button
              variant="outline"
              className="flex-1 h-10 text-sm"
              onClick={() => {
                setIsPaymentModalOpen(false);
                setSplitPayments([{ method: "Cash", amount: "", reference_code: "" }]);
              }}
              disabled={isCheckingOut}
            >
              Cancel
            </Button>
            <Button
              className="flex-[2] h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2 rounded-lg active:scale-[0.98] transition-all disabled:opacity-60"
              disabled={
                cart.length === 0 ||
                isCheckingOut ||
                splitPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0) < total - 0.001
              }
              onClick={() => handleSplitPaymentComplete()}
            >
              <FileCheck className="w-4 h-4" />
              {isCheckingOut ? "Processing..." : "Confirm & Place Order"}
            </Button>
          </div>
        </DialogContent>

      {/* ════════════════════════════════════════
          Order Success Dialog
      ════════════════════════════════════════ */}
      <Dialog open={!!completedReceipt} onOpenChange={(open) => !open && setCompletedReceipt(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl gap-0">
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 px-6 pt-6 pb-5 text-white text-center">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-white text-lg font-bold">Order Placed!</DialogTitle>
            </DialogHeader>
            <p className="text-emerald-100 text-xs mt-0.5">Payment received successfully</p>
          </div>

          <div className="p-5 space-y-4 bg-white">
            <div className="bg-slate-50 rounded-xl border p-4 font-mono text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Receipt No.</span>
                <span className="font-bold text-gray-900 tracking-wide">{completedReceipt?.receipt_number}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Total Paid</span>
                <span className="font-extrabold text-blue-700 text-sm">OMR {Number(completedReceipt?.total_amount || 0).toFixed(3)}</span>
              </div>
            </div>

            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 h-9"
                onClick={() => setCompletedReceipt(null)}
              >
                New Order
              </Button>
              {completedReceipt?.id && (
                <Button
                  size="sm"
                  className="flex-1 h-9 bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => {
                    const rid = completedReceipt.id;
                    setCompletedReceipt(null);
                    navigate(`/admin/pos/receipts/${rid}`);
                  }}
                >
                  <Printer className="w-3.5 h-3.5 mr-1" /> Print Receipt
                </Button>
              )}
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
