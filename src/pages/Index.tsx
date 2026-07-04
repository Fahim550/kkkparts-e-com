import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Zap, Truck, RefreshCw, Shield, ChevronRight, ChevronLeft, ChevronDown, Loader2, Search } from 'lucide-react';
import { useActiveProducts, useActiveBanners } from '@/hooks/useDatabase';
import { useActiveCategories } from '@/hooks/useCategories';
import { usePageContent } from '@/hooks/usePageContents';
import { useLanguage } from '@/context/LanguageContext';
import ProductCard from '@/components/ProductCard';
import OfferProductCard from '@/components/OfferProductCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import useEmblaCarousel from 'embla-carousel-react';
import Autoplay from 'embla-carousel-autoplay';
import { useState, useEffect, useCallback, useRef } from 'react';
import { SearchableSelect } from '@/components/SearchableSelect';

// Use an optimized, highly compressed external image for the fallback hero instead of a 520KB local asset to boost LCP
const heroImage = "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80";
const fallbackImage = heroImage;

// Automotive Brands
// Dynamically generated from active products

const reviews = [
  { name: 'Khalid A.', text: 'Authentic auto parts, fast shipping. Best car accessories store in Oman!', rating: 5 },
  { name: 'Fatima R.', text: 'Got my brake pads in 2 days. Perfect fit and 100% genuine.', rating: 5 },
  { name: 'Mohammed S.', text: 'Great selection of brands. My car is running smoothly now.', rating: 5 },
];

const Index = () => {
  const { data: dbProducts = [], isLoading: productsLoading } = useActiveProducts();
  const { data: dbCategories = [], isLoading: categoriesLoading } = useActiveCategories();
  const { data: banners = [], isLoading: bannersLoading } = useActiveBanners();
  const { data: filterSettingsPage } = usePageContent('filter-settings');
  const filterSettings = filterSettingsPage?.content ? JSON.parse(filterSettingsPage.content) : { years: [2024, 2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015], models: ['Sedan', 'SUV', 'Truck', 'Sports'] };
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [currentBanner, setCurrentBanner] = useState(0);
  const [direction, setDirection] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const products = dbProducts.map(p => ({
    id: p.id, name: p.name, brand: p.brand, price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    dealerPrice: p.dealer_price ? Number(p.dealer_price) : undefined,
    dealerOriginalPrice: p.dealer_original_price ? Number(p.dealer_original_price) : undefined,
    category: p.category as any, image: p.image, images: p.images || [p.image],
    stock: p.stock || 0,
    sizes: p.sizes || [], colors: p.colors || [], description: p.description || '',
    rating: Number(p.rating) || 4.5, reviews: p.reviews || 0,
    isTrending: p.is_trending || false, isNew: p.is_new || false, isOffer: (p as any).is_offer || false,
  }));
  const dynamicBrands = Array.from(new Set(products.map(p => p.brand.trim().toUpperCase()))).filter(Boolean).sort();
  const trendingProducts = products.filter(p => p.isTrending);
  const newProducts = products.filter(p => p.isNew);
  const offerProducts = products.filter(p => p.isOffer);
  const [email, setEmail] = useState('');
  const isLoading = productsLoading || categoriesLoading || bannersLoading;

  const [visibleNewCount, setVisibleNewCount] = useState(4);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const categoryScrollRef1 = useRef<HTMLDivElement>(null);
  const categoryScrollRef2 = useRef<HTMLDivElement>(null);

  const [emblaRef] = useEmblaCarousel({ loop: true, align: 'start' }, [
    Autoplay({ delay: 3000, stopOnInteraction: false })
  ]);

  // Auto-scroll logic for categories
  useEffect(() => {
    if (dbCategories.length === 0) return;
    
    const scrollCategory = (ref: React.RefObject<HTMLDivElement>, direction: 1 | -1) => {
      if (!ref.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      
      // Auto-scroll logic
      let newScrollLeft = scrollLeft + (direction * 150); // Scroll by approximately one item width
      
      if (direction === 1 && scrollLeft >= scrollWidth - clientWidth - 10) {
        newScrollLeft = 0; // Reset to start
      } else if (direction === -1 && scrollLeft <= 10) {
        newScrollLeft = scrollWidth - clientWidth; // Reset to end
      }
      
      ref.current.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
    };

    const intervalId1 = setInterval(() => scrollCategory(categoryScrollRef1, 1), 3000);
    const intervalId2 = setInterval(() => scrollCategory(categoryScrollRef2, -1), 3500);

    return () => {
      clearInterval(intervalId1);
      clearInterval(intervalId2);
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
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleNewCount, newProducts.length]);

  const heroBanners = banners.filter(b => b.position === 'hero');
  const promoBanners = banners.filter(b => b.position === 'promo');

  const midCategory = Math.ceil(dbCategories.length / 2);
  const categoryRow1 = dbCategories.slice(0, midCategory);
  const categoryRow2 = dbCategories.slice(midCategory);

  const nextBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(1);
      setCurrentBanner(prev => (prev + 1) % heroBanners.length);
    }
  }, [heroBanners.length]);

  const prevBanner = useCallback(() => {
    if (heroBanners.length > 1) {
      setDirection(-1);
      setCurrentBanner(prev => (prev - 1 + heroBanners.length) % heroBanners.length);
    }
  }, [heroBanners.length]);

  const slideVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.8 } },
    exit: { opacity: 0, transition: { duration: 0.8 } }
  };

  useEffect(() => {
    if (heroBanners.length <= 1) return;
    const interval = setInterval(nextBanner, 5000);
    return () => clearInterval(interval);
  }, [heroBanners.length, nextBanner]);

  const getCategoryImage = (slug: string, imageUrl: string | null) =>
    imageUrl || fallbackImage;

  const getCategoryCount = (slug: string) =>
    products.filter(p => p.category === slug).length;

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
            <div className={`relative w-full h-[400px] lg:h-full overflow-hidden  ${promoBanners.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
              {/* Unconditionally render the preloaded fallback image to ensure instant LCP */}
              {/* <div className="absolute inset-0">
                <img src={heroImage} alt="Premium Auto Parts" fetchPriority="high" decoding="sync" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />
              </div> */}

              {heroBanners.length > 0 ? (
                <>
                  <AnimatePresence>
                    <motion.div 
                      key={currentBanner} 
                      variants={slideVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="absolute inset-0"
                    >
                      <img src={heroBanners[currentBanner].image_url} alt={heroBanners[currentBanner].title} fetchPriority="low" decoding="async" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent md:bg-gradient-to-r md:from-black/80 md:via-black/40 md:to-transparent" />
                    </motion.div>
                  </AnimatePresence>
                  
                  <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="container mx-auto px-2 lg:px-12 pointer-events-auto">
                      <div className=" p-6 md:p-10 rounded-2xl border border-white/10 max-w-xl inline-block shadow-2xl">
                        <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-3 text-white drop-shadow-xl">
                          {heroBanners[currentBanner].title}
                        </h1>
                        {heroBanners[currentBanner].subtitle && (
                          <p className="text-gray-200 font-body text-base sm:text-lg mb-8 drop-shadow-md">
                            {heroBanners[currentBanner].subtitle}
                          </p>
                        )}
                        {heroBanners[currentBanner].link_url && (
                          <Link to={heroBanners[currentBanner].link_url!}
                            className="inline-flex items-center gap-2 bg-neon text-accent-foreground px-8 py-4 font-body text-sm font-bold tracking-widest uppercase hover:bg-neon-glow transition-all duration-300 rounded-md shadow-[0_0_15px_rgba(var(--neon),0.4)]">
                            {t('hero.shop_now')} <ArrowRight className="w-5 h-5" />
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  {heroBanners.length > 1 && (
                    <>
                      <button onClick={prevBanner} aria-label="Previous banner" className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/70 transition-colors border border-white/20">
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </button>
                      <button onClick={nextBanner} aria-label="Next banner" className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-black/70 transition-colors border border-white/20">
                        <ChevronRight className="w-6 h-6 text-white" />
                      </button>
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
                        {heroBanners.map((_, i) => (
                          <button key={i} onClick={() => {
                              setDirection(i > currentBanner ? 1 : -1);
                              setCurrentBanner(i);
                            }} aria-label={`Go to banner ${i + 1}`}
                            className={`h-2 rounded-full transition-all duration-300 ${i === currentBanner ? 'w-10 bg-neon' : 'w-2 bg-white/50 hover:bg-white/80'}`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  <div className="absolute inset-0 p-5 md:p-16 flex flex-col justify-center z-10 text-primary-foreground pointer-events-none">
                    <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="container mx-auto px-2 lg:px-12 pointer-events-auto">
                      <div className="bg-black/40 backdrop-blur-md p-6 md:p-10 rounded-2xl border border-white/10 max-w-xl inline-block shadow-2xl">
                        <h1 className="heading-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] mb-3 text-white drop-shadow-xl">
                          {t('hero.fuel')}<br /><span className="text-neon text-glow">{t('hero.game')}</span>
                        </h1>
                        <p className="text-gray-200 font-body text-base sm:text-lg mb-8 drop-shadow-md">
                          {t('hero.subtitle')}
                        </p>
                        <Link to="/parts" className="inline-flex items-center gap-2 bg-neon text-accent-foreground px-8 py-4 font-body text-sm font-bold tracking-widest uppercase hover:bg-neon-glow transition-all duration-300 rounded-md shadow-[0_0_15px_rgba(var(--neon),0.4)]">
                          {t('hero.shop_now')} <ArrowRight className="w-5 h-5" />
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
                {promoBanners.slice(0, 2).map(b => (
                  <Link key={b.id} to={b.link_url || '/parts'} className="group relative w-full h-[200px] lg:h-[calc(50%-0.5rem)] overflow-hidden block border-l-4 border-transparent hover:border-neon transition-all duration-300">
                    <img src={b.image_url} alt={b.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="font-heading text-xl md:text-2xl font-bold uppercase text-white drop-shadow-lg">{b.title}</h3>
                      {b.subtitle && <p className="font-body text-sm text-gray-300 mt-2 drop-shadow-md">{b.subtitle}</p>}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Vehicle Finder Overlapping Widget */}
      <section className="relative z-30 -mt-10 mb-10 px-0">
        <div className="container mx-auto max-w-6xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }} className="bg-card rounded-xl shadow-lg border border-border p-4 md:p-6 flex flex-col lg:flex-row items-center gap-4 lg:gap-6">
            <div 
              className="flex-shrink-0 flex items-center justify-between w-full lg:w-auto mb-2 lg:mb-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-neon/10 rounded-full flex items-center justify-center">
                  <Search className="w-6 h-6 text-neon" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-lg text-foreground uppercase tracking-wide">Find Your Parts</h3>
                  <p className="font-body text-xs text-muted-foreground">Search for exact fitment</p>
                </div>
              </div>
            </div>
            
            <div className="w-full lg:w-auto flex-1 mt-4 lg:mt-0">
              <div className="overflow-hidden">
                <form onSubmit={(e) => { 
                    e.preventDefault(); 
                    if(searchQuery.trim()) {
                      navigate(`/parts?search=${encodeURIComponent(searchQuery.trim())}`); 
                    } else {
                      navigate(`/parts`);
                    }
                  }} className="flex flex-col sm:flex-row gap-3 w-full">
                  <div className="flex-1 w-full relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search for parts by name, brand, or OEM number..." 
                      className="w-full pl-12 pr-4 py-3.5 bg-background border border-border text-foreground rounded-lg focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors font-body text-sm shadow-sm"
                    />
                  </div>
                  <button type="submit" className="bg-neon text-accent-foreground font-bold uppercase tracking-widest px-8 py-3.5 rounded-lg hover:bg-neon-glow transition-colors shadow-md w-full sm:w-auto shrink-0">
                    Search
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Badges */}
      {/* <section className="py-6 border-b border-border/50 bg-background/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid grid-cols-2 md:flex md:flex-wrap md:justify-center gap-y-6 gap-x-2 md:gap-12 lg:gap-20">
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-neon shrink-0" />
              <div className="text-left">
                <h4 className="font-heading font-bold text-[11px] sm:text-sm uppercase text-foreground leading-tight">100% Genuine Parts</h4>
                <p className="font-body text-[9px] sm:text-xs text-muted-foreground mt-0.5">Direct from manufacturers</p>
              </div>
            </div>
            <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3">
              <Truck className="w-6 h-6 md:w-8 md:h-8 text-neon shrink-0" />
              <div className="text-left">
                <h4 className="font-heading font-bold text-[11px] sm:text-sm uppercase text-foreground leading-tight">Fast Delivery</h4>
                <p className="font-body text-[9px] sm:text-xs text-muted-foreground mt-0.5">All across Oman</p>
              </div>
            </div>
            <div className="col-span-2 flex justify-center md:block">
              <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-neon shrink-0" />
                <div className="text-left">
                  <h4 className="font-heading font-bold text-[11px] sm:text-sm uppercase text-foreground leading-tight">Best Price Match</h4>
                  <p className="font-body text-[9px] sm:text-xs text-muted-foreground mt-0.5">Guaranteed lowest prices</p>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex col-span-2 md:col-span-1 items-center justify-center md:justify-start gap-2 md:gap-3">
              <RefreshCw className="w-6 h-6 md:w-8 md:h-8 text-neon shrink-0" />
              <div className="text-left">
                <h4 className="font-heading font-bold text-[11px] sm:text-sm uppercase text-foreground leading-tight">Easy Returns</h4>
                <p className="font-body text-[9px] sm:text-xs text-muted-foreground mt-0.5">14-day return policy</p>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* Brand Ticker
      <section className="py-5 border-b border-border bg-card overflow-hidden">
        <div className="flex items-center gap-12 animate-marquee whitespace-nowrap">
          {[...dynamicBrands, ...dynamicBrands, ...dynamicBrands].map((brand, i) => (
            <span key={i} className="font-heading text-2xl font-bold text-muted-foreground/30 uppercase tracking-wider">{brand}</span>
          ))}
        </div>
      </section>
      */}

      {/* Categories Grid */}
      <section className="py-12 lg:py-16 bg-pink-50/30">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="heading-display text-xl md:text-2xl font-bold text-foreground">{t('categories.title')}</h2>
            </div>
            <Link to="/parts" className="flex items-center gap-1 font-body text-sm font-medium text-foreground hover-neon transition-colors">
              {t('categories.all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex flex-col gap-3 md:gap-4 lg:gap-2">
            <div ref={categoryScrollRef1} className="overflow-x-auto hide-scrollbar pb-2 lg:pb-3 w-full scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
              <div className="flex gap-3 md:gap-4 w-max px-1 lg:px-0">
                {categoryRow1.map((cat, i) => (
                  <div key={cat.id} className="w-[85px] sm:w-[100px] md:w-[120px] lg:w-[140px] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                    <Link to={`/parts?category=${cat.slug}`} className="flex flex-col items-center group text-center w-full">
                      <div className="w-full aspect-square overflow-hidden rounded-lg bg-gradient-to-b from-[#eaf6ff] to-[#dbf0ff] transition-all duration-300 mb-2 relative shadow-md group-hover:shadow-xl group-hover:-translate-y-1 border border-border/50">
                        <img src={getCategoryImage(cat.slug, cat.image_url)} alt={cat.name} width="200" height="200" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                      </div>
                      <h3 className="font-body text-[11px] sm:text-[12px] md:text-[14px] font-medium text-foreground group-hover:text-primary transition-colors truncate w-full text-center leading-tight px-1">{cat.name}</h3>
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {categoryRow2.length > 0 && (
              <div ref={categoryScrollRef2} className="overflow-x-auto hide-scrollbar pb-2 lg:pb-0 w-full scroll-smooth" style={{ scrollSnapType: 'x mandatory' }}>
                <div className="flex gap-3 md:gap-4 w-max px-1 lg:px-0">
                  {categoryRow2.map((cat, i) => (
                    <div key={cat.id} className="w-[85px] sm:w-[100px] md:w-[120px] lg:w-[140px] shrink-0" style={{ scrollSnapAlign: 'start' }}>
                      <Link to={`/parts?category=${cat.slug}`} className="flex flex-col items-center group text-center w-full">
                        <div className="w-full aspect-square overflow-hidden rounded-lg bg-gradient-to-b from-[#eaf6ff] to-[#dbf0ff] transition-all duration-300 mb-2 relative shadow-md group-hover:shadow-xl group-hover:-translate-y-1 border border-border/50">
                          <img src={getCategoryImage(cat.slug, cat.image_url)} alt={cat.name} width="200" height="200" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                        </div>
                        <h3 className="font-body text-[11px] sm:text-[12px] md:text-[14px] font-medium text-foreground group-hover:text-primary transition-colors truncate w-full text-center leading-tight px-1">{cat.name}</h3>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Offer Products */}
      {offerProducts.length > 0 && (
        <section className="py-16 bg-background">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <span className="text-neon font-body text-sm font-bold tracking-[0.1em] uppercase">Special Offers</span>
                <h2 className="heading-display text-xl md:text-2xl font-bold mt-1 text-foreground">Offer Products</h2>
              </div>
              <Link to="/parts" className="flex items-center gap-2 font-body text-sm font-semibold tracking-widers text-foreground hover-neon transition-colors">
                {t('trending.view_all')} <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="overflow-hidden" ref={emblaRef}>
              <div className="flex -ml-4">
                {productsLoading ? (
                   Array.from({ length: 2 }).map((_, i) => (
                     <div key={i} className="flex-none w-full md:w-1/2 pl-4">
                       <div className="bg-card border border-border rounded-lg h-[200px] animate-pulse"></div>
                     </div>
                   ))
                ) : (
                  offerProducts.map(product => (
                    <div key={product.id} className="flex-none w-full md:w-1/2 pl-4">
                      <OfferProductCard product={product} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Trending Products */}
      <section className="py-8 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-neon font-body text-sm font-bold tracking-[0.1em] uppercase">{t('trending.label')}</span>
              <h2 className="heading-display text-xl md:text-2xl font-bold mt-1 text-foreground">{t('trending.title')}</h2>
            </div>
            <Link to="/parts" className="flex items-center gap-2 font-body text-sm font-semibold tracking-widers text-foreground hover-neon transition-colors">
              {t('trending.view_all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-4">
            {productsLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="bg-card border border-border rounded-lg h-[300px] animate-pulse"></div>
               ))
            ) : (
              trendingProducts.slice(0, 10).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-14 lg:py-14">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-end justify-between mb-8">
            <div>
              <span className="text-neon font-body text-sm font-bold tracking-[0.1em] uppercase">{t('new.label')}</span>
              <h2 className="heading-display text-xl md:text-2xl font-bold mt-1 text-foreground">{t('new.title')}</h2>
            </div>
            <Link to="/parts" className="flex items-center gap-2 font-body text-sm font-semibold tracking-widers text-foreground hover-neon transition-colors">
              {t('trending.view_all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 lg:gap-4">
            {productsLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <div key={i} className="bg-card border border-border rounded-lg h-[300px] animate-pulse"></div>
               ))
            ) : (
              newProducts.slice(0, visibleNewCount).map(product => (
                <ProductCard key={product.id} product={product} />
              ))
            )}
          </div>
          
          {visibleNewCount < newProducts.length && (
            <div ref={loadMoreRef} className="mt-12 flex justify-center items-center gap-2 text-primary py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="font-body text-sm font-medium tracking-wide">Loading more products...</span>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-16 bg-card">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-neon font-body text-sm font-bold tracking-[0.2em] uppercase">{t('why.label')}</span>
            <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">{t('why.title')}</h2>
          </motion.div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[
              { icon: Shield, title: t('why.authentic'), desc: t('why.authentic_desc') },
              { icon: Zap, title: t('why.performance'), desc: t('why.performance_desc') },
              { icon: Truck, title: t('why.delivery'), desc: t('why.delivery_desc') },
              { icon: RefreshCw, title: t('why.returns'), desc: t('why.returns_desc') },
            ].map((item, i) => (
              <motion.div key={item.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="text-center p-6 bg-background rounded-lg border border-border hover:border-neon/30 hover:shadow-lg transition-all duration-300">
                <div className="w-14 h-14 mx-auto mb-5 bg-neon/10 rounded-full flex items-center justify-center">
                  <item.icon className="w-6 h-6 text-neon" />
                </div>
                <h3 className="font-heading text-md font-bold uppercase tracking-wide mb-2 text-foreground">{item.title}</h3>
                <p className="font-body text-sm text-muted-foreground">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="py-16">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-neon font-body text-sm font-bold tracking-[0.2rem] uppercase">{t('reviews.label')}</span>
            <h2 className="heading-display text-2xl md:text-2xl font-bold mt-2 text-foreground">{t('reviews.title')}</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {reviews.map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="bg-card p-8 border border-border rounded-lg hover:border-neon/20 hover:shadow-md transition-all">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: review.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-neon text-neon" />
                  ))}
                </div>
                <p className="font-body text-sm text-muted-foreground mb-4 leading-relaxed">"{review.text}"</p>
                <p className="font-heading font-bold text-sm uppercase tracking-wider text-foreground">{review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="max-w-xl mx-auto text-center">
            <span className="text-neon font-body text-sm font-bold tracking-[0.3em] uppercase">{t('newsletter.label')}</span>
            <h2 className="heading-display text-2xl md:text-4xl font-bold mt-2 mb-4">{t('newsletter.title')}</h2>
            <p className="font-body text-primary-foreground/60 mb-8">{t('newsletter.subtitle')}</p>
            <form onSubmit={(e) => { e.preventDefault(); setEmail(''); }} className="flex flex-col sm:flex-row gap-0">
              <input type="email" aria-label="Email address for newsletter" placeholder={t('newsletter.placeholder')} value={email} onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-4 py-3 sm:py-4 border border-primary-foreground/20 bg-primary-foreground/5 font-body text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-neon transition-colors rounded-sm sm:rounded-l-sm sm:rounded-r-none"
                required
              />
              <button type="submit" className="bg-neon text-accent-foreground px-6 py-3 sm:px-8 sm:py-4 font-body text-sm font-bold tracking-wider uppercase hover:bg-neon-glow transition-colors duration-300 rounded-sm sm:rounded-r-sm sm:rounded-l-none">
                {t('newsletter.subscribe')}
              </button>
            </form>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
