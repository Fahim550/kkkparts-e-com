import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Search,
  X,
  Package,
  ShoppingCart,
  Plus,
  ChevronRight,
  AlertTriangle,
  FileText,
  Users,
  ExternalLink,
  Receipt,
  Layers,
  Sparkles,
} from "lucide-react";
import { useProducts, useOrders } from "@/hooks/useDatabase";
import { useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import { Badge } from "@/components/ui/badge";

export default function AdminGlobalSearch() {
  const navigate = useNavigate();
  const { data: products = [], isLoading: isLoadingProducts } = useProducts();
  const { data: allOrders = [] } = useOrders();
  const { customers = [] } = useCustomers();

  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global hotkey: Press '/' or 'Ctrl+K' / 'Cmd+K' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === "input" || activeTag === "textarea" || activeTag === "select") {
        if (e.key === "Escape" && document.activeElement === inputRef.current) {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        return;
      }

      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter products by query
  const matchingProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    return products
      .map((p: any) => {
        const varStock = (p.product_variations || []).reduce((varSum: number, pv: any) => {
          return (
            varSum +
            (pv.stock_balances || []).reduce(
              (balSum: number, sb: any) =>
                balSum + Number(sb.quantity ?? sb.stock_level ?? 0),
              0
            )
          );
        }, 0);
        const totalStock = varStock > 0 ? varStock : Number(p.stock || 0);

        const matchScore =
          (p.name?.toLowerCase().includes(q) ? 10 : 0) +
          (p.item_code?.toLowerCase().includes(q) ? 8 : 0) +
          (p.sku?.toLowerCase().includes(q) ? 7 : 0) +
          (p.categories?.name?.toLowerCase().includes(q) ? 4 : 0) +
          (p.brands?.name?.toLowerCase().includes(q) ? 4 : 0);

        return {
          ...p,
          totalStock,
          matchScore,
        };
      })
      .filter((p: any) => p.matchScore > 0)
      .sort((a: any, b: any) => b.matchScore - a.matchScore)
      .slice(0, 7);
  }, [products, query]);

  // Filter orders by query (e.g. ORD-1234 or customer name)
  const matchingOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return allOrders
      .filter((o: any) => {
        return (
          o.order_number?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.status?.toLowerCase().includes(q)
        );
      })
      .slice(0, 3);
  }, [allOrders, query]);

  // Filter customers by query
  const matchingCustomers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return [];

    return customers
      .filter((c: any) => {
        return (
          c.name?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q) ||
          c.customer_group?.toLowerCase().includes(q)
        );
      })
      .slice(0, 3);
  }, [customers, query]);

  // Total selectable items
  const totalItems = matchingProducts.length + matchingCustomers.length + matchingOrders.length;

  const handleSelectProduct = (product: any) => {
    setIsOpen(false);
    navigate(`/admin/products?search=${encodeURIComponent(product.name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (totalItems > 0 ? totalItems : 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + totalItems) % (totalItems > 0 ? totalItems : 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (totalItems > 0 && selectedIndex < matchingProducts.length) {
        handleSelectProduct(matchingProducts[selectedIndex]);
      } else if (query.trim()) {
        setIsOpen(false);
        navigate(`/admin/products?search=${encodeURIComponent(query.trim())}`);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-72 md:w-96 transition-all duration-200">
      {/* Search Input Bar */}
      <div className="relative flex items-center">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(0);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search products (e.g. HUB BEARING), orders... (/)"
          className="w-full pl-10 pr-16 py-2 bg-white/80 hover:bg-white focus:bg-white text-sm text-gray-800 placeholder-gray-400 border border-gray-300 focus:border-blue-500 rounded-full shadow-xs focus:ring-2 focus:ring-blue-100 outline-none transition"
        />

        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {query ? (
            <button
              onClick={() => {
                setQuery("");
                setIsOpen(false);
                inputRef.current?.focus();
              }}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-semibold text-gray-400 bg-gray-100 border border-gray-200 rounded">
              /
            </kbd>
          )}
        </div>
      </div>

      {/* Dropdown Results Popover */}
      {isOpen && query.trim().length > 0 && (
        <div className="absolute left-0 top-full mt-2 w-full min-w-[340px] md:min-w-[440px] max-h-[80vh] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50 flex flex-col font-sans animate-in fade-in-50 zoom-in-95">
          {/* Search Header Info */}
          <div className="px-4 py-2.5 bg-gray-50/80 border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span>
                Search results for <strong className="text-gray-900">"{query.trim()}"</strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-400">
              {matchingProducts.length} product{matchingProducts.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[420px] divide-y divide-gray-100 sidebar-scroll">
            {/* 1. Products Section */}
            {matchingProducts.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase flex items-center justify-between">
                  <span>Products</span>
                  <Link
                    to={`/admin/products?search=${encodeURIComponent(query.trim())}`}
                    onClick={() => setIsOpen(false)}
                    className="text-blue-600 hover:underline normal-case font-normal flex items-center gap-0.5"
                  >
                    View catalog <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-1 mt-1">
                  {matchingProducts.map((product: any, idx: number) => {
                    const isSelected = selectedIndex === idx;
                    const isLowStock = product.totalStock <= 5;
                    const sellPrice = Number(product.price || 0);

                    return (
                      <div
                        key={product.id}
                        className={`group flex items-center justify-between p-2 rounded-lg transition-all cursor-pointer ${
                          isSelected ? "bg-blue-50/80 border border-blue-200" : "hover:bg-gray-50 border border-transparent"
                        }`}
                        onClick={() => handleSelectProduct(product)}
                      >
                        {/* Product Info */}
                        <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                          <div className="w-10 h-10 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                            {product.image_url ? (
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                                {product.name}
                              </span>
                              {isLowStock ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                                  {product.totalStock <= 0 ? "Out of Stock" : `Low: ${product.totalStock}`}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
                                  Qty: {product.totalStock}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="font-mono text-[11px] text-gray-600">
                                {product.item_code || product.sku || "No SKU"}
                              </span>
                              {product.categories?.name && (
                                <>
                                  <span>•</span>
                                  <span className="truncate max-w-[110px]">{product.categories.name}</span>
                                </>
                              )}
                              <span>•</span>
                              <span className="font-bold text-gray-900 font-mono">
                                OMR {sellPrice.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Direct 1-Click Action Buttons */}
                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Link
                            to={`/admin/sales/new?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 rounded text-xs font-semibold border border-red-200 transition"
                            title="Create New Sale with this product"
                          >
                            <Plus className="w-3 h-3" /> Sale
                          </Link>
                          <Link
                            to={`/admin/purchases/new?product_id=${product.id}&product_name=${encodeURIComponent(product.name)}&qty=10`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-semibold border border-blue-200 transition"
                            title="Create New Purchase Order to restock this product"
                          >
                            <ShoppingCart className="w-3 h-3" /> Purchase
                          </Link>
                          <Link
                            to={`/admin/reports/inventory?search=${encodeURIComponent(product.name)}`}
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition"
                            title="View stock valuation & warehouse details"
                          >
                            <Layers className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Customers Section */}
            {matchingCustomers.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Parties & Customers
                </div>
                <div className="space-y-1 mt-1">
                  {matchingCustomers.map((cust: any) => (
                    <Link
                      key={cust.id}
                      to={`/admin/receivable-parties`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition border border-transparent text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-blue-500" />
                        <div>
                          <span className="font-semibold text-gray-800">{cust.name}</span>
                          {cust.phone && <span className="text-gray-400 ml-2 font-mono">{cust.phone}</span>}
                        </div>
                      </div>
                      <span className="text-gray-400 flex items-center gap-1">
                        {cust.customer_group || "Customer"} <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* 3. Orders Section */}
            {matchingOrders.length > 0 && (
              <div className="p-2">
                <div className="px-2 py-1 text-[11px] font-bold tracking-wider text-gray-400 uppercase">
                  Orders & Invoices
                </div>
                <div className="space-y-1 mt-1">
                  {matchingOrders.map((ord: any) => (
                    <Link
                      key={ord.id}
                      to={`/admin/orders/${ord.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition border border-transparent text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <Receipt className="w-4 h-4 text-emerald-500" />
                        <div>
                          <span className="font-mono font-semibold text-gray-800">{ord.order_number || ord.id.slice(0, 8)}</span>
                          <span className="text-gray-400 ml-2">OMR {Number(ord.total || 0).toFixed(3)}</span>
                        </div>
                      </div>
                      <span className="text-blue-600 flex items-center gap-0.5">
                        View <ChevronRight className="w-3 h-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {matchingProducts.length === 0 &&
              matchingCustomers.length === 0 &&
              matchingOrders.length === 0 && (
                <div className="p-8 text-center">
                  <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-700">No products or transactions found</p>
                  <p className="text-xs text-gray-400 mt-1">
                    No items matched "{query.trim()}". Check spelling or search by item code.
                  </p>
                  <div className="flex items-center justify-center gap-2 mt-4">
                    <Link
                      to="/admin/products"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-semibold px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shadow-xs"
                    >
                      Open Products Manager
                    </Link>
                    <Link
                      to="/admin/purchases/new"
                      onClick={() => setIsOpen(false)}
                      className="text-xs font-semibold px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition"
                    >
                      + Create Purchase
                    </Link>
                  </div>
                </div>
              )}
          </div>

          {/* Footer Quick Links */}
          <div className="p-2.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <Link
              to={`/admin/products?search=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="text-blue-600 font-semibold hover:underline flex items-center gap-1"
            >
              Search all products for "{query.trim()}" <ChevronRight className="w-3 h-3" />
            </Link>
            <Link
              to={`/admin/reports/inventory?search=${encodeURIComponent(query.trim())}`}
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-800 hover:underline flex items-center gap-1"
            >
              <Layers className="w-3 h-3" /> View in Inventory Report
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
