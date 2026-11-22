import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import HomeHero from "@/components/home/HomeHero";
import HomeSearch from "@/components/home/HomeSearch";
import HomeCategories from "@/components/home/HomeCategories";
import HomeWhyChooseUs from "@/components/home/HomeWhyChooseUs";
import HomeReviews from "@/components/home/HomeReviews";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveProducts, useActiveBanners } from "@/hooks/useDatabase";
import { useActiveCategories } from "@/hooks/useCategories";

const fallbackImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80";

const Index = () => {
  const { data: dbProducts = [], isLoading: productsLoading } =
    useActiveProducts();
  const { data: dbCategories = [] } = useActiveCategories();
  const { data: banners = [] } = useActiveBanners();
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;

  const [visibleNewCount, setVisibleNewCount] = useState(4);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const products = dbProducts.map((p: any) => {
    const imageUrl = p.image_url || p.image || fallbackImage;
    return {
      id: p.id,
      name: p.name,
      brand: p.brand || p.brands?.name || "",
      itemCode: p.item_code || "",
      price: Number(p.price) || 0,
      originalPrice: p.original_price ? Number(p.original_price) : undefined,
      dealerPrice: p.dealer_price ? Number(p.dealer_price) : undefined,
      dealerOriginalPrice: p.dealer_original_price
        ? Number(p.dealer_original_price)
        : undefined,
      category: (p.category?.slug || p.categories?.slug || p.category) as any,
      categoryName: p.categories?.name || "",
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
      isOffer: p.is_offer || false,
    };
  });

  const trendingFiltered = products.filter((p) => p.isTrending);
  const trendingProducts =
    trendingFiltered.length > 0 ? trendingFiltered : products;

  const newFiltered = products.filter((p) => p.isNew);
  const newProducts = newFiltered.length > 0 ? newFiltered : products;

  // Lazy loading for new products
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleNewCount < newProducts.length) {
          setVisibleNewCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleNewCount, newProducts.length]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Slider & Banners */}
      <HomeHero banners={banners} />

      {/* Overlapping Search & Instant Dropdown */}
      <HomeSearch products={products} isDealer={isDealer} />

      {/* Categories Grid */}
      <HomeCategories categories={dbCategories} />

      {/* Trending Products */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-neon font-body text-sm font-bold tracking-[0.1em]">
                {t("trending.label")}
              </span>
              <h2 className="heading-display text-xl md:text-2xl font-semibold mt-1 text-foreground capitalize">
                {String(t("trending.title")).toLowerCase()}
              </h2>
            </div>
            <Link
              to="/parts"
              className="flex items-center gap-1.5 sm:gap-2 font-body text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-[0.1em] text-gray-900 hover:text-neon transition-all group shrink-0 pb-0.5 sm:pb-0"
            >
              {t("trending.view_all")}{" "}
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-neon group-hover:border-neon group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-4">
            {productsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg h-[300px] animate-pulse"
                  />
                ))
              : trendingProducts
                  .slice(0, 10)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-neon font-body text-sm font-bold tracking-[0.1em]">
                {t("new.label")}
              </span>
              <h2 className="heading-display text-xl md:text-2xl font-semibold mt-1 text-foreground capitalize">
                {String(t("new.title")).toLowerCase()}
              </h2>
            </div>
            <Link
              to="/parts"
              className="flex items-center gap-1.5 sm:gap-2 font-body text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-[0.1em] text-gray-900 hover:text-neon transition-all group shrink-0 pb-0.5 sm:pb-0"
            >
              {t("trending.view_all")}{" "}
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-neon group-hover:border-neon group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-4">
            {productsLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-card border border-border rounded-lg h-[300px] animate-pulse"
                  />
                ))
              : newProducts
                  .slice(0, visibleNewCount)
                  .map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
          </div>

          {visibleNewCount < newProducts.length && (
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
        </div>
      </section>

      {/* Why Choose Us */}
      <HomeWhyChooseUs />

      {/* Customer Reviews */}
      <HomeReviews />

      <Footer />
    </div>
  );
};

export default Index;
