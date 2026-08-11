import { useAuth } from "@/context/AuthContext";
import { CartProduct } from "@/context/CartContext";
import { products as staticProducts } from "@/data/products";
import { useCategories } from "@/hooks/useCategories";
import { useProducts } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useStock } from "@/modules/warehouse/presentation/hooks/useStock";
import { useWarehouses } from "@/modules/warehouse/presentation/hooks/useWarehouses";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export function useDealerProducts(
  selectedWarehouse: string,
  searchTerm: string,
  selectedCategory: string
) {
  const { profile } = useAuth();
  const { data: dbProducts = [], isLoading: isLoadingProducts } = useProducts();
  const { data: categoriesData = [] } = useCategories();
  const { warehouses = [] } = useWarehouses();

  const isApproved = profile?.is_approved ?? false;

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
  const activeBalances: any[] =
    selectedWarehouse === "all" ? allWarehouseBalances : stockBalances;

  const allProducts: CartProduct[] = useMemo(() => {
    let productsToMap: any[] = [];

    if (Array.isArray(dbProducts) && dbProducts.length > 0) {
      productsToMap = dbProducts;
    } else if (Array.isArray(activeBalances) && activeBalances.length > 0) {
      // Derive unique products from the stock balances
      const prodMap = new Map<string, any>();
      activeBalances.forEach((sb: any) => {
        const sbVar = Array.isArray(sb.product_variations)
          ? sb.product_variations[0]
          : sb.product_variations;
        const sbProd = sbVar?.products
          ? Array.isArray(sbVar.products)
            ? sbVar.products[0]
            : sbVar.products
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

    // Identify Price Lists
    const dealerList = priceLists.find(
      (l: any) =>
        l.name?.toLowerCase().includes("dealer") || l.name?.toLowerCase().includes("wholesale")
    );
    const retailList = priceLists.find((l: any) => l.name?.toLowerCase().includes("retail"));

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

      const basePrice =
        retailFromList ??
        Number(p.price ?? p.original_price ?? p.unit_price ?? p.selling_price ?? 0);
      const dealerPrice =
        dealerFromList ??
        (p.dealer_price != null
          ? Number(p.dealer_price)
          : basePrice > 0
          ? Math.round(basePrice * 0.8)
          : undefined);

      // Calculate exact real stock from activeBalances
      let realStock: number | undefined;

      if (Array.isArray(activeBalances) && activeBalances.length > 0) {
        const matchingBalances = activeBalances.filter((sb: any) => {
          const sbVar = Array.isArray(sb.product_variations)
            ? sb.product_variations[0]
            : sb.product_variations;
          const sbProd = sbVar?.products
            ? Array.isArray(sbVar.products)
              ? sbVar.products[0]
              : sbVar.products
            : null;

          const sbProductId = String(sb.product_id || sbVar?.product_id || sbProd?.id || "");
          const sbVariationId = String(sb.variation_id || sbVar?.id || "");
          const sbProductName = String(sbProd?.name || "").toLowerCase().trim();
          const pName = String(p.name || p.title || "").toLowerCase().trim();

          const matchesId = sbProductId && sbProductId === String(p.id);
          const matchesVar = sbVariationId && variationIds.includes(sbVariationId);
          const matchesName =
            sbProductName &&
            pName &&
            (sbProductName === pName ||
              pName.includes(sbProductName) ||
              sbProductName.includes(pName));

          return matchesId || matchesVar || matchesName;
        });

        if (matchingBalances.length > 0) {
          realStock = matchingBalances.reduce(
            (sum: number, sb: any) => sum + (Number(sb.quantity) || 0),
            0
          );
        } else {
          realStock = 0;
        }
      }

      // Sum variation stock from p.product_variations as fallback
      const productVariationsStock =
        Array.isArray(p.product_variations) && p.product_variations.length > 0
          ? p.product_variations.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
          : undefined;

      const finalStock =
        realStock !== undefined
          ? realStock
          : productVariationsStock ?? (p.stock != null ? Number(p.stock) : 100);

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

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(allProducts) ? allProducts : [];
    const term = (searchTerm || "").toLowerCase().trim();

    return list.filter((p: CartProduct) => {
      const pName = String(p.name || "").toLowerCase();
      const pBrand = String(p.brand || "").toLowerCase();
      const pCat = String(p.category || "").toLowerCase();

      const matchesSearch =
        !term || pName.includes(term) || pBrand.includes(term) || pCat.includes(term);

      const matchesCat =
        selectedCategory === "all" || !selectedCategory || pCat === selectedCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [allProducts, searchTerm, selectedCategory]);

  return {
    warehouses,
    categoriesData,
    isLoading: isLoadingProducts || isLoadingBalances,
    filteredProducts,
    isApproved,
    profile,
  };
}
