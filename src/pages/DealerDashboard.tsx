import DirhamIcon from "@/components/DirhamIcon";
import { useAuth } from "@/context/AuthContext";
import { CartProduct, useCart } from "@/context/CartContext";
import { products as staticProducts } from "@/data/products";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useStock } from "@/modules/warehouse/presentation/hooks/useStock";
import { useWarehouses } from "@/modules/warehouse/presentation/hooks/useWarehouses";
import { useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  Filter,
  Minus,
  Package,
  Plus,
  Search,
  ShoppingCart,
  Sparkles,
  Warehouse,
  XCircle
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import DealerLayout from "./dealer/DealerLayout";

export default function DealerDashboard() {
  const { profile } = useAuth();
  const { addToCart } = useCart();
  const { data: dbProducts = [], isLoading } = useProducts();
  const { data: categoriesData = [] } = useCategories();
  const { warehouses = [] } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");

  // Fetch price lists and price list items (same as admin price-lists page)
  const { data: priceLists = [] } = useQuery({
    queryKey: ["price_lists"],
    queryFn: async () => {
      const { data } = await supabase.from("price_lists").select("*");
      return data || [];
    },
  });

  const { data: priceListItems = [] } = useQuery({
    queryKey: ["price_list_items_all"],
    queryFn: async () => {
      const { data } = await supabase.from("price_list_items").select("*");
      return data || [];
    },
  });

  // Use the same useStock hook as WarehouseDashboardPage — fetches stock_balances
  // with product_variations(*, products(*)) and warehouse_bins(*) joined
  const { balances: stockBalances = [], isLoadingBalances } = useStock(
    selectedWarehouse && selectedWarehouse !== "all" ? selectedWarehouse : undefined
  );

  // For "all warehouses", fetch without warehouse filter
  const { data: allWarehouseBalances = [] } = useQuery({
    queryKey: ["stock_balances_dealer_all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("stock_balances")
        .select("*, product_variations(*, products(*)), warehouse_bins(*)");
      if (error) {
        console.error("Error fetching all stock_balances:", error);
        return [];
      }
      return data || [];
    },
    enabled: selectedWarehouse === "all",
  });

  // The active balances list depending on selected warehouse
  const activeBalances: any[] = selectedWarehouse === "all"
    ? allWarehouseBalances
    : stockBalances;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const isApproved = profile?.is_approved ?? false;

  const allProducts: CartProduct[] = useMemo(() => {
    let productsToMap: any[] = [];

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      productsToMap = dbProducts;
    } else if (Array.isArray(activeBalances) && activeBalances.length > 0) {
      // Derive unique products from the stock balances (same join structure as WarehouseDashboardPage)
      const prodMap = new Map<string, any>();
      activeBalances.forEach((sb: any) => {
        // product_variations may be a single object (as returned by Supabase) or array
        const sbVar = Array.isArray(sb.product_variations)
          ? sb.product_variations[0]
          : sb.product_variations;
        const sbProd = sbVar?.products
          ? (Array.isArray(sbVar.products) ? sbVar.products[0] : sbVar.products)
          : null;
        if (sbProd && sbProd.id && !prodMap.has(String(sbProd.id))) {
          prodMap.set(String(sbProd.id), {
            ...sbProd,
            product_variations: sbVar ? [sbVar] : [],
          });
        }
      });
      productsToMap = Array.from(prodMap.values());
    } else {
      productsToMap = staticProducts;
    }

    // --- Build stock lookup maps ---
    const stockByProductId = new Map<string, number>();
    const stockByVariationId = new Map<string, number>();
    activeBalances.forEach((sb: any) => {
      const sbVar = Array.isArray(sb.product_variations)
        ? sb.product_variations[0]
        : sb.product_variations;
      const sbProd = sbVar?.products
        ? (Array.isArray(sbVar.products) ? sbVar.products[0] : sbVar.products)
        : null;

      const qty = Number(sb.quantity) || 0;

      // Index by product_id (from variation foreign key or joined product object)
      const productId = String(sbVar?.product_id || sbProd?.id || "");
      if (productId) {
        stockByProductId.set(productId, (stockByProductId.get(productId) || 0) + qty);
      }

      // Index by variation id (sb.variation_id is a direct column on stock_balances)
      const variationId = String(sb.variation_id || sbVar?.id || "");
      if (variationId) {
        stockByVariationId.set(variationId, (stockByVariationId.get(variationId) || 0) + qty);
      }
    });

    // --- Identify Price Lists ---
    const dealerList = priceLists.find((l: any) =>
      l.name?.toLowerCase().includes("dealer") || l.name?.toLowerCase().includes("wholesale")
    );
    const retailList = priceLists.find((l: any) =>
      l.name?.toLowerCase().includes("retail")
    );

    return productsToMap.map((p: any) => {
      // Resolve Brand Name
      let resolvedBrand = "Generic";
      if (typeof p.brands === "object" && p.brands?.name) {
        resolvedBrand = p.brands.name;
      } else if (typeof p.brand === "object" && p.brand?.name) {
        resolvedBrand = p.brand.name;
      } else if (typeof p.brand === "string" && p.brand.trim()) {
        resolvedBrand = p.brand;
      } else if (p.brand_name) {
        resolvedBrand = p.brand_name;
      }

      // Resolve Category Name
      let resolvedCategory = "General";
      if (typeof p.categories === "object" && p.categories?.name) {
        resolvedCategory = p.categories.name;
      } else if (typeof p.category === "object" && p.category?.name) {
        resolvedCategory = p.category.name;
      } else if (typeof p.category === "string" && p.category.trim()) {
        resolvedCategory = p.category;
      } else if (p.category_name) {
        resolvedCategory = p.category_name;
      } else if (p.category_id && Array.isArray(categoriesData)) {
        const foundCat = categoriesData.find((c: any) => c.id === p.category_id);
        if (foundCat?.name) resolvedCategory = foundCat.name;
      }

      // Variation IDs for price_list_items matching
      const variationIds = Array.isArray(p.product_variations)
        ? p.product_variations.map((v: any) => String(v.id))
        : [];

      // Resolve dealer / retail prices from price lists
      let retailFromList: number | undefined;
      let dealerFromList: number | undefined;

      if (Array.isArray(priceListItems) && priceListItems.length > 0) {
        if (dealerList?.id) {
          const item = priceListItems.find(
            (pli: any) =>
              pli.price_list_id === dealerList.id &&
              (variationIds.includes(String(pli.variation_id)) ||
                String(pli.variation_id) === String(p.id))
          );
          if (item && item.price != null) dealerFromList = Number(item.price);
        }

        if (retailList?.id) {
          const item = priceListItems.find(
            (pli: any) =>
              pli.price_list_id === retailList.id &&
              (variationIds.includes(String(pli.variation_id)) ||
                String(pli.variation_id) === String(p.id))
          );
          if (item && item.price != null) retailFromList = Number(item.price);
        }

        if (dealerFromList === undefined) {
          const anyItem = priceListItems.find(
            (pli: any) =>
              (variationIds.includes(String(pli.variation_id)) ||
                String(pli.variation_id) === String(p.id)) &&
              pli.price != null
          );
          if (anyItem) dealerFromList = Number(anyItem.price);
        }
      }

      const basePrice = retailFromList ??
        Number(p.price ?? p.original_price ?? p.unit_price ?? p.selling_price ?? 0);
      const dealerPrice = dealerFromList ??
        (p.dealer_price != null
          ? Number(p.dealer_price)
          : basePrice > 0 ? Math.round(basePrice * 0.8) : undefined);

      // --- Calculate exact real stock from activeBalances (matching Admin Warehouse Dashboard) ---
      let realStock: number | undefined;

      if (Array.isArray(activeBalances) && activeBalances.length > 0) {
        // Find all stock balance entries matching this product by ID, Variation ID, or Name
        const matchingBalances = activeBalances.filter((sb: any) => {
          const sbVar = Array.isArray(sb.product_variations)
            ? sb.product_variations[0]
            : sb.product_variations;
          const sbProd = sbVar?.products
            ? (Array.isArray(sbVar.products) ? sbVar.products[0] : sbVar.products)
            : null;

          const sbProductId = String(sb.product_id || sbVar?.product_id || sbProd?.id || "");
          const sbVariationId = String(sb.variation_id || sbVar?.id || "");
          const sbProductName = String(sbProd?.name || "").toLowerCase().trim();
          const pName = String(p.name || p.title || "").toLowerCase().trim();

          const matchesId = sbProductId && sbProductId === String(p.id);
          const matchesVar = sbVariationId && variationIds.includes(sbVariationId);
          const matchesName = sbProductName && pName && (sbProductName === pName || pName.includes(sbProductName) || sbProductName.includes(pName));

          return matchesId || matchesVar || matchesName;
        });

        if (matchingBalances.length > 0) {
          realStock = matchingBalances.reduce((sum: number, sb: any) => sum + (Number(sb.quantity) || 0), 0);
        } else {
          realStock = 0;
        }
      }

      // Sum variation stock from p.product_variations as fallback if no activeBalances exist
      const productVariationsStock = Array.isArray(p.product_variations) && p.product_variations.length > 0
        ? p.product_variations.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
        : undefined;

      const finalStock = realStock !== undefined
        ? realStock
        : (productVariationsStock ?? (p.stock != null ? Number(p.stock) : 100));

      return {
        id: String(p.id),
        name: String(p.name || p.title || "Part Item"),
        brand: resolvedBrand,
        price: basePrice,
        originalPrice: p.original_price ? Number(p.original_price) : undefined,
        dealerPrice,
        dealerOriginalPrice: p.dealer_original_price ? Number(p.dealer_original_price) : undefined,
        category: resolvedCategory as any,
        image: p.image_url || p.image || "/placeholder.svg",
        images: p.images || [p.image_url || p.image || "/placeholder.svg"],
        sizes: Array.isArray(p.sizes) ? p.sizes : [40, 41, 42, 43, 44],
        colors: Array.isArray(p.colors) ? p.colors : ["Standard"],
        description: p.description || "",
        rating: Number(p.rating) || 5,
        reviews: Number(p.reviews) || 10,
        stock: finalStock,
      };
    });
  }, [dbProducts, categoriesData, priceLists, priceListItems, activeBalances]);

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [id]: updated };
    });
  };

  const handleAddToCart = (product: CartProduct) => {
    const qty = quantities[product.id] || 1;
    const defaultSize = product.sizes?.[0] || 42;
    const defaultColor = product.colors?.[0] || "Standard";

    addToCart(product, defaultSize, defaultColor, qty, product.stock);
    toast.success(`Added ${qty}x ${product.name} to cart!`);
  };

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    const term = (searchTerm || "").toLowerCase().trim();

    console.log("All products", list);

    return list.filter((p: CartProduct) => {
      const pName = String(p.name || "").toLowerCase();
      const pBrand = String(p.brand || "").toLowerCase();
      const pCat = String(p.category || "").toLowerCase();

      const matchesSearch =
        !term ||
        pName.includes(term) ||
        pBrand.includes(term) ||
        pCat.includes(term);

      const matchesCat =
        selectedCategory === "all" ||
        !selectedCategory ||
        pCat === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [allProducts, searchTerm, selectedCategory]);

  return (
    <DealerLayout>
      <div className="space-y-6">
        {/* Top Summary Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-primary/90 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-sm">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                Wholesale Portal
              </div>
              <h2 className="font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-wider">
                Wholesale Product Catalog
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
                Browse our complete catalog of genuine parts. Place bulk orders directly with wholesale dealer rates.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 shrink-0">
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">
                  Pricing Tier
                </p>
                <p className="text-sm font-extrabold text-white">
                  {isApproved ? "Wholesale Dealer Rate" : "Standard Rate (Pending)"}
                </p>
              </div>
              <div className={`w-3 h-3 rounded-full ${isApproved ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by part name, brand, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm font-body focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Warehouse Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-auto">
              <Warehouse className="w-4 h-4 text-primary shrink-0" />
              <select
                value={selectedWarehouse}
                onChange={(e) => setSelectedWarehouse(e.target.value)}
                className="bg-transparent text-sm font-body font-bold text-gray-800 focus:outline-none cursor-pointer w-full"
              >
                <option value="all">All Warehouses</option>
                {Array.isArray(warehouses) &&
                  warehouses.map((wh: any) => (
                    <option key={wh.id} value={wh.id}>
                      {wh.name} {wh.code ? `(${wh.code})` : ""}
                    </option>
                  ))}
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-2 rounded-xl w-full sm:w-auto">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent text-sm font-body font-semibold text-gray-700 focus:outline-none cursor-pointer w-full"
              >
                <option value="all">All Categories</option>
                {categoriesData.map((cat: any) => (
                  <option key={cat.id || cat.name} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-gray-500 font-medium whitespace-nowrap hidden sm:block">
              <strong className="text-gray-900">{filteredProducts.length}</strong> Products
            </p>
          </div>
        </div>

        {/* Products Table & Warehouse Selection Prompt */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {!selectedWarehouse ? (
            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-10 text-center text-amber-900 shadow-sm m-4">
              <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 border border-amber-200">
                <Warehouse className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Select a Warehouse to View Live Stock
              </h3>
              <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
                Please select a warehouse from the filter above (or select <strong>All Warehouses</strong>) to view exact stock quantities and place orders.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
                <button
                  onClick={() => setSelectedWarehouse("all")}
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
                >
                  Select All Warehouses
                </button>
                {Array.isArray(warehouses) &&
                  warehouses.map((wh: any) => (
                    <button
                      key={wh.id}
                      onClick={() => setSelectedWarehouse(wh.id)}
                      className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
                    >
                      {wh.name}
                    </button>
                  ))}
              </div>
            </div>
          ) : isLoading || isLoadingBalances ? (
            <div className="p-12 text-center text-gray-500 font-medium">
              Loading wholesale products &amp; stock...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h4 className="font-bold text-gray-900 text-lg mb-1">
                No Products Found
              </h4>
              <p className="text-sm text-gray-500">
                Try adjusting your search criteria or category filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm font-body">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
                  <tr>
                    <th className="py-4 px-6">Product</th>
                    <th className="py-4 px-4">Brand / Category</th>
                    <th className="py-4 px-4">Price</th>
                    <th className="py-4 px-4">Stock Status</th>
                    <th className="py-4 px-4">Quantity</th>
                    <th className="py-4 px-6 text-right">Order Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.map((product: CartProduct) => {
                    const qty = quantities[product.id] || 1;
                    const wholesalePrice = isApproved
                      ? product.dealerPrice || Math.round(product.price * 0.8)
                      : product.price;

                    const hasDealerDiscount = isApproved && wholesalePrice < product.price;
                    const stockVal = product.stock ?? 0;
                    const inStock = stockVal > 0;

                    console.log("product",product)

                    return (
                      <tr
                        key={product.id}
                        className="hover:bg-gray-50/70 transition-colors group"
                      >
                        {/* Product info */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <img
                              src={product.image || "/placeholder.svg"}
                              alt={product.name}
                              className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                            />
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors">
                                {product.name}
                              </h4>
                              <p className="text-xs text-gray-400">
                                ID: {product.id}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Brand / Category */}
                        <td className="py-4 px-4">
                          <div className="space-y-1">
                            <span className="inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-primary/20">
                              {product.brand || "Generic"}
                            </span>
                            <p className="text-xs text-gray-500 font-medium capitalize">
                              {product.category || "General"}
                            </p>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1 font-extrabold text-base text-gray-900">
                              <DirhamIcon size={16} />
                              <span>{wholesalePrice.toLocaleString()}</span>
                            </div>
                            {hasDealerDiscount ? (
                              <div className="flex items-center gap-2">
                                <span className="line-through text-xs text-gray-400 flex items-center gap-0.5">
                                  <DirhamIcon size={11} />
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                                  Wholesale Rate
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Standard Rate</span>
                            )}
                          </div>
                        </td>

                        {/* Stock */}
                        <td className="py-4 px-4">
                          {inStock ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>In Stock ({stockVal})</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Out of Stock (0)</span>
                            </span>
                          )}
                        </td>

                        {/* Quantity Counter */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-max border border-gray-200">
                            <button
                              onClick={() => handleQuantityChange(product.id, -1)}
                              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="w-8 text-center font-bold text-sm text-gray-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleQuantityChange(product.id, 1)}
                              className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* Add to Cart */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleAddToCart(product)}
                            disabled={!inStock}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            <span>Add to Order</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DealerLayout>
  );
}
