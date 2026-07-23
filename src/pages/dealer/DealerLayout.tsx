import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import {
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  LogOut,
  Menu,
  Package,
  ShieldCheck,
  ShoppingCart,
  User as UserIcon,
  X
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

interface DealerLayoutProps {
  children?: React.ReactNode;
}

const DealerLayout: React.FC<DealerLayoutProps> = ({ children }) => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      navigate("/dealer/login");
      return;
    }

    const fetchProfile = async () => {
      let { data } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!data && user.user_metadata) {
        data = {
          id: user.id,
          full_name: user.user_metadata.full_name || user.email,
          email: user.email,
          phone: user.user_metadata.phone,
          sponsored_details: user.user_metadata.sponsored_details,
          area: user.user_metadata.area,
          license_number: user.user_metadata.license_number,
          is_approved: user.user_metadata.is_approved ?? false,
          created_at: user.created_at,
        };
      }
      setProfile(data);
      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/dealer/login");
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  const navItems = [
    {
      path: "/dealer/dashboard",
      label: "Wholesale Catalog",
      icon: Package,
    },
    {
      path: "/dealer/orders",
      label: "My Orders",
      icon: ShoppingCart,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row font-body">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white shrink-0 min-h-screen border-r border-slate-800 sticky top-0 h-screen overflow-y-auto">
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold border border-primary/30">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-heading font-extrabold uppercase tracking-wider text-base text-white">
              Dealer Portal
            </h2>
            <p className="text-xs text-slate-400">Wholesale Dashboard</p>
          </div>
        </div>

        {/* Profile Brief */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
              {profile?.profile_image ? (
                <img
                  src={profile.profile_image}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <UserIcon className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-white truncate">
                {profile?.full_name || "Dealer User"}
              </h4>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                    profile?.is_approved
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  }`}
                >
                  {profile?.is_approved ? (
                    <>
                      <ShieldCheck className="w-3 h-3" /> Approved Dealer
                    </>
                  ) : (
                    <>
                      <Clock className="w-3 h-3" /> Approval Pending
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1.5">
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            Main Menu
          </p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 font-bold"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="w-4 h-4 opacity-70" />}
              </Link>
            );
          })}

          <div className="pt-6">
            <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Storefront
            </p>
            <Link
              to="/parts"
              className="flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <ExternalLink className="w-5 h-5 text-slate-400" />
                <span>Shop Front</span>
              </div>
            </Link>
            <Link
              to="/cart"
              className="flex items-center justify-between px-3.5 py-3 rounded-xl font-medium text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <div className="flex items-center gap-3">
                <ShoppingCart className="w-5 h-5 text-slate-400" />
                <span>My Cart</span>
              </div>
              {cartCount > 0 && (
                <span className="bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3.5 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Body */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header - Mobile & Desktop */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 px-4 sm:px-8 py-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg border border-gray-200"
            >
              {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <div>
              <h1 className="font-heading text-lg sm:text-xl font-bold uppercase tracking-wider text-gray-900">
                {location.pathname === "/dealer/orders"
                  ? "Order History"
                  : "Wholesale Product Catalog"}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Welcome back, {profile?.full_name || "Dealer User"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/cart"
              className="relative flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Cart</span>
              {cartCount > 0 && (
                <span className="bg-primary text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 text-gray-500 hover:text-red-600 px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="lg:hidden bg-slate-900 text-white p-4 border-b border-slate-800 space-y-2">
            <div className="p-3 bg-slate-950 rounded-xl mb-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-white">{profile?.full_name}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  profile?.is_approved
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-amber-500/20 text-amber-400"
                }`}
              >
                {profile?.is_approved ? "Approved" : "Pending"}
              </span>
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm ${
                    isActive ? "bg-primary text-white" : "text-slate-300"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <Link
              to="/parts"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm text-slate-300"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Shop Storefront</span>
            </Link>
          </div>
        )}

        {/* Banner Alert for Pending Approval */}
        {!profile?.is_approved && !loading && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3.5 text-amber-900 flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs sm:text-sm font-body">
              <strong>Account Approval Pending:</strong> An admin is reviewing your wholesale registration. In the meantime, you can browse products and place regular orders. Once approved, exclusive wholesale prices will be unlocked!
            </div>
          </div>
        )}

        {/* Content Outlet */}
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DealerLayout;
