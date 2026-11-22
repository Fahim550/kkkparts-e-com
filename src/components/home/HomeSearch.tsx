import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ArrowRight, ChevronRight } from "lucide-react";
import DirhamIcon from "@/components/DirhamIcon";

export interface SearchProductItem {
  id: string;
  name: string;
  brand: string;
  itemCode?: string;
  price: number;
  originalPrice?: number;
  dealerPrice?: number;
  category: string;
  categoryName?: string;
  image: string;
  stock: number;
  description?: string;
}

interface HomeSearchProps {
  products: SearchProductItem[];
  isDealer: boolean;
}

export const HomeSearch = ({ products, isDealer }: HomeSearchProps) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const searchTerms = q.split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      const name = (p.name || "").toLowerCase();
      const brand = (p.brand || "").toLowerCase();
      const cat = (p.categoryName || p.category || "").toLowerCase();
      const code = (p.itemCode || "").toLowerCase();
      const desc = (p.description || "").toLowerCase();
      const combined = `${name} ${brand} ${cat} ${code} ${desc}`;
      return searchTerms.every((term) => combined.includes(term));
    });
  }, [products, searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearchOpen(false);
    if (searchQuery.trim()) {
      navigate(`/parts?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate(`/parts`);
    }
  };

  return (
    <section className="relative z-30 -mt-6 sm:-mt-8 mb-4 px-4 sm:px-6 flex justify-center">
      <motion.div
        ref={searchContainerRef}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="relative w-full max-w-3xl mx-auto"
      >
        {/* Main Search Bar Form */}
        <form
          onSubmit={handleSearchSubmit}
          className="flex items-center w-full bg-card/95 backdrop-blur-xl border-2 border-border/70 hover:border-neon/40 focus-within:border-neon focus-within:ring-4 focus-within:ring-neon/15 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_45px_rgba(0,0,0,0.12)] transition-all p-1.5 sm:p-2"
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-neon/10 flex items-center justify-center shrink-0 ml-1 text-neon">
            <Search className="w-5 h-5" />
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => {
              if (searchQuery.trim()) setIsSearchOpen(true);
            }}
            placeholder="Search for parts by name, brand, or OEM number..."
            className="w-full h-11 sm:h-12 pl-3 sm:pl-4 pr-3 bg-transparent text-foreground placeholder:text-muted-foreground/60 focus:outline-none text-sm sm:text-base font-body"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setIsSearchOpen(false);
              }}
              className="p-2 mr-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 rounded-full hover:bg-muted"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          <button
            type="submit"
            aria-label="Search"
            className="flex items-center justify-center px-5 sm:px-8 h-10 sm:h-12 bg-neon hover:bg-neon-glow text-white transition-all shrink-0 cursor-pointer font-bold tracking-wider sm:tracking-widest uppercase rounded-full shadow-md hover:-translate-y-0.5 text-xs sm:text-sm"
          >
            Search
          </button>
        </form>

        {/* Instant Search Dropdown */}
        <AnimatePresence>
          {isSearchOpen && searchQuery.trim().length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 right-0 mt-2.5 bg-card/95 backdrop-blur-2xl rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.18)] border border-border/80 overflow-hidden z-50 divide-y divide-border/60"
            >
              {/* Header bar */}
              <div className="px-4 py-2.5 bg-muted/30 flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  Matching parts for{" "}
                  <span className="font-semibold text-foreground">
                    "{searchQuery.trim()}"
                  </span>
                </span>
                <span className="font-medium">
                  {searchResults.length} result
                  {searchResults.length === 1 ? "" : "s"}
                </span>
              </div>

              {/* Results list */}
              {searchResults.length > 0 ? (
                <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
                  {searchResults.slice(0, 6).map((product) => {
                    const activePrice =
                      isDealer && product.dealerPrice != null
                        ? Number(product.dealerPrice)
                        : Number(product.price);

                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          setIsSearchOpen(false);
                          navigate(`/product/${product.id}`);
                        }}
                        className="flex items-center gap-3.5 p-3 hover:bg-muted/50 cursor-pointer transition-colors group"
                      >
                        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-white border border-border/60 shrink-0 overflow-hidden flex items-center justify-center p-1 group-hover:border-neon/40 transition-colors shadow-sm">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full max-w-full max-h-full object-contain group-hover:scale-105 transition-transform"
                            loading="lazy"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            {product.brand && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {product.brand}
                              </span>
                            )}
                            {product.itemCode && (
                              <span className="text-[10px] font-mono text-muted-foreground truncate max-w-[110px] sm:max-w-[180px]">
                                OEM: {product.itemCode}
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-medium text-foreground group-hover:text-neon transition-colors truncate">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                              <DirhamIcon />
                              <span>{activePrice.toFixed(2)}</span>
                            </span>
                            {product.originalPrice &&
                              product.originalPrice > activePrice && (
                                <span className="text-[11px] text-muted-foreground line-through">
                                  {Number(product.originalPrice).toFixed(2)}
                                </span>
                              )}
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0 pl-1 sm:pl-2">
                          <span
                            className={`text-[9px] sm:text-[10px] font-medium px-1.5 sm:px-2 py-0.5 rounded-full ${
                              product.stock > 0
                                ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                            }`}
                          >
                            {product.stock > 0 ? "In Stock" : "Out of Stock"}
                          </span>
                          <span className="text-muted-foreground group-hover:text-neon group-hover:translate-x-0.5 transition-all text-xs flex items-center gap-0.5">
                            <span className="hidden sm:inline">View</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <Search className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-foreground">
                    No matching parts found
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    We couldn't find any parts matching "{searchQuery}". Try
                    searching by part name, brand, or OEM number.
                  </p>
                </div>
              )}

              {/* Footer link to full shop */}
              <div className="p-2.5 bg-muted/20 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    navigate(
                      `/parts?search=${encodeURIComponent(searchQuery.trim())}`,
                    );
                  }}
                  className="w-full py-2 text-xs font-semibold text-neon hover:text-neon-glow hover:bg-neon/10 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>
                    {searchResults.length > 0
                      ? `View all ${searchResults.length} results in parts shop`
                      : "Browse all parts in catalog"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  );
};

export default HomeSearch;
