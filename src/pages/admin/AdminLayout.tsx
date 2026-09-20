import AdminGlobalSearch from "@/components/admin/AdminGlobalSearch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  ChevronsUpDown,
  Database,
  ExternalLink,
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
  Settings,
  Settings2,
  ShoppingCart,
  Star,
  Store,
  Tag,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  UserSearch
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

const AUTO_COLLAPSE_ROUTES = [
  "/admin/sales/new",
  "/admin/purchases/new",
  "/admin/purchase/new",
  "/admin/pos/terminal"
];

const isAutoCollapseRoute = (pathname: string) => {
  return AUTO_COLLAPSE_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );
};

const navCategories = [
  {
    title: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { path: "/admin/receivable-parties", label: "Receivables", icon: Users, exact: false },
      { path: "/admin/payable-parties", label: "Payables", icon: Truck, exact: false },
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
      { path: "/admin/payable-parties", label: "Supplier Due", icon: FileText },
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
      { path: "/admin/reports", label: "Dashboard KPIs", icon: TrendingUp, exact: true },
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

const isPathActive = (currentPath: string, path: string, exact?: boolean) => {
  if (exact) {
    return currentPath === path;
  }
  if (currentPath === path) return true;
  if (currentPath.startsWith(path + "/")) {
    const hasMoreSpecificMatch = navCategories.some(cat =>
      cat.items.some(otherItem =>
        otherItem.path !== path &&
        otherItem.path.startsWith(path) &&
        (currentPath === otherItem.path || currentPath.startsWith(otherItem.path + "/"))
      )
    );
    return !hasMoreSpecificMatch;
  }
  return false;
};

const AdminLayout = () => {
  const location = useLocation();
  const prevPathnameRef = useRef(location.pathname);
  const userPrefCollapsedRef = useRef(false);

  const [collapsed, setCollapsed] = useState(() => {
    return isAutoCollapseRoute(window.location.pathname);
  });
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAdminAuth();
  const isMobile = useIsMobile();
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const logoUrl = s?.logo_url || "/logo.png";
  const siteName = s?.site_name || "Admin";

  const toggleSidebar = () => {
    setCollapsed(prev => {
      const next = !prev;
      if (!isAutoCollapseRoute(location.pathname)) {
        userPrefCollapsedRef.current = next;
      }
      return next;
    });
  };

  // Auto collapse sidebar when opening new sales or new purchase pages (desktop app behavior)
  useEffect(() => {
    const currentIsAuto = isAutoCollapseRoute(location.pathname);
    const prevIsAuto = isAutoCollapseRoute(prevPathnameRef.current);

    if (currentIsAuto) {
      setCollapsed(true);
    } else if (prevIsAuto && !currentIsAuto) {
      // Restore user's previous preference when navigating away
      setCollapsed(userPrefCollapsedRef.current);
    }

    prevPathnameRef.current = location.pathname;
  }, [location.pathname]);

  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navCategories.forEach(cat => {
      const hasActive = cat.items.some(item => isPathActive(location.pathname, item.path, item.exact));
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

  const isActive = (path: string, exact?: boolean) => {
    return isPathActive(location.pathname, path, exact);
  };

  // Auto-expand category containing the active item when route changes or redirects
  useEffect(() => {
    navCategories.forEach(cat => {
      const hasActive = cat.items.some(item => isPathActive(location.pathname, item.path, item.exact));
      if (hasActive) {
        setOpenCategories(prev => {
          if (prev[cat.title]) return prev;
          return {
            ...prev,
            [cat.title]: true
          };
        });
      }
    });
  }, [location.pathname]);

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

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/admin/login";
  };

  const userEmail = user?.email || "admin@system.com";
  const userInitial = (userEmail.charAt(0) || "A").toUpperCase();
  const userName = userEmail.split("@")[0] || "Admin";
  const displayName = userName.charAt(0).toUpperCase() + userName.slice(1);

  const sidebarContent = (
    <>
      <nav className="flex-1 py-4 px-2 overflow-y-auto sidebar-scroll space-y-4">
        {navCategories.map((category, index) => {
          const isOpen = openCategories[category.title];
          const isCollapsed = !isMobile && collapsed;
          const isCategoryActive = category.items.some(item => isActive(item.path, item.exact));
          
          return (
            <div key={category.title} className="space-y-1">
              {!isCollapsed && (
                <button
                  onClick={() => toggleCategory(category.title)}
                  className={`w-full flex items-center justify-between px-2.5 py-1 text-[10.5px] font-semibold uppercase tracking-wider transition-colors rounded-lg group ${
                    isCategoryActive
                      ? "text-sidebar-primary/90"
                      : "text-sidebar-foreground/50 hover:text-sidebar-foreground/80 hover:bg-sidebar-accent/40"
                  }`}
                >
                  <span className="truncate">
                    {category.title}
                  </span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                      isOpen ? "" : "-rotate-90"
                    } ${isCategoryActive ? "text-sidebar-primary/70" : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/60"}`}
                  />
                </button>
              )}
              
              {(isOpen || isCollapsed) && (
                <div className={`space-y-0.5 ${!isCollapsed ? "mt-0.5" : ""}`}>
                  {category.items.map((item) => {
                    const active = isActive(item.path, item.exact);
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => isMobile && setMobileOpen(false)}
                        className={`group relative flex items-center ${
                          isCollapsed
                            ? "justify-center w-10 h-10 mx-auto rounded-lg"
                            : "gap-2.5 px-2.5 py-1.5 rounded-lg"
                        } text-xs font-medium transition-all duration-150 ${
                          active
                            ? "bg-sidebar-primary/15 text-white shadow-xs ring-1 ring-sidebar-primary/25"
                            : "text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/70"
                        }`}
                        title={!isMobile && collapsed ? item.label : undefined}
                      >
                        {active && !isCollapsed && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-3.5 rounded-full bg-sidebar-primary" />
                        )}
                        <item.icon
                          className={`w-4 h-4 shrink-0 transition-colors ${
                            active
                              ? "text-sidebar-primary"
                              : "text-sidebar-foreground/60 group-hover:text-sidebar-foreground"
                          }`}
                        />
                        {(isMobile || !collapsed) && (
                          <span className="truncate">{item.label}</span>
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

      <div className="p-2 border-t border-sidebar-border bg-sidebar">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            {!isMobile && collapsed ? (
              <button
                className="w-10 h-10 mx-auto rounded-xl flex items-center justify-center relative hover:bg-sidebar-accent/80 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-sidebar-ring group cursor-pointer"
                title={`${displayName} (${userEmail})`}
              >
                <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border/80 shadow-xs">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-xs rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
              </button>
            ) : (
              <button
                className="w-full flex items-center gap-2 p-1.5 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/80 border border-sidebar-border/40 text-left transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-sidebar-ring cursor-pointer"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-8 w-8 rounded-lg border border-sidebar-border/80 shadow-xs">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-xs rounded-lg">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <p className="text-xs font-semibold text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <span className="text-[8.5px] px-1 py-0.2 rounded-full bg-blue-500/15 text-blue-400 font-semibold border border-blue-500/20 shrink-0 uppercase tracking-wider">
                      Admin
                    </span>
                  </div>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate font-mono">
                    {userEmail}
                  </p>
                </div>
                <ChevronsUpDown className="w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80 shrink-0 transition-colors" />
              </button>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={!isMobile && collapsed ? "right" : "top"}
            align={!isMobile && collapsed ? "end" : "start"}
            sideOffset={10}
            className="w-56 bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-2xl rounded-xl p-1.5 z-50"
          >
            <div className="px-3 py-2.5 bg-sidebar-accent/40 rounded-lg mb-1 border border-sidebar-border/40">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-xs rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-sidebar-foreground truncate">{displayName}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 font-medium border border-blue-500/30 shrink-0">
                      Super Admin
                    </span>
                  </div>
                  <p className="text-[11px] text-sidebar-foreground/50 truncate font-mono mt-0.5">{userEmail}</p>
                </div>
              </div>
            </div>

            <DropdownMenuItem asChild>
              <Link
                to="/"
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
              >
                <Store className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="font-medium flex-1">View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-sidebar-foreground/40" />
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link
                to="/admin/settings"
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
              >
                <Settings className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="font-medium">Store Settings</span>
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="bg-sidebar-border/60 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              <span className="font-medium">Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        className={`${collapsed ? "w-16" : "w-56"} bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 fixed h-full z-40 print:hidden shadow-xl`}
      >
        <div className={`h-16 flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-3"} border-b border-sidebar-border/70`}>
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2 overflow-hidden group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center shadow-xs shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-4.5 w-auto object-contain brightness-0 invert"
                />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-semibold text-white tracking-tight block truncate">
                  {siteName}
                </span>
                <span className="text-[9.5px] uppercase font-mono tracking-wider text-sidebar-foreground/60 block -mt-0.5">
                  Control Center
                </span>
              </div>
            </Link>
          )}
          <button
            onClick={toggleSidebar}
            className={`text-sidebar-foreground/60 hover:text-white hover:bg-sidebar-accent/80 p-1.5 rounded-lg transition-colors cursor-pointer ${collapsed ? "mx-auto" : ""}`}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <Menu className="w-4.5 h-4.5" />
            ) : (
              <ChevronLeft className="w-4.5 h-4.5" />
            )}
          </button>
        </div>
        {sidebarContent}
      </aside>

      <main
        className={`flex-1 ${collapsed ? "ml-16" : "ml-56"} transition-all duration-300 flex flex-col overflow-hidden print:ml-0 print:overflow-visible print:w-full`}
      >
        <header className="h-16 border-b border-gray-400 bg-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 print:hidden">
          <div className="flex-1 flex items-center">
            <AdminGlobalSearch />
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
            <Button variant="ghost" size="icon" className="p-2 text-blue-500 bg-blue-50 rounded-full hover:bg-blue-100 transition">
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

        <div className="p-4 flex-1 overflow-hidden print:p-0 print:overflow-visible">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
