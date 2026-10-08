import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import OfferProductCard from "@/components/OfferProductCard";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveCategories } from "@/hooks/useCategories";
import { useActiveBanners, useActiveProducts } from "@/hooks/useDatabase";
import { usePageContent } from "@/hooks/usePageContents";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Star,
  Truck,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Use an optimized, highly compressed external image for the fallback hero instead of a 520KB local asset to boost LCP
const heroImage =
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80";
const fallbackImage = heroImage;

// Automotive Brands
// Dynamically generated from active products

const reviews = [
  {
    name: "Khalid A.",
    text: "Authentic auto parts, fast shipping. Best car accessories store in Oman!",
    rating: 5,
  },
  {
    name: "Fatima R.",
    text: "Got my brake pads in 2 days. Perfect fit and 100% genuine.",
    rating: 5,
  },
  {
    name: "Mohammed S.",
    text: "Great selection of brands. My car is running smoothly now.",
    rating: 5,
  },
];

const Index = () => {
  const { data: dbProducts = [], isLoading: productsLoading } =
    useActiveProducts();
  const { data: dbCategories = [], isLoading: categoriesLoading } =
    useActiveCategories();
  const { data: banners = [], isLoading: bannersLoading } = useActiveBanners();
  const { data: filterSettingsPage } = usePageContent("filter-settings");
  const filterSettings = filterSettingsPage?.content
    ? JSON.parse(filterSettingsPage.content)
    : {
        years: [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015],
        models: ["Sedan", "SUV", "Truck", "Sports"],
      };
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const products = dbProducts.map((p: any) => {
    const imageUrl = p.image_url || p.image || fallbackImage;
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
      isOffer: p.is_offer || false,
    };
  });
  const dynamicBrands = Array.from(
    new Set(products.map((p) => (p.brand || "").trim().toUpperCase())),
  )
    .filter(Boolean)
    .sort();
  const trendingFiltered = products.filter((p) => p.isTrending);
  const trendingProducts = trendingFiltered.length > 0 ? trendingFiltered : products;

  const newFiltered = products.filter((p) => p.isNew);
  const newProducts = newFiltered.length > 0 ? newFiltered : products;

  const offerProducts = products.filter(
    (p) => p.isOffer || (p.originalPrice != null && Number(p.originalPrice) > Number(p.price)),
  );
  const [email, setEmail] = useState("");
  const isLoading = productsLoading || categoriesLoading || bannersLoading;

  const [visibleNewCount, setVisibleNewCount] = useState(4);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef1 = useRef<HTMLDivElement>(null);
  const categoryScrollRef2 = useRef<HTMLDivElement>(null);

  const [emblaRef] = useEmblaCarousel({ loop: true, align: "start" }, [
    Autoplay({ delay: 3000, stopOnInteraction: false }),
  ]);

  // Auto-scroll logic for categories (Continuous Smooth Slide)
  useEffect(() => {
    if (dbCategories.length === 0) return;

    let animationFrameId1: number;
    let animationFrameId2: number;
    let lastTime1 = 0;
    let lastTime2 = 0;

    const scrollCategory = (
      ref: React.RefObject<HTMLDivElement>,
      direction: 1 | -1,
      timestamp: number,
      lastTimeRef: { current: number }
    ) => {
      if (!ref.current) return;
      
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = timestamp - lastTimeRef.current;

      // Scroll 1 pixel every 25ms (approx 40 pixels per second)
      if (deltaTime > 25) {
        const { scrollLeft, scrollWidth, clientWidth } = ref.current;
        let newScrollLeft = scrollLeft + direction;

        if (direction === 1 && scrollLeft >= scrollWidth - clientWidth - 1) {
          newScrollLeft = 0;
        } else if (direction === -1 && scrollLeft <= 1) {
          newScrollLeft = scrollWidth - clientWidth;
        }

        ref.current.scrollLeft = newScrollLeft;
        lastTimeRef.current = timestamp;
      }
    };

    const lastTimeRef1 = { current: 0 };
    const lastTimeRef2 = { current: 0 };

    const loop1 = (timestamp: number) => {
      scrollCategory(categoryScrollRef1, 1, timestamp, lastTimeRef1);
      animationFrameId1 = requestAnimationFrame(loop1);
    };

    const loop2 = (timestamp: number) => {
      scrollCategory(categoryScrollRef2, -1, timestamp, lastTimeRef2);
      animationFrameId2 = requestAnimationFrame(loop2);
    };

    animationFrameId1 = requestAnimationFrame(loop1);
    animationFrameId2 = requestAnimationFrame(loop2);

    return () => {
      cancelAnimationFrame(animationFrameId1);
      cancelAnimationFrame(animationFrameId2);
    };
  }, [dbCategories.length]);

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

  const heroBanners = banners.filter((b) => b.position === "hero");
  const promoBanners = banners.filter((b) => b.position === "promo");

  const midCategory = Math.ceil(dbCategories.length / 2);
  const categoryRow1 = dbCategories.slice(0, midCategory);
  const categoryRow2 = dbCategories.slice(midCategory);

  const nextBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(1);
      setCurrentBanner((prev) => (prev + 1) % heroBanners.length);
    }
  }, [heroBanners.length]);

  const prevBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(-1);
      setCurrentBanner(
        (prev) => (prev - 1 + heroBanners.length) % heroBanners.length,
      );
    }
  }, [heroBanners.length]);

  const slideVariants = {
    initial: (dir: number) => ({
      x: dir > 0 ? "100%" : "-100%",
    }),
    animate: {
      x: 0,
      transition: { duration: 0.8, ease: "easeInOut" },
    },
    exit: (dir: number) => ({
      x: dir > 0 ? "-100%" : "100%",
      transition: { duration: 0.8, ease: "easeInOut" },
    }),
  };

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length, nextBanner]);

  const getCategoryImage = (slug: string, imageUrl: string | null) =>
    imageUrl || fallbackImage;

  const getCategoryCount = (slug: string) =>
    products.filter((p) => p.category === slug).length;

  // Removed full-page blocking loader to improve LCP
  // We now let the page render instantly with empty arrays/fallbacks while data loads

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Top Banners Section */}
      <section className="pt-28 lg:pt-30 bg-background relative">
        <div className="w-full px-0 lg:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:h-[550px] xl:h-[750px]">
            {/* Main Slider (Left) */}
            <div
              className={`group relative w-full h-[400px] lg:h-full overflow-hidden ${promoBanners.length > 0 ? "lg:col-span-2" : "lg:col-span-3"}`}
            >
              {/* Unconditionally render the preloaded fallback image to ensure instant LCP */}
              {/* <div className="absolute inset-0">
                <img src={heroImage} alt="Premium Auto Parts" fetchPriority="high" decoding="sync" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />
              </div> */}

              {heroBanners.length > 0 ? (
                <>
                  <AnimatePresence initial={false} custom={direction}>
                    <motion.div
                      key={currentBanner}
                      custom={direction}
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute inset-0"
                    >
                      <img
                        src={heroBanners[currentBanner].image_url}
                        alt={heroBanners[currentBanner].title}
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent md:bg-gradient-to-r md:from-black/90 md:via-black/40 md:to-transparent" />
                    </motion.div>
                  </AnimatePresence>

                  <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="container mx-auto px-2 lg:px-12 pointer-events-auto"
                    >
                      <div className="p-6 md:p-10 max-w-2xl inline-block">
                        {heroBanners[currentBanner].title && (
                          <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-4 text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.8)]">
                            {heroBanners[currentBanner].title}
                          </h1>
                        )}
                        {heroBanners[currentBanner].subtitle && (
                          <p className="text-gray-100 font-body text-base sm:text-xl mb-8 drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] font-medium">
                            {heroBanners[currentBanner].subtitle}
                          </p>
                        )}
                        {heroBanners[currentBanner].link_url && (
                          <Link
                            to={heroBanners[currentBanner].link_url!}
                            className="inline-flex items-center gap-3 bg-neon text-accent-foreground px-8 py-4 font-body text-[15px] font-bold tracking-widest uppercase hover:bg-white hover:text-black hover:scale-105 transition-all duration-300 rounded-full shadow-[0_10px_30px_rgba(var(--neon-rgb),0.5)]"
                          >
                            {t("hero.shop_now")}{" "}
                            <ArrowRight className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {heroBanners.length > 1 && (
                    <>
                      <button
                        onClick={prevBanner}
                        aria-label="Previous banner"
                        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all duration-300 border border-white/20 opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 shadow-xl"
                      >
                        <ChevronLeft className="w-7 h-7 transition-colors" />
                      </button>
                      <button
                        onClick={nextBanner}
                        aria-label="Next banner"
                        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-14 h-14 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center text-white hover:bg-neon hover:text-black transition-all duration-300 border border-white/20 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 shadow-xl"
                      >
                        <ChevronRight className="w-7 h-7 transition-colors" />
                      </button>
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                        {heroBanners.map((_, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setDirection(i > currentBanner ? 1 : -1);
                              setCurrentBanner(i);
                            }}
                            aria-label={`Go to banner ${i + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 ${i === currentBanner ? "w-10 bg-neon" : "w-2 bg-white/50 hover:bg-white/80"}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.8 }}
                      className="container mx-auto px-2 lg:px-12 pointer-events-auto"
                    >
                      <div className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl border border-white/10 max-w-xl inline-block shadow-2xl">
                        <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-3 text-white drop-shadow-xl">
                          {t("hero.fuel")}
                          <br />
                          <span className="text-neon text-glow">
                            {t("hero.game")}
                          </span>
                        </h1>
                        <p className="text-gray-200 font-body text-base sm:text-lg mb-8 drop-shadow-md">
                          {t("hero.subtitle")}
                        </p>
                        <Link
                          to="/parts"
                          className="inline-flex items-center gap-2 bg-neon text-accent-foreground px-8 py-4 font-body text-sm font-bold tracking-widest uppercase hover:bg-neon-glow transition-all duration-300 rounded-md shadow-[0_0_15px_rgba(var(--neon),0.4)]"
                        >
                          {t("hero.shop_now")}{" "}
                          <ArrowRight className="w-5 h-5" />
                        </Link>
                      </div>
                    </motion.div>
                  </div>
                </>
              )}
            </div>

            {/* Side Promo Banners (Right) */}
            {promoBanners.length > 0 && (
              <div className="flex flex-col gap-4 h-full pr-0 lg:pr-4">
                {promoBanners.slice(0, 2).map((b) => (
                  <Link
                    key={b.id}
                    to={b.link_url || "/parts"}
                    className="group relative w-full h-[200px] lg:h-[calc(50%-0.5rem)] overflow-hidden block border-l-4 border-transparent hover:border-neon transition-all duration-300"
                  >
                    <img
                      src={b.image_url}
                      alt={b.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="font-heading text-xl md:text-2xl font-bold uppercase text-white drop-shadow-lg">
                        {b.title}
                      </h3>
                      {b.subtitle && (
                        <p className="font-body text-sm text-gray-300 mt-2 drop-shadow-md">
                          {b.subtitle}
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vehicle Finder Overlapping Widget */}
      <section className="relative z-30 -mt-10 mb-2 px-4 sm:px-6 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="bg-card rounded-[2rem] shadow-[0_20px_40px_rgba(0,0,0,0.1)] border border-border p-2 md:p-3 flex flex-col md:flex-row items-center gap-3 w-full max-w-4xl mx-auto"
        >
          <div className="hidden md:flex flex-shrink-0 items-center pl-4 pr-2">
            <div className="w-12 h-12 bg-neon/10 rounded-full flex items-center justify-center shrink-0">
              <Search className="w-5 h-5 text-neon" />
            </div>
            <div className="ml-4">
              <h3 className="font-heading font-bold text-base text-foreground uppercase tracking-wide">
                Find Your Parts
              </h3>
              <p className="font-body text-[11px] text-muted-foreground uppercase tracking-wider">
                Search for exact fitment
              </p>
            </div>
          </div>

          <div className="w-full flex-1">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchQuery.trim()) {
                  navigate(
                    `/parts?search=${encodeURIComponent(searchQuery.trim())}`,
                  );
                } else {
                  navigate(`/parts`);
                }
              }}
              className="flex items-center w-full bg-background border-2 border-neon/30 rounded-full overflow-hidden shadow-sm hover:shadow-md focus-within:border-neon focus-within:ring-4 focus-within:ring-neon/10 transition-all"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for parts by name, brand, or OEM number..."
                className="w-full h-12 md:h-14 pl-5 md:pl-6 pr-4 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm md:text-base font-body"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="p-2 mr-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
              <button
                type="submit"
                aria-label="Search"
                className="flex items-center justify-center px-6 md:px-8 h-10 md:h-12 bg-neon hover:bg-neon-glow text-white transition-all shrink-0 cursor-pointer font-bold tracking-widest uppercase mr-1 rounded-full shadow-md hover:-translate-y-0.5"
              >
                Search
              </button>
            </form>
          </div>
        </motion.div>
      </section>

      {/* Categories Grid */}
      <section className="py-8 bg-gray-50/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex flex-row items-end justify-between mb-8 gap-2">
            <div>
              <span className="text-neon font-body text-[10px] sm:text-xs font-bold tracking-[0.1em] sm:tracking-[0.2em] mb-1 sm:mb-2 flex items-center gap-1.5 sm:gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-neon animate-pulse"></div>
                Top Categories
              </span>
              <h2 className="heading-display text-[16px] sm:text-2xl md:text-3xl font-semibold text-gray-900 tracking-tight capitalize">
                {String(t("categories.title")).toLowerCase()}
              </h2>
            </div>
            <Link
              to="/parts"
              className="flex items-center gap-1.5 sm:gap-2 font-body text-[10px] sm:text-xs font-bold tracking-wider sm:tracking-[0.1em] text-gray-900 hover:text-neon transition-all group shrink-0 pb-0.5 sm:pb-0"
            >
              {t("categories.all")}{" "}
              <span className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center group-hover:bg-neon group-hover:border-neon group-hover:text-white transition-all shadow-sm">
                <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
              </span>
            </Link>
          </div>

          <div className="flex flex-col gap-2 md:gap-3">
            {/* First Row */}
            <div
              ref={categoryScrollRef1}
              className="overflow-x-auto hide-scrollbar pb-1 w-full"
            >
              <div className="flex gap-3 md:gap-5 w-max px-2 pt-2">
                {categoryRow1.map((cat, i) => (
                  <div
                    key={cat.id}
                    className="w-[110px] sm:w-[130px] md:w-[160px] lg:w-[180px] shrink-0 group cursor-pointer"
                  >
                      <Link
                        to={`/parts?category=${cat.slug}`}
                        className="flex flex-col items-center w-full bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-neon/30 transition-all duration-500"
                      >
                        <div className="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden rounded-lg md:rounded-xl bg-gray-50 group-hover:bg-gray-100/50 transition-colors">
                        <img
                          src={getCategoryImage(cat.slug, cat.image_url)}
                          alt={cat.name}
                          width="250"
                          height="250"
                          className="w-[85%] h-[85%] object-contain relative z-10 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply"
                          loading="lazy"
                        />
                      </div>
                      <h3 className="font-heading font-extrabold text-[11px] sm:text-[13px] md:text-[15px] text-gray-800 group-hover:text-neon transition-colors text-center tracking-wider px-1 leading-tight line-clamp-2 h-[2.5em] flex items-center justify-center">
                        {cat.name}
                      </h3>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Second Row */}
            {categoryRow2.length > 0 && (
              <div
                ref={categoryScrollRef2}
                className="overflow-x-auto hide-scrollbar pb-4 w-full"
              >
                <div className="flex gap-3 md:gap-5 w-max px-2 pt-2">
                  {categoryRow2.map((cat, i) => (
                    <div
                      key={cat.id}
                      className="w-[110px] sm:w-[130px] md:w-[160px] lg:w-[180px] shrink-0 group cursor-pointer"
                    >
                      <Link
                        to={`/parts?category=${cat.slug}`}
                        className="flex flex-col items-center w-full bg-white p-2.5 md:p-3 rounded-xl md:rounded-2xl border border-gray-100 shadow-[0_4px_15px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1.5 hover:border-neon/30 transition-all duration-500"
                      >
                        <div className="w-full aspect-square flex items-center justify-center mb-3 relative overflow-hidden rounded-lg md:rounded-xl bg-gray-50 group-hover:bg-gray-100/50 transition-colors">
                          <img
                            src={getCategoryImage(cat.slug, cat.image_url)}
                            alt={cat.name}
                            width="250"
                            height="250"
                            className="w-[85%] h-[85%] object-contain relative z-10 group-hover:scale-110 transition-transform duration-700 ease-out mix-blend-multiply"
                            loading="lazy"
                          />
                        </div>
                        <h3 className="font-heading font-extrabold text-[11px] sm:text-[13px] md:text-[15px] text-gray-800 group-hover:text-neon transition-colors text-center tracking-wider px-1 leading-tight line-clamp-2 h-[2.5em] flex items-center justify-center">
                          {cat.name}
                        </h3>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Offer Products
      {offerProducts.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-neon font-body text-sm font-bold tracking-[0.1em] uppercase">
                  Special Offers
                </span>
                <h2 className="heading-display text-xl md:text-2xl font-bold mt-1 text-foreground">
                  Offer Products
                </h2>
              </div>
              <Link
                to="/parts"
                className="flex items-center gap-2 font-body text-sm font-semibold tracking-widers text-foreground hover-neon transition-colors"
              >
                {t("trending.view_all")} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {productsLoading
                  ? Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex-none w-full md:w-1/2 pl-4">
                        <div className="bg-card border border-border rounded-lg h-[200px] animate-pulse"></div>
                      </div>
                    ))
                  : offerProducts.map((product) => (
                      <div
                        key={product.id}
                        className="flex-none w-full md:w-1/2 pl-4"
                      >
                        <OfferProductCard product={product} />
                      </div>
                    ))}
              </div>
            </div>
          </div>
        </section>
      )}
      */}

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
                  ></div>
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
                  ></div>
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
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-neon font-body text-sm font-bold tracking-[0.2em] uppercase">
              {t("why.label")}
            </span>
            <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">
              {t("why.title")}
            </h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[
              {
                icon: Shield,
                title: t("why.authentic"),
                desc: t("why.authentic_desc"),
              },
              {
                icon: Zap,
                title: t("why.performance"),
                desc: t("why.performance_desc"),
              },
              {
                icon: Truck,
                title: t("why.delivery"),
                desc: t("why.delivery_desc"),
              },
              {
                icon: RefreshCw,
                title: t("why.returns"),
                desc: t("why.returns_desc"),
              },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-background rounded-lg border border-border hover:border-neon/30 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-14 h-14 mx-auto mb-5 bg-neon/10 rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-neon" />
                </div>
                <h3 className="font-heading text-md font-bold uppercase tracking-wide mb-2 text-foreground">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <span className="text-neon font-body text-sm font-bold tracking-[0.2rem] uppercase">
              {t("reviews.label")}
            </span>
            <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">
              {t("reviews.title")}
            </h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {reviews.map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card p-8 border border-border rounded-lg hover:border-neon/20 hover:shadow-md transition-all"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-neon text-neon" />
                  ))}
                </div>
                <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">
                  "{review.text}"
                </p>
                <p className="font-heading font-bold text-sm uppercase tracking-wider text-foreground">
                  {review.name}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
