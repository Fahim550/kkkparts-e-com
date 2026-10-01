import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, SlidersHorizontal, Loader2, Menu, LayoutGrid, ShieldCheck, ArrowRightLeft } from "lucide-react";
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
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

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
    let result = products.filter((p) => {
      if (categoryFilter && p.category !== categoryFilter) return false;
      
      if (filterType === 'new' && !p.isNew) return false;
      if (filterType === 'featured' && !p.isTrending) return false;

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

    return result.sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      // Default to newest (can sort by id descending)
      return b.id - a.id;
    });
  }, [products, categoryFilter, search, priceRange, filterType, sortBy]);

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
      <div className="pt-24 lg:pt-28">
        <div className="pt-6 pb-6 bg-gray-50/50 border-b border-gray-100">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 font-body">
                  <Link to="/" className="flex items-center gap-1 hover:text-[#5D3A5D] transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    Home
                  </Link>
                  <span>&gt;</span>
                  <span className="text-gray-900 font-medium">Shop</span>
                </div>
                <h1 className="heading-display text-xl md:text-2xl font-black text-[#111827] uppercase tracking-tight mb-2">
                  {activeCategoryName ||
                    (categoryFilter
                      ? categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)
                      : "ALL PARTS")}
                </h1>
                <p className="font-body text-gray-500 text-sm md:text-base">
                  Explore our full catalog of premium merchandise and apparel.
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  <button onClick={() => setFilterType('all')} className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-[#5D3A5D] text-white hover:bg-[#4a2e4a]' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>All Parts</button>
                  <button onClick={() => setFilterType('new')} className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-colors ${filterType === 'new' ? 'bg-[#5D3A5D] text-white hover:bg-[#4a2e4a]' : 'bg-white border border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700'}`}>New Arrivals</button>
                  <button onClick={() => setFilterType('featured')} className={`px-5 py-2 rounded-full font-body text-sm font-medium transition-colors ${filterType === 'featured' ? 'bg-[#5D3A5D] text-white border border-[#5D3A5D] hover:bg-[#4a2e4a]' : 'bg-white border border-gray-900 text-gray-900 hover:bg-gray-50'}`}>Featured</button>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  100% Authentic
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-200 shadow-sm text-sm font-medium text-gray-700">
                  <ArrowRightLeft className="w-4 h-4 text-[#5D3A5D]" />
                  Fast Shipping BD
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 lg:px-8 py-10">

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
              <div className="flex flex-col lg:flex-row gap-4 mb-6 items-center justify-between">
                <div className="relative flex-1 group w-full">
                  <Search className="absolute start-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-gray-700 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search by product name, description, SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full ps-11 pe-4 py-2.5 bg-white border border-gray-200 font-body text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-300 focus:border-gray-300 transition-all rounded-lg"
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0 w-full lg:w-auto">
                  <div className="flex items-center gap-1 border border-gray-200 p-1 rounded-lg bg-white">
                    <button className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"><Menu className="w-4 h-4"/></button>
                    <button className="p-1.5 rounded-md text-[#5D3A5D] bg-[#5D3A5D]/10"><LayoutGrid className="w-4 h-4"/></button>
                  </div>
                  <div className="relative">
                    <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm font-medium py-2.5 pl-10 pr-10 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer">
                      <option value="newest">Newest First</option>
                      <option value="price_asc">Price: Low to High</option>
                      <option value="price_desc">Price: High to Low</option>
                    </select>
                    <svg className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" /></svg>
                    <svg className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 bg-white font-medium text-sm text-gray-700 hover:bg-gray-50 transition-colors md:hidden rounded-lg shadow-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4" /> Filters
                  </button>
                </div>
              </div>
              <p className="font-body text-sm text-gray-500 mb-6">
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
