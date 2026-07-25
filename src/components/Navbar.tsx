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
  const [isCustomer, setIsCustomer] = useState(
    () => localStorage.getItem("role") === "customer",
  );

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
    <header className="fixed top-0 left-0 right-0 z-50 w-full transition-all duration-300">
      {/* Top Bar - Hides on Scroll */}
      <div
        className={`bg-[#0a0a0a] text-white/70 transition-all duration-300 overflow-hidden ${isScrolled ? "h-0 opacity-0" : "h-[35px] lg:h-[34px] opacity-100"}`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-full flex items-center justify-between text-[10px] lg:text-[11px] font-body tracking-wider uppercase font-semibold">
          {/* Mobile Marquee */}
          <div className="flex lg:hidden items-center w-full overflow-hidden relative">
            <div className="flex whitespace-nowrap animate-marquee">
              <span className="mx-4 flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-neon" />{" "}
                {s?.contact_phone || "+968 1234 5678"}
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-neon" />{" "}
                {s?.contact_email || "info@oman-carparts.com"}
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-neon" /> 100% GENUINE PARTS
              </span>
              <span className="mx-4 flex items-center gap-1.5">
                <Clock className="w-3 h-3 text-neon" /> 24/7 SUPPORT
              </span>
            </div>
          </div>

          {/* Desktop Left */}
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-2 hover:text-neon cursor-pointer transition-colors">
              <Phone className="w-[14px] h-[14px] text-neon" />{" "}
              {s?.contact_phone || "+968 1234 5678"}
            </span>
            <span className="flex items-center gap-2 hover:text-neon cursor-pointer transition-colors">
              <Mail className="w-[14px] h-[14px] text-neon" />{" "}
              {s?.contact_email || "info@oman-carparts.com"}
            </span>
          </div>
          {/* Desktop Right */}
          <div className="hidden lg:flex items-center gap-6">
            <span className="flex items-center gap-2">
              <Clock className="w-[14px] h-[14px] text-neon" /> 24/7 SUPPORT
            </span>
            <div className="w-px h-3 bg-white/20"></div>
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-[14px] h-[14px] text-neon" /> 100%
              GENUINE PARTS
            </span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav
        className={`bg-background/95 backdrop-blur-xl border-b border-border/40 transition-all duration-300 ${isScrolled ? "shadow-lg py-1" : "shadow-sm py-2"}`}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              {s?.logo_url ? (
                <img
                  src={s.logo_url}
                  alt={s?.site_name || "Logo"}
                  className={`w-auto object-contain transition-all duration-300 ${isScrolled ? "h-10 lg:h-12" : "h-12 lg:h-14"}`}
                />
              ) : (
                <div
                  className={`w-[150px] transition-all duration-300 ${isScrolled ? "h-10 lg:h-12" : "h-12 lg:h-14"}`}
                ></div>
              )}
            </Link>

            {/* Navigation Links - Centered */}
            <div className="hidden lg:flex items-center gap-8 font-body text-[18px] tracking-[0.1em] font-bold text-foreground/80 absolute left-1/2 -translate-x-1/2">
              <Link
                to="/"
                className="relative py-2 group transition-colors duration-300 hover:text-foreground"
              >
                {t("nav.home")}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>

              <Link
                to="/parts"
                className="relative py-2 group transition-colors duration-300 hover:text-foreground"
              >
                {t("nav.parts")}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                to="/about"
                className="relative py-2 group transition-colors duration-300 hover:text-foreground"
              >
                {t("footer.about")}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
              <Link
                to="/contact"
                className="relative py-2 group transition-colors duration-300 hover:text-foreground"
              >
                {t("footer.contact")}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-[2px] bg-neon transition-all duration-300 group-hover:w-full rounded-full"></span>
              </Link>
            </div>

            {/* Right Action Area */}
            <div className="flex items-center gap-3 lg:gap-4 shrink-0">
              {/* Expandable Search (Desktop) */}
              <div className="hidden md:block relative group">
                <form onSubmit={handleSearch} className="flex items-center">
                  <div className="relative flex items-center w-10 h-10 group-hover:w-64 transition-all duration-500 ease-out bg-secondary/50 hover:bg-secondary rounded-full overflow-hidden border border-transparent group-hover:border-border">
                    <div className="absolute left-0 w-10 h-10 flex items-center justify-center text-foreground z-10 pointer-events-none">
                      <Search className="w-[18px] h-[18px] text-muted-foreground group-hover:text-neon transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search parts..."
                      className="w-full h-full pl-10 pr-4 bg-transparent text-sm font-body outline-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 placeholder:text-muted-foreground"
                    />
                  </div>
                </form>
              </div>

              <Link
                to="/cart"
                aria-label="Shopping Cart"
                className="relative flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 text-foreground transition-all duration-300 hover:text-neon hover:bg-secondary"
              >
                <ShoppingCart className="w-[18px] h-[18px]" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-neon text-accent-foreground rounded-full text-[10px] flex items-center justify-center font-bold shadow-md shadow-neon/30 border-2 border-background animate-in zoom-in">
                    {cartCount}
                  </span>
                )}
              </Link>

              <LanguageSwitcher />

              <div className="hidden md:block w-px h-6 bg-border"></div>

              {user ? (
                <div className="hidden md:flex items-center gap-2 group cursor-pointer relative">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 hover:bg-secondary text-foreground transition-all duration-300 hover:text-neon">
                    <UserIcon className="w-[18px] h-[18px]" />
                  </div>
                  <div className="absolute top-full right-0 mt-2 w-48 bg-background border border-border shadow-xl rounded-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-2 z-50">
                    <div className="px-5 py-2 border-b border-border/40 mb-1">
                      <p className="font-body text-xs text-muted-foreground uppercase tracking-widest">
                        {user.user_metadata?.role === "dealer"
                          ? "Signed in as Dealer"
                          : "Signed in as"}
                      </p>
                      <p className="font-body font-bold text-sm truncate">
                        {user.user_metadata?.full_name || user.email || "User"}
                      </p>
                    </div>
                    {user.user_metadata?.role === "dealer" && (
                      <Link
                        to="/dealer/dashboard"
                        className="px-5 py-2.5 hover:bg-secondary/50 transition-colors text-[13px] font-body font-medium flex items-center gap-2 text-left w-full"
                      >
                        <ShieldCheck className="w-4 h-4" /> Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => signOut()}
                      className="px-5 py-2.5 hover:bg-red-50 text-red-500 transition-colors text-[13px] font-body font-medium flex items-center gap-2 text-left w-full"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                </div>
              ) : (
                (!isCustomer || location.pathname === "/") && (
                  <div className="hidden md:block relative group">
                    <button className="flex items-center justify-center px-5 py-2.5 rounded-full bg-foreground text-background hover:bg-foreground/90 hover:shadow-lg transition-all duration-300 font-body font-medium text-[13px] tracking-wide group/btn border border-transparent">
                      <UserIcon className="w-[14px] h-[14px] mr-2" />
                      <span>Sign In</span>
                      <ChevronDown className="w-3.5 h-3.5 ml-2 opacity-50 group-hover/btn:opacity-100 transition-opacity" />
                    </button>

                    <div className="absolute top-[calc(100%+8px)] right-0 w-[280px] bg-background/95 backdrop-blur-2xl border border-border/40 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 flex flex-col py-3 z-50 overflow-hidden transform translate-y-2 group-hover:translate-y-0">
                      <div className="px-5 py-2 mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-[0.2em]">
                          Select Account Type
                        </p>
                      </div>

                      <div className="px-2">
                        <button
                          onClick={() => {
                            localStorage.setItem("role", "customer");
                            setIsCustomer(true);
                            navigate("/parts");
                          }}
                          className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all duration-300 group/item"
                        >
                          <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center bg-background group-hover/item:border-primary/30 group-hover/item:shadow-sm transition-all duration-300">
                            <ShoppingCart className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-medium text-foreground group-hover/item:text-blue-600 transition-colors">
                              Retail Customer
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                              Shop at standard rates
                            </p>
                          </div>
                        </button>

                        <button
                          onClick={() => navigate("/dealer/register")}
                          className="flex items-center gap-4 w-full text-left px-4 py-3.5 rounded-xl hover:bg-muted/50 transition-all duration-300 group/item mt-1"
                        >
                          <div className="w-10 h-10 rounded-full border border-border/50 flex items-center justify-center bg-background group-hover/item:border-primary/30 group-hover/item:blue-600 transition-all duration-300">
                            <ShieldCheck className="w-[18px] h-[18px] text-muted-foreground group-hover/item:text-blue-600 transition-colors" />
                          </div>
                          <div className="flex-1">
                            <p className="text-[14px] font-medium text-foreground group-hover/item:text-blue-600 transition-colors">
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

              <button
                aria-label="Toggle mobile menu"
                className="lg:hidden flex items-center justify-center w-10 h-10 rounded-full bg-secondary/50 text-foreground transition-colors ml-1"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="w-[20px] h-[20px]" />
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
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
                onClick={() => setMobileOpen(false)}
              />

              {/* Side Drawer */}
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-0 right-0 w-[85%] max-w-sm h-[100dvh] bg-background/95 backdrop-blur-3xl shadow-2xl z-[70] lg:hidden flex flex-col border-l border-border/50"
              >
                {/* Header in Drawer */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 shrink-0">
                  <span className="font-heading font-bold  tracking-widest text-lg text-foreground">
                    Menu
                  </span>
                  <button
                    onClick={() => setMobileOpen(false)}
                    className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center hover:bg-secondary transition-colors shrink-0"
                  >
                    <X className="w-5 h-5 text-foreground" />
                  </button>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto px-6 py-2 flex flex-col">
                  <div className="flex flex-col font-body text-[16px] tracking-widest font-bold text-foreground">
                    <Link
                      to="/"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon transition-colors py-2.5 border-b border-border/40 flex items-center justify-between"
                    >
                      {t("nav.home")}
                    </Link>
                    <Link
                      to="/parts"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon transition-colors py-2.5 border-b border-border/40 flex items-center justify-between"
                    >
                      {t("nav.parts")}
                    </Link>
                    <Link
                      to="/about"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon transition-colors py-2.5 border-b border-border/40"
                    >
                      {t("footer.about")}
                    </Link>
                    <Link
                      to="/contact"
                      onClick={() => setMobileOpen(false)}
                      className="hover:text-neon transition-colors py-2.5 border-b border-border/40"
                    >
                      {t("footer.contact")}
                    </Link>

                    {user ? (
                      <div className="flex flex-col gap-2 mt-5">
                        {user.user_metadata?.role === "dealer" && (
                          <Link
                            to="/dealer/dashboard"
                            onClick={() => setMobileOpen(false)}
                            className="bg-secondary/50 text-foreground hover:bg-secondary px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold uppercase tracking-wider text-sm"
                          >
                            <ShieldCheck className="w-4 h-4" /> Dealer Dashboard
                          </Link>
                        )}
                        <button
                          onClick={() => {
                            signOut();
                            setMobileOpen(false);
                          }}
                          className="hover:bg-red-100 text-red-500 font-bold tracking-wider bg-red-50 rounded-xl transition-colors py-3 px-5 flex items-center justify-center gap-2 text-sm"
                        >
                          <LogOut className="w-4 h-4" /> Logout
                        </button>
                      </div>
                    ) : (
                      (!isCustomer || location.pathname === "/") && (
                        <div className="flex flex-col gap-2.5 mt-5">
                          <button
                            onClick={() => {
                              localStorage.setItem("role", "customer");
                              setIsCustomer(true);
                              setMobileOpen(false);
                              navigate("/parts");
                            }}
                            className="bg-secondary/50 text-foreground hover:bg-secondary px-4 py-3.5 rounded-xl border  transition-all flex items-center justify-center gap-2 font-bold tracking-wider text-sm"
                          >
                            <ShoppingCart className="w-4 h-4" /> Continue as
                            Customer
                          </button>
                          <button
                            onClick={() => {
                              setMobileOpen(false);
                              navigate("/dealer/register");
                            }}
                            className="bg-foreground text-background hover:bg-neon hover:text-accent-foreground px-4 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 font-bold tracking-wider shadow-lg text-sm"
                          >
                            <ShieldCheck className="w-4 h-4" /> Dealer
                            Registration
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
