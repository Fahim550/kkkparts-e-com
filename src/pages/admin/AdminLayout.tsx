import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSettings } from "@/hooks/useDatabase";
import {
  Activity,
  BarChart3,
  BookOpen,
  Car,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Database,
  FileText,
  FolderTree,
  Image,
  Landmark,
  Layers,
  LayoutDashboard,
  Library,
  LogOut,
  MapPin,
  Megaphone,
  Menu,
  MessageSquare,
  Monitor,
  MoreVertical,
  Package,
  Percent,
  Plus,
  Printer,
  Search,
  Settings,
  Settings2,
  ShoppingCart,
  Star,
  Tag,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  UserSearch
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const navCategories = [
  {
    title: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ]
  },
  {
    title: "Catalog",
    items: [
      { path: "/admin/products", label: "Products", icon: Package },
      { path: "/admin/categories", label: "Categories", icon: FolderTree },
      { path: "/admin/brands", label: "Brands", icon: Package },
      { path: "/admin/uoms", label: "UOMs", icon: Package },
      { path: "/admin/attributes", label: "Attributes", icon: Package },
    ]
  },
  {
    title: "Inventory",
    items: [
      { path: "/admin/warehouse/dashboard", label: "Warehouse Dashboard", icon: BarChart3 },
      { path: "/admin/warehouses", label: "Warehouses", icon: Package },
      { path: "/admin/warehouse-locations", label: "Warehouse Locations", icon: MapPin },
      { path: "/admin/stock-transfers", label: "Stock Transfers", icon: Activity },
      { path: "/admin/stock-ledger", label: "Stock Ledger", icon: Database },
      { path: "/admin/stock-adjustments", label: "Adjustments & Damage", icon: Settings2 },
      { path: "/admin/fifo-layers", label: "FIFO Cost Layers", icon: Layers },
    ]
  },
  {
    title: "Sales & POS",
    items: [
      { path: "/admin/pos", label: "Point of Sale", icon: Monitor },
      { path: "/admin/orders", label: "Customer Orders", icon: ShoppingCart },
      { path: "/admin/dealer-orders", label: "Dealer Orders", icon: ShoppingCart },
    ]
  },
  {
    title: "Purchases",
    items: [
      { path: "/admin/purchase-orders", label: "Purchase Orders", icon: ShoppingCart },
      { path: "/admin/goods-receive", label: "Goods Receive", icon: Package },
      { path: "/admin/supplier-due", label: "Supplier Due", icon: FileText },
      { path: "/admin/purchase-history", label: "Purchase History", icon: Activity },
    ]
  },
  {
    title: "Accounting & Finance",
    items: [
      { path: "/admin/accounting/coa", label: "Chart of Accounts", icon: Library },
      { path: "/admin/accounting/journals", label: "Journal Entries", icon: BookOpen },
      { path: "/admin/accounting/financials", label: "Financial Reports", icon: Landmark },
    ]
  },
  {
    title: "Reports & Analytics",
    items: [
      { path: "/admin/reports", label: "Dashboard KPIs", icon: TrendingUp },
      { path: "/admin/reports/sales", label: "Sales Report", icon: FileText },
      { path: "/admin/reports/inventory", label: "Inventory Report", icon: Package },
      { path: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { path: "/admin/visitor-analytics", label: "Visitor Tracker", icon: Activity },
    ]
  },
  {
    title: "People",
    items: [
      { path: "/admin/customers", label: "Customers", icon: Users },
      { path: "/admin/suppliers", label: "Suppliers", icon: Users },
      { path: "/admin/users", label: "Dealers Details", icon: UserCog },
      // { path: "/admin/job-applications", label: "Job Applications", icon: Briefcase },
    ]
  },
  {
    title: "Marketing & Pricing",
    items: [
      { path: "/admin/price-lists", label: "Price Lists", icon: Tag },
      { path: "/admin/discount-rules", label: "Discount Rules", icon: Percent },
      { path: "/admin/coupons", label: "Coupons", icon: Tag },
      { path: "/admin/marketing", label: "Marketing", icon: Megaphone },
      { path: "/admin/checkout-leads", label: "Checkout Leads", icon: UserSearch },
    ]
  },
  {
    title: "Storefront & Content",
    items: [
      { path: "/admin/banners", label: "Banners", icon: Image },
      { path: "/admin/pages", label: "Pages", icon: FileText },
      { path: "/admin/reviews", label: "Reviews", icon: Star },
      { path: "/admin/messages", label: "Messages", icon: MessageSquare },
      { path: "/admin/vehicle-data", label: "Vehicle Data", icon: Car },
    ]
  },
  {
    title: "System",
    items: [
      { path: "/admin/shipping", label: "Shipping Methods", icon: Truck },
      { path: "/admin/settings", label: "Settings", icon: Settings },
    ]
  }
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

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navCategories.forEach(cat => {
      const hasActive = cat.items.some(item => location.pathname === item.path || (!item.exact && location.pathname.startsWith(item.path)));
      if (hasActive) {
        initialState[cat.title] = true;
      }
    });
    if (Object.keys(initialState).length === 0) {
      initialState["Overview"] = true;
    }
    return initialState;
  });

  const toggleCategory = (categoryTitle: string) => {
    setOpenCategories(prev => ({
      ...prev,
      [categoryTitle]: !prev[categoryTitle]
    }));
  };

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
      <nav className="flex-1 py-4 px-2 overflow-y-auto space-y-4">
        {navCategories.map((category, index) => {
          const isOpen = openCategories[category.title];
          const isCollapsed = !isMobile && collapsed;
          
          return (
            <div key={category.title} className="space-y-1">
              {!isCollapsed && (
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider hover:text-sidebar-foreground transition-colors group"
                >
                  <span className="group-hover:text-sidebar-primary transition-colors">{category.title}</span>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
              
              {(isOpen || isCollapsed) && (
                <div className="space-y-1">
                  {category.items.map((item) => {
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
                </div>
              )}
              
              {isCollapsed && index < navCategories.length - 1 && (
                <div className="my-3 border-b border-sidebar-border/30 w-8 mx-auto" />
              )}
            </div>
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
        className={`flex-1 ${collapsed ? "ml-16" : "ml-64"} transition-all duration-300 flex flex-col`}
      >
        <header className="h-16 border-b border-gray-400 bg-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex-1 flex items-center">
            <div className="relative w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search Transactions"
                className="pl-9 bg-secondary/50 border-gray-700 rounded-full h-9 shadow-none text-sm focus-visible:ring-1"
              />
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Link to="/admin/sales/new">
              <Button className="bg-red-500 hover:bg-red-600 text-white rounded-full h-9 px-4 font-semibold shadow-sm">
                + Add Sale
              </Button>
            </Link>
            <Link to="/admin/purchases/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-4 font-semibold shadow-sm">
                + Add Purchase
              </Button>
            </Link>
            <Button variant="ghost" size="icon" className="rounded-full bg-secondary/50 h-9 w-9 text-primary">
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground">
              <Printer className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 text-muted-foreground">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="p-6 lg:p-8 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
