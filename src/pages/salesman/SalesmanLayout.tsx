import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Store,
  ShoppingCart,
  Users,
  Building2,
  LogOut,
  Menu,
  X,
  UserCheck,
  LayoutDashboard,
  Monitor,
  BadgeDollarSign,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSettings } from "@/hooks/useDatabase";
import { FieldOrderDialog } from "@/components/admin/FieldOrderDialog";

interface SalesmanLayoutProps {
  children?: React.ReactNode;
}

export const SalesmanLayout: React.FC<SalesmanLayoutProps> = ({ children }) => {
  const { user, signOut, isSalesman, isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const logoUrl = s?.logo_url || "/logo.png";
  const siteName = s?.site_name || "Oman Auto Parts";

  const handleLogout = async () => {
    await signOut();
    navigate("/admin/login");
  };

  const currentRepName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Sales Representative";

  const navLinks = [
    {
      path: "/salesman/dashboard",
      label: "My Dashboard",
      icon: LayoutDashboard,
    },
    {
      path: "/salesman/receivables",
      label: "Shop Dues & Ledgers",
      icon: Users,
    },
    {
      path: "/salesman/orders",
      label: "Field Orders",
      icon: ShoppingCart,
    },
    {
      path: "/salesman/shops",
      label: "Shops & Dealers",
      icon: Store,
    },
    {
      path: "/salesman/pos",
      label: "Point of Sale",
      icon: Monitor,
    },
  ];

  const isActive = (path: string) =>
    location.pathname === path ||
    (path !== "/salesman" &&
      path !== "/salesman/dashboard" &&
      location.pathname.startsWith(path + "/"));

  return (
    <div className="min-h-screen bg-slate-50 font-body flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Logo & Portal Brand */}
          <div className="flex items-center gap-3">
            <Link to="/salesman/dashboard" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-sm font-black text-lg">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                  {siteName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                  Field Representative Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                    active
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right Header Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Field Order CTA */}
            <div className="hidden sm:block">
              <FieldOrderDialog
                trigger={
                  <Button
                    size="sm"
                    className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 shadow-sm"
                  >
                    <Store className="w-3.5 h-3.5" />
                    <span>Take Field Order</span>
                  </Button>
                }
              />
            </div>

            {/* Rep Identity Pill */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium text-slate-200 truncate max-w-[130px]">
                {currentRepName}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-bold bg-blue-500/20 text-blue-300">
                Rep
              </span>
            </div>

            {/* Logout */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-9 gap-1.5 px-2.5"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>

            {/* Mobile Hamburger */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden text-slate-300 hover:text-white hover:bg-slate-800 h-9 w-9"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-900 px-4 py-3 space-y-2">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800 text-xs text-slate-200 mb-2">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span>Signed in as: <strong className="text-white">{currentRepName}</strong></span>
            </div>

            <div className="pt-1">
              <FieldOrderDialog
                trigger={
                  <Button className="w-full gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-10 shadow-sm mb-2">
                    <Store className="w-4 h-4" />
                    <span>Take Shop Order (Field)</span>
                  </Button>
                }
              />
            </div>

            {navLinks.map((item) => {
              const active = isActive(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-300 hover:text-white hover:bg-slate-800"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  );
};

export default SalesmanLayout;
