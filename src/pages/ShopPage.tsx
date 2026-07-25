import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { useActiveProducts } from "@/hooks/useDatabase";
import { useActiveCategories } from "@/hooks/useCategories";
import { useLanguage } from "@/context/LanguageContext";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const ShopPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: dbProducts = [], isLoading } = useActiveProducts();
  const { data: dbCategories = [] } = useActiveCategories();
  const { t } = useLanguage();
  const categoryFilter = searchParams.get("category") || "";
  const searchParam = searchParams.get("search") || "";
  const [search, setSearch] = useState(searchParam);

  useEffect(() => {
    if (searchParam) setSearch(searchParam);
  }, [searchParam]);

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [showFilters, setShowFilters] = useState(false);

  const products = useMemo(() => {
    return (
      dbProducts.map((p: any) => {
        const imageUrl = p.image_url || p.image || "/placeholder.svg";
        return {
          id: p.id,
          name: p.name,
          brand: p.brand || p.brands?.name || "",
          price: Number(p.price) || 0,
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          dealerPrice: p.dealer_price ? Number(p.dealer_price) : undefined,
          dealerOriginalPrice: p.dealer_original_price
            ? Number(p.dealer_original_price)
            : undefined,
          category: (p.category?.slug || p.categories?.slug || p.category) as any,
          image: imageUrl,
          images: p.image_url ? [p.image_url] : (p.images || [imageUrl]),
          stock: p.stock || 0,
          sizes: p.sizes || [],
          colors: p.colors || [],
          description: p.description || "",
          rating: Number(p.rating) || 4.5,
          reviews: p.reviews || 0,
          isTrending: p.is_trending || false,
          isNew: p.is_new || false,
          isOffer: (p as any).is_offer || false,
        };
      }) || []
    );
  }, [dbProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;

      if (search) {
        const searchTerms = search.toLowerCase().split(/\s+/).filter(Boolean);
        const nameAndBrand = `${p.name} ${p.brand}`.toLowerCase();
        const matchesAll = searchTerms.every((term) =>
          nameAndBrand.includes(term),
        );
        if (!matchesAll) return false;
      }
      const maxPrice = priceRange[1] > 0 ? priceRange[1] : Infinity;
      if (p.price < priceRange[0] || p.price > maxPrice) return false;
      return true;
    });
  }, [products, categoryFilter, search, priceRange]);

  const setCategory = (cat: string) => {
    if (cat) setSearchParams({ category: cat });
    else setSearchParams({});
    setShowFilters(false);
  };

  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [categoryFilter, search, priceRange]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filtered.length) {
          setVisibleCount((prev) => prev + 12);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filtered.length]);

  const activeCategoryName = dbCategories.find(
    (c) => c.slug === categoryFilter,
  )?.name;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-16 lg:pt-18">
        <div className="bg-[#111] relative overflow-hidden py-16 lg:py-20">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80"
              alt="Background"
              className="w-full h-full object-cover opacity-90"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#111] via-[#111]/60 to-transparent"></div>
          </div>
          <div className="container mx-auto px-4 mt-2 lg:px-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <span className="text-neon font-body text-sm font-bold tracking-[0.3em] uppercase">
                {t("shop.collection")}
              </span>
              <h1 className="heading-display text-3xl md:text-4xl lg:text-3xl font-extrabold mt-3 text-white tracking-tight">
                {activeCategoryName ||
                  (categoryFilter
                    ? categoryFilter.charAt(0).toUpperCase() +
                      categoryFilter.slice(1)
                    : t("shop.all_products"))}
              </h1>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-10">
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1 group">
              <Search className="absolute start-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-neon transition-colors" />
              <input
                type="text"
                placeholder={t("shop.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full ps-14 pe-6 py-4 bg-white border border-gray-100 font-body text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-neon/30 focus:border-neon transition-all rounded-xl shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-6 py-4 border border-gray-200 bg-white font-bold text-sm text-gray-900 hover:border-neon hover:text-neon transition-colors md:hidden rounded-lg shadow-sm"
            >
              <SlidersHorizontal className="w-5 h-5" /> {t("shop.filters")}
            </button>
          </div>

          <div className="flex gap-8">
            <aside
              className={`${showFilters ? "block" : "hidden"} md:block w-full md:w-72 shrink-0 sticky top-28 self-start`}
            >
              <div className="bg-white border border-gray-100 p-6 rounded-[1rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8 h-[calc(100vh-8rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div>
                  <h3 className="font-heading font-extrabold uppercase tracking-widest text-[13px] mb-5 text-gray-900 border-b border-gray-100 pb-3">
                    {t("shop.categories")}
                  </h3>
                  <div className="space-y-1.5">
                    <button
                      onClick={() => setCategory("")}
                      className={`flex items-center w-full text-left font-body text-sm py-2.5 px-4 rounded-lg transition-all ${!categoryFilter ? "bg-gray-600 text-white font-bold shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"}`}
                    >
                      <span className="w-5"></span>
                      {t("shop.all_products")}
                    </button>
                    {dbCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setCategory(cat.slug)}
                        className={`flex items-center w-full text-left font-body text-sm py-2.5 px-4 rounded-lg transition-all ${categoryFilter === cat.slug ? "bg-gray-600 text-white font-bold shadow-md" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium"}`}
                      >
                        {cat.image_url ? (
                          <img
                            src={cat.image_url}
                            alt=""
                            className="w-5 h-5 inline-block mr-2.5 rounded object-cover shadow-sm"
                          />
                        ) : (
                          <span className="w-7"></span>
                        )}
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-heading font-extrabold uppercase tracking-widest text-[13px] mb-5 text-gray-900 border-b border-gray-100 pb-3">
                    {t("shop.price")}
                  </h3>
                  <div className="flex gap-3 items-center font-body text-sm">
                    <input
                      type="number"
                      value={priceRange[0] || ""}
                      onChange={(e) =>
                        setPriceRange([+e.target.value, priceRange[1]])
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neon/30 focus:border-neon rounded-xl transition-all font-medium"
                      placeholder="Min"
                    />
                    <span className="text-gray-300 font-bold">–</span>
                    <input
                      type="number"
                      value={priceRange[1] || ""}
                      onChange={(e) =>
                        setPriceRange([priceRange[0], +e.target.value])
                      }
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent text-sm text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-neon/30 focus:border-neon rounded-xl transition-all font-medium"
                      placeholder="Max"
                    />
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <p className="font-body text-sm text-muted-foreground mb-6">
                {filtered.length} {t("shop.products_found")}
              </p>
              {isLoading ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-10 h-10 animate-spin text-neon" />
                </div>
              ) : filtered.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-4">
                    {filtered.slice(0, visibleCount).map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>

                  {visibleCount < filtered.length && (
                    <div
                      ref={loadMoreRef}
                      className="mt-12 flex justify-center items-center gap-2 text-primary py-4"
                    >
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-body text-sm font-medium tracking-wide">
                        Loading more products...
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-20">
                  <p className="font-heading text-2xl uppercase font-bold mb-2 text-foreground">
                    {t("shop.no_results")}
                  </p>
                  <p className="font-body text-sm text-muted-foreground">
                    {t("shop.adjust_filters")}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ShopPage;
