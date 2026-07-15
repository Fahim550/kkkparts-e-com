import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Tag,
  Image,
  Settings,
  Users,
  BarChart3,
  ChevronLeft,
  Menu,
  Megaphone,
  LogOut,
  FolderTree,
  UserSearch,
  Activity,
  Truck,
  MessageSquare,
  FileText,
  X,
  Star,
  UserCog,
  Briefcase,
  Car,
  MapPin,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSettings } from "@/hooks/useDatabase";
import { useIsMobile } from "@/hooks/use-mobile";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/products", label: "Products", icon: Package },
  { path: "/admin/categories", label: "Categories", icon: FolderTree },
  { path: "/admin/brands", label: "Brands", icon: Package },
  { path: "/admin/uoms", label: "UOMs", icon: Package },
  { path: "/admin/attributes", label: "Attributes", icon: Package },
  {
    path: "/admin/warehouse/dashboard",
    label: "Warehouse Dashboard",
    icon: BarChart3,
  },
  { path: "/admin/warehouses", label: "Warehouses", icon: Package },
  {
    path: "/admin/warehouse-locations",
    label: "Warehouse Locations",
    icon: MapPin,
  },
  { path: "/admin/stock-transfers", label: "Stock Transfers", icon: Activity },
  { path: "/admin/suppliers", label: "Suppliers", icon: Users },
  { path: "/admin/vehicle-data", label: "Vehicle Data", icon: Car },
  { path: "/admin/orders", label: "Customer Orders", icon: ShoppingCart },
  { path: "/admin/dealer-orders", label: "Dealer Orders", icon: ShoppingCart },
  { path: "/admin/coupons", label: "Coupons", icon: Tag },
  { path: "/admin/checkout-leads", label: "Checkout Leads", icon: UserSearch },
  {
    path: "/admin/job-applications",
    label: "Job Applications",
    icon: Briefcase,
  },
  { path: "/admin/messages", label: "Messages", icon: MessageSquare },
  { path: "/admin/banners", label: "Banners", icon: Image },
  { path: "/admin/reviews", label: "Reviews", icon: Star },
  { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  {
    path: "/admin/visitor-analytics",
    label: "Visitor Tracker",
    icon: Activity,
  },
  { path: "/admin/customers", label: "Customers", icon: Users },
  { path: "/admin/users", label: "Dealers Details", icon: UserCog },
  { path: "/admin/marketing", label: "Marketing", icon: Megaphone },
  { path: "/admin/shipping", label: "Shipping Methods", icon: Truck },
  { path: "/admin/pages", label: "Pages", icon: FileText },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAdminAuth();
  const isMobile = useIsMobile();
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const logoUrl = s?.logo_url || "/logo.png";
  const siteName = s?.site_name || "Admin";

  useEffect(() => {
    if (s?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = s.favicon_url;
    }
    if (s?.site_name) {
      document.title = `${s.site_name} - Admin Dashboard`;
    }
  }, [s?.favicon_url, s?.site_name]);

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  const sidebarContent = (
    <>
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.path, item.exact);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm transition-all ${
                active
                  ? "bg-sidebar-primary/15 text-sidebar-primary border-l-2 border-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              }`}
              title={!isMobile && collapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              {(isMobile || !collapsed) && (
                <span className="font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-sidebar-border space-y-1">
        {(isMobile || !collapsed) && user && (
          <div className="px-3 py-2">
            <p className="font-body text-xs text-sidebar-foreground/40 truncate">
              {user.email}
            </p>
          </div>
        )}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm text-sidebar-foreground/60 hover:text-destructive transition-colors w-full"
          title={!isMobile && collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {(isMobile || !collapsed) && <span>Logout</span>}
        </button>
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2.5 rounded-md font-body text-sm text-sidebar-foreground/60 hover:text-sidebar-primary transition-colors"
        >
          <ChevronLeft className="w-5 h-5 shrink-0" />
          {(isMobile || !collapsed) && <span>Back to Store</span>}
        </Link>
      </div>
    </>
  );

  if (isMobile) {
    return (
      <div className="min-h-screen bg-secondary/30 notranslate">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-30 bg-sidebar border-b border-sidebar-border h-14 flex items-center justify-between px-4">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground"
          >
            <Menu className="w-6 h-6" />
          </button>
          <Link to="/admin" className="flex items-center gap-2">
            <img
              src={logoUrl}
              alt={siteName}
              className="h-8 w-auto brightness-0 invert object-contain"
            />
            <span className="text-xs text-sidebar-foreground/60 font-body">
              {siteName} Admin
            </span>
          </Link>
          <div className="w-6" />
        </div>

        {/* Mobile sheet sidebar */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent
            side="left"
            className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col"
          >
            <SheetTitle className="sr-only">Admin Navigation</SheetTitle>
            <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
              <Link
                to="/admin"
                className="flex items-center gap-2"
                onClick={() => setMobileOpen(false)}
              >
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-8 w-auto brightness-0 invert object-contain"
                />
                <span className="text-xs text-sidebar-foreground/60 font-body">
                  {siteName} Admin
                </span>
              </Link>
            </div>
            {sidebarContent}
          </SheetContent>
        </Sheet>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30 flex notranslate">
      <aside
        className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 fixed h-full z-40`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2">
              <img
                src={logoUrl}
                alt={siteName}
                className="h-10 w-auto brightness-0 invert object-contain"
              />
              <span className="text-xs text-sidebar-foreground/60 font-body font-normal">
                {siteName} Admin
              </span>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          >
            {collapsed ? (
              <Menu className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        {sidebarContent}
      </aside>

      <main
        className={`flex-1 ${collapsed ? "ml-16" : "ml-64"} transition-all duration-300`}
      >
        <div className="p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
