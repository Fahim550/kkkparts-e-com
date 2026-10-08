import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useActiveCategories } from "@/hooks/useCategories";
import { useSettings } from "@/hooks/useDatabase";
import {
  ChevronDown,
  Clock,
  LogOut,
  Mail,
  Menu,
  Phone,
  Search,
  ShieldCheck,
  ShoppingCart,
  User as UserIcon,
  X
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { AnimatePresence, motion } from "framer-motion";
import LanguageSwitcher from "./LanguageSwitcher";

const Navbar = () => {
  const { cartCount } = useCart();
  const { data: categories = [] } = useActiveCategories();
  const { t } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: settings } = useSettings();
  const { user, signOut } = useAuth();
  const [isCustomer, setIsCustomer] = useState(() => {
    try {
      return localStorage.getItem("role") === "customer";
    } catch {
      return false;
    }
  });

  const navigate = useNavigate();
  const location = useLocation();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};

  const topCategories = categories
    .filter((c) => !c.parent_id && c.name.toLowerCase() !== "parts")
    .slice(0, 3);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/parts?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300 font-body">
      {/* Top Bar - Hides on Scroll */}
      <div
        className={`bg-slate-900 text-slate-300 transition-all duration-300 overflow-hidden ${isScrolled ? "h-0 opacity-0" : "h-[36px] opacity-100"}`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-full flex items-center justify-between text-[11px] font-semibold tracking-wide">
          {/* Mobile Marquee */}
          <div className="flex lg:hidden items-center w-full overflow-hidden relative">
            <div className="flex whitespace-nowrap animate-marquee">
              <span className="mx-4 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-neon" />{" "}
                {s?.contact_phone || "+968 1234 5678"}
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-neon" />{" "}
                {s?.contact_email || "info@oman-carparts.com"}
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-neon" /> 100% Genuine Parts
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-neon" /> 24/7 Support
              </span>
            </div>
          </div>

          {/* Desktop Left */}
          <div className="hidden lg:flex items-center gap-6">
            <a href={`tel:${s?.contact_phone || ""}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-3.5 h-3.5 text-neon" />{" "}
              {s?.contact_phone || "+968 1234 5678"}
            </a>
            <a href={`mailto:${s?.contact_email || ""}`} className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-3.5 h-3.5 text-neon" />{" "}
              {s?.contact_email || "info@oman-carparts.com"}
            </a>
          </div>
          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-neon" /> 24/7 Support
            </span>
            <div className="w-px h-3 bg-slate-700"></div>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-neon" /> 100% Genuine Parts
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`bg-background/90 backdrop-blur-lg border-b border-border/50 transition-all duration-300 py-3.5 ${isScrolled ? "shadow-md" : "shadow-sm"}`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center shrink-0">
              {s?.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={s?.site_name || "Logo"}
                  className="w-auto object-contain transition-all duration-300 h-10 lg:h-12"
                />
              ) : (
                <span className="font-heading text-xl lg:text-2xl font-bold uppercase tracking-wider text-foreground">
                  {s?.site_name || "KKK PARTS"}
                </span>
              )}
            </Link>

            {/* Navigation Links - Centered */}
            <div className="hidden lg:flex items-center gap-8 font-bold text-[16px] capitalize text-foreground/80 absolute left-1/2 -translate-x-1/2">
              <Link
                to="/"
                className="relative py-1 group transition-colors duration-300 hover:text-neon"
              >
                {t("nav.home") || "Home"}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                to="/parts"
                className="relative py-1 group transition-colors duration-300 hover:text-neon"
              >
                {t("nav.parts") || "Shop"}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                to="/about"
                className="relative py-1 group transition-colors duration-300 hover:text-neon"
              >
                {t("footer.about") || "About Us"}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                to="/contact"
                className="relative py-1 group transition-colors duration-300 hover:text-neon"
              >
                {t("footer.contact") || "Contact"}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            </div>

            {/* Right Action Area */}
            <div className="flex items-center gap-1.5 lg:gap-3 shrink-0">
              {/* Expandable Search (Desktop) */}
              <div className="hidden lg:block relative group">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative flex items-center w-10 h-10 group-hover:w-64 transition-all duration-500 ease-out bg-muted/50 hover:bg-muted rounded-full overflow-hidden border border-transparent group-hover:border-border">
                    <div className="absolute left-0 w-10 h-10 flex items-center justify-center text-muted-foreground z-10 pointer-events-none group-hover:text-neon transition-colors">
                      <Search className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parts..."
                      className="w-full h-full pl-10 pr-4 bg-transparent text-sm outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 placeholder:text-muted-foreground"
                    />
                  </div>
                </form>
              </div>

              <LanguageSwitcher />

              <Link
                to="/cart"
                aria-label="Shopping Cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-foreground/80 hover:text-neon hover:bg-muted transition-all duration-300"
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-neon text-white rounded-full text-[9px] flex items-center justify-center font-bold shadow-sm shadow-neon/40 border-[1.5px] border-background animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Link>

              <div className="hidden md:block w-px h-5 bg-border mx-1"></div>

              {user ? (
                <div className="hidden md:flex items-center gap-2 group cursor-pointer relative">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full text-foreground/80 hover:bg-muted hover:text-neon transition-all duration-300">
                    <UserIcon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="absolute top-full right-0 mt-3 w-56 bg-background/95 backdrop-blur-xl border border-border/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-2 z-50 transform translate-y-2 group-hover:translate-y-0">
                    <div className="px-5 py-3 border-b border-border/30 mb-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">
                        {user.user_metadata?.role === "dealer"
                          ? "Signed in as Dealer"
                          : "Signed in as"}
                      </p>
                      <p className="font-semibold text-sm truncate text-foreground">
                        {user.user_metadata?.full_name || user.email || "User"}
                      </p>
                    </div>
                    {user.user_metadata?.role === "dealer" && (
                      <Link
                        to="/dealer/dashboard"
                        className="px-5 py-2.5 hover:bg-neon/5 hover:text-neon transition-colors text-[13px] font-medium flex items-center gap-2.5 w-full"
                      >
                        <ShieldCheck className="w-4 h-4" /> Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="px-5 py-2.5 hover:bg-red-50 text-red-500 transition-colors text-[13px] font-medium flex items-center gap-2.5 text-left w-full"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                (!isCustomer || location.pathname === "/") && (
                  <div className="hidden md:block relative group ml-1">
                    <button className="flex items-center justify-center px-4 py-2 rounded-full bg-neon text-white hover:bg-blue-600 hover:shadow-lg hover:shadow-neon/20 transition-all duration-300 font-semibold text-[13px] group/btn">
                      <UserIcon className="w-3.5 h-3.5 mr-1.5" />
                      <span>Sign In</span>
                      <ChevronDown className="w-3.5 h-3.5 ml-1 opacity-70 group-hover/btn:opacity-100 transition-opacity" />
                    </button>

                    <div className="absolute top-[calc(100%+12px)] right-0 w-[280px] bg-background/95 backdrop-blur-xl border border-border/50 shadow-[0_10px_40px_rgba(0,0,0,0.08)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-3 z-50 overflow-hidden transform translate-y-2 group-hover:translate-y-0">
                      <div className="px-5 py-2.5 mb-1 border-b border-border/30">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
                          Select Account Type
                        </p>
                      </div>

                      <div className="px-2 pt-2">
                        <button
                          onClick={() => {
                            localStorage.setItem("role", "customer");
                            setIsCustomer(true);
                            navigate("/parts");
                          }}
                          className="flex items-center gap-3.5 w-full text-left px-3 py-3 rounded-xl hover:bg-muted transition-all duration-300 group/item"
                        >
                          <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-background group-hover/item:border-neon/30 transition-all duration-300">
                            <ShoppingCart className="w-4 h-4 text-muted-foreground group-hover/item:text-neon transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold text-foreground group-hover/item:text-neon transition-colors">
                              Retail Customer
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Shop at standard rates
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => navigate("/dealer/register")}
                          className="flex items-center gap-3.5 w-full text-left px-3 py-3 rounded-xl hover:bg-muted transition-all duration-300 group/item mt-1"
                        >
                          <div className="w-9 h-9 rounded-full border border-border flex items-center justify-center bg-background group-hover/item:border-neon/30 transition-all duration-300">
                            <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover/item:text-neon transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[13px] font-semibold text-foreground group-hover/item:text-neon transition-colors">
                              Wholesale Dealer
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Access B2B pricing portal
                            </p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              )}

              {/* Mobile Menu Toggle */}
              <button
                aria-label="Toggle mobile menu"
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full text-foreground hover:bg-muted transition-colors ml-1"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Side Drawer */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] lg:hidden"
                onClick={() => setMobileOpen(false)}
              />

              {/* Side Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-0 right-0 w-[85%] max-w-sm h-[100dvh] bg-background shadow-2xl z-[70] lg:hidden flex flex-col border-l border-border"
              >
                {/* Header in Drawer */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                  <span className="font-heading font-bold text-lg text-foreground uppercase tracking-wider">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4 text-foreground" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col">
                  {/* Mobile Search */}
                  <form onSubmit={handleSearch} className="mb-6 relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parts..."
                      className="w-full bg-muted rounded-xl pl-9 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-neon/50 transition-all"
                    />
                  </form>

                  <div className="flex flex-col font-semibold text-sm text-foreground space-y-1">
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon hover:bg-neon/5 rounded-xl transition-colors py-3 px-3 flex items-center justify-between"
                    >
                      {t("nav.home") || "Home"}
                    </Link>
                    <Link
                      to="/parts"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon hover:bg-neon/5 rounded-xl transition-colors py-3 px-3 flex items-center justify-between"
                    >
                      {t("nav.parts") || "Shop Parts"}
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon hover:bg-neon/5 rounded-xl transition-colors py-3 px-3"
                    >
                      {t("footer.about") || "About Us"}
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon hover:bg-neon/5 rounded-xl transition-colors py-3 px-3"
                    >
                      {t("footer.contact") || "Contact"}
                    </Link>

                    {user ? (
                      <div className="flex flex-col gap-2 mt-6 border-t border-border pt-6">
                        {user.user_metadata?.role === "dealer" && (
                          <Link
                            to="/dealer/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="bg-muted text-foreground hover:bg-neon hover:text-white px-4 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-wider"
                          >
                            <ShieldCheck className="w-4 h-4" /> Dealer Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            signOut();
                            setMobileOpen(false);
                          }}
                          className="hover:bg-red-50 text-red-500 font-bold bg-muted/50 rounded-xl transition-colors py-3 px-4 flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    ) : (
                      (!isCustomer || location.pathname === "/") && (
                        <div className="flex flex-col gap-3 mt-6 border-t border-border pt-6">
                          <button
                            onClick={() => {
                              localStorage.setItem("role", "customer");
                              setIsCustomer(true);
                              setMobileOpen(false);
                              navigate("/parts");
                            }}
                            className="bg-muted text-foreground hover:bg-muted/80 px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold text-sm"
                          >
                            <ShoppingCart className="w-4 h-4" /> Continue as Customer
                          </button>
                          <button
                            onClick={() => {
                              setMobileOpen(false);
                              navigate("/dealer/register");
                            }}
                            className="bg-neon text-white hover:bg-blue-600 px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 font-semibold shadow-md text-sm"
                          >
                            <ShieldCheck className="w-4 h-4" /> Dealer Registration
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};

export default Navbar;
