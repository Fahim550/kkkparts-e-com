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

interface NavItem {
  path: string;
  label: string;
  icon: any;
  exact?: boolean;
  allowedRoles?: string[];
}

interface NavCategory {
  title: string;
  items: NavItem[];
}

const navCategories: NavCategory[] = [
  {
    title: "Overview",
    items: [
      { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { path: "/admin/receivable-parties", label: "Receivables", icon: Users, exact: false, allowedRoles: ["Admin", "Sales", "Salesman", "Accountant"] },
      { path: "/admin/payable-parties", label: "Payables", icon: Truck, exact: false, allowedRoles: ["Admin", "Accountant", "Purchasing"] },
    ]
  },
  {
    title: "Catalog",
    items: [
      { path: "/admin/products", label: "Products", icon: Package, allowedRoles: ["Admin", "Sales", "Salesman", "WarehouseManager"] },
      { path: "/admin/categories", label: "Categories", icon: FolderTree, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/brands", label: "Brands", icon: Package, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/uoms", label: "UOMs", icon: Package, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/attributes", label: "Attributes", icon: Package, allowedRoles: ["Admin", "WarehouseManager"] },
    ]
  },
  {
    title: "Inventory",
    items: [
      { path: "/admin/warehouse/dashboard", label: "Warehouse Dashboard", icon: BarChart3, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/warehouses", label: "Warehouses", icon: Package, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/warehouse-locations", label: "Warehouse Locations", icon: MapPin, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/stock-transfers", label: "Stock Transfers", icon: Activity, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/stock-ledger", label: "Stock Ledger", icon: Database, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/stock-adjustments", label: "Adjustments & Damage", icon: Settings2, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/fifo-layers", label: "FIFO Cost Layers", icon: Layers, allowedRoles: ["Admin", "WarehouseManager", "Accountant"] },
    ]
  },
  {
    title: "Sales & POS",
    items: [
      { path: "/admin/pos", label: "Point of Sale", icon: Monitor, allowedRoles: ["Admin", "Sales", "Salesman", "Cashier"] },
      { path: "/admin/orders", label: "Customer Orders", icon: ShoppingCart, allowedRoles: ["Admin", "Sales", "Salesman"] },
      { path: "/admin/dealer-orders", label: "Dealer Orders", icon: ShoppingCart, allowedRoles: ["Admin", "Sales", "Salesman"] },
    ]
  },
  {
    title: "Purchases",
    items: [
      { path: "/admin/purchase-orders", label: "Purchase Orders", icon: ShoppingCart, allowedRoles: ["Admin", "Purchasing", "Accountant"] },
      { path: "/admin/goods-receive", label: "Goods Receive", icon: Package, allowedRoles: ["Admin", "Purchasing", "WarehouseManager"] },
      { path: "/admin/payable-parties", label: "Supplier Due", icon: FileText, allowedRoles: ["Admin", "Purchasing", "Accountant"] },
      { path: "/admin/purchase-history", label: "Purchase History", icon: Activity, allowedRoles: ["Admin", "Purchasing", "Accountant"] },
    ]
  },
  {
    title: "Accounting & Finance",
    items: [
      { path: "/admin/accounting/coa", label: "Chart of Accounts", icon: Library, allowedRoles: ["Admin", "Accountant"] },
      { path: "/admin/accounting/journals", label: "Journal Entries", icon: BookOpen, allowedRoles: ["Admin", "Accountant"] },
      { path: "/admin/accounting/financials", label: "Financial Reports", icon: Landmark, allowedRoles: ["Admin", "Accountant"] },
    ]
  },
  {
    title: "Reports & Analytics",
    items: [
      { path: "/admin/reports", label: "Dashboard KPIs", icon: TrendingUp, exact: true, allowedRoles: ["Admin"] },
      { path: "/admin/reports/sales", label: "Sales Report", icon: FileText, allowedRoles: ["Admin", "Sales", "Salesman"] },
      { path: "/admin/reports/inventory", label: "Inventory Report", icon: Package, allowedRoles: ["Admin", "WarehouseManager"] },
      { path: "/admin/analytics", label: "Analytics", icon: BarChart3, allowedRoles: ["Admin"] },
      { path: "/admin/visitor-analytics", label: "Visitor Tracker", icon: Activity, allowedRoles: ["Admin"] },
    ]
  },
  {
    title: "People",
    items: [
      { path: "/admin/customers", label: "Customers", icon: Users, allowedRoles: ["Admin", "Sales", "Salesman"] },
      { path: "/admin/suppliers", label: "Suppliers", icon: Users, allowedRoles: ["Admin", "Purchasing", "Accountant"] },
      { path: "/admin/users", label: "Staff & Dealers", icon: UserCog, allowedRoles: ["Admin"] },
    ]
  },
  {
    title: "Marketing & Pricing",
    items: [
      { path: "/admin/price-lists", label: "Price Lists", icon: Tag, allowedRoles: ["Admin"] },
      { path: "/admin/discount-rules", label: "Discount Rules", icon: Percent, allowedRoles: ["Admin"] },
      { path: "/admin/coupons", label: "Coupons", icon: Tag, allowedRoles: ["Admin"] },
      { path: "/admin/marketing", label: "Marketing", icon: Megaphone, allowedRoles: ["Admin"] },
      { path: "/admin/checkout-leads", label: "Checkout Leads", icon: UserSearch, allowedRoles: ["Admin", "Sales", "Salesman"] },
    ]
  },
  {
    title: "Storefront & Content",
    items: [
      { path: "/admin/banners", label: "Banners", icon: Image, allowedRoles: ["Admin"] },
      { path: "/admin/pages", label: "Pages", icon: FileText, allowedRoles: ["Admin"] },
      { path: "/admin/reviews", label: "Reviews", icon: Star, allowedRoles: ["Admin"] },
      { path: "/admin/messages", label: "Messages", icon: MessageSquare, allowedRoles: ["Admin", "Sales", "Salesman"] },
      { path: "/admin/vehicle-data", label: "Vehicle Data", icon: Car, allowedRoles: ["Admin"] },
    ]
  },
  {
    title: "System",
    items: [
      { path: "/admin/shipping", label: "Shipping Methods", icon: Truck, allowedRoles: ["Admin"] },
      { path: "/admin/settings", label: "Settings", icon: Settings, allowedRoles: ["Admin"] },
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
  const { user, signOut, isAdmin, isSalesman, primaryRole, hasRole } = useAdminAuth();
  const isMobile = useIsMobile();
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const logoUrl = s?.logo_url || "/logo.png";
  const siteName = s?.site_name || "Admin";

  // Filter categories based on user roles
  const visibleCategories = navCategories
    .map(category => ({
      ...category,
      items: category.items.filter(item => {
        if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
        if (isAdmin) return true;
        return item.allowedRoles.some(r => hasRole(r));
      })
    }))
    .filter(category => category.items.length > 0);

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
    visibleCategories.forEach(cat => {
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
    visibleCategories.forEach(cat => {
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
  }, [location.pathname, visibleCategories]);

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
      <nav className="flex-1 py-4 px-2.5 overflow-y-auto sidebar-scroll space-y-4">
        {visibleCategories.map((category, index) => {
          const isOpen = openCategories[category.title];
          const isCollapsed = !isMobile && collapsed;
          const isCategoryActive = category.items.some(item => isActive(item.path, item.exact));
          
          return (
            <div key={category.title} className="space-y-1">
              {!isCollapsed && (
                <button
                  onClick={() => toggleCategory(category.title)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition-colors rounded-lg group ${
                    isCategoryActive
                      ? "text-sidebar-primary/95"
                      : "text-sidebar-foreground/60 hover:text-sidebar-foreground/90 hover:bg-sidebar-accent/50"
                  }`}
                >
                  <span className="truncate">
                    {category.title}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                      isOpen ? "" : "-rotate-90"
                    } ${isCategoryActive ? "text-sidebar-primary/80" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"}`}
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
                            : "gap-3 px-3 py-2 rounded-lg"
                        } text-sm font-medium transition-all duration-150 ${
                          active
                            ? "bg-sidebar-primary/15 text-white shadow-xs ring-1 ring-sidebar-primary/25 font-semibold"
                            : "text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/70"
                        }`}
                        title={!isMobile && collapsed ? item.label : undefined}
                      >
                        {active && !isCollapsed && (
                          <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-full bg-sidebar-primary" />
                        )}
                        <item.icon
                          className={`w-4.5 h-4.5 shrink-0 transition-colors ${
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
              
              {isCollapsed && index < visibleCategories.length - 1 && (
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
                className="w-full flex items-center gap-2.5 p-2 rounded-xl bg-sidebar-accent/30 hover:bg-sidebar-accent/80 border border-sidebar-border/40 text-left transition-all duration-200 group focus:outline-none focus:ring-1 focus:ring-sidebar-ring cursor-pointer"
              >
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9 rounded-lg border border-sidebar-border/80 shadow-xs">
                    <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-sm rounded-lg">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-sidebar" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold border shrink-0 uppercase tracking-wider ${
                      isAdmin
                        ? "bg-blue-500/15 text-blue-400 border-blue-500/20"
                        : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {primaryRole || "Staff"}
                    </span>
                  </div>
                  <p className="text-xs text-sidebar-foreground/60 truncate font-mono">
                    {userEmail}
                  </p>
                </div>
                <ChevronsUpDown className="w-4 h-4 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/80 shrink-0 transition-colors" />
              </button>
            )}
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side={!isMobile && collapsed ? "right" : "top"}
            align={!isMobile && collapsed ? "end" : "start"}
            sideOffset={10}
            className="w-64 bg-sidebar border border-sidebar-border text-sidebar-foreground shadow-2xl rounded-xl p-1.5 z-50"
          >
            <div className="px-3 py-2.5 bg-sidebar-accent/40 rounded-lg mb-1 border border-sidebar-border/40">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8.5 w-8.5 rounded-lg shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 text-white font-bold text-xs rounded-lg">
                    {userInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-sidebar-foreground truncate">{displayName}</span>
                    <span className={`text-[9.5px] px-1.5 py-0.5 rounded-full font-medium border shrink-0 ${
                      isAdmin
                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    }`}>
                      {primaryRole || "Staff"}
                    </span>
                  </div>
                  <p className="text-xs text-sidebar-foreground/60 truncate font-mono mt-0.5">{userEmail}</p>
                </div>
              </div>
            </div>

            <DropdownMenuItem asChild>
              <Link
                to="/"
                className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
              >
                <Store className="w-4 h-4 text-sidebar-foreground/60" />
                <span className="font-medium flex-1">View Storefront</span>
                <ExternalLink className="w-3.5 h-3.5 text-sidebar-foreground/40" />
              </Link>
            </DropdownMenuItem>

            {isAdmin && (
              <DropdownMenuItem asChild>
                <Link
                  to="/admin/settings"
                  className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent cursor-pointer transition-colors"
                >
                  <Settings className="w-4 h-4 text-sidebar-foreground/60" />
                  <span className="font-medium">Store Settings</span>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator className="bg-sidebar-border/60 my-1" />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-sm rounded-lg text-red-400 hover:text-red-300 hover:bg-red-500/10 cursor-pointer transition-colors"
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
            <span className="text-sm font-semibold text-sidebar-foreground/80 font-body">
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
                <span className="text-sm font-semibold text-sidebar-foreground/80 font-body">
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
        className={`${collapsed ? "w-16" : "w-64"} bg-sidebar border-r border-sidebar-border flex flex-col shrink-0 transition-all duration-300 fixed h-full z-40 print:hidden shadow-xl`}
      >
        <div className={`h-16 flex items-center ${collapsed ? "justify-center px-2" : "justify-between px-4"} border-b border-sidebar-border/70`}>
          {!collapsed && (
            <Link to="/admin" className="flex items-center gap-2.5 overflow-hidden group">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 flex items-center justify-center shadow-xs shrink-0 border border-white/10 group-hover:scale-105 transition-transform">
                <img
                  src={logoUrl}
                  alt={siteName}
                  className="h-4.5 w-auto object-contain brightness-0 invert"
                />
              </div>
              <div className="min-w-0">
                <span className="text-sm font-bold text-white tracking-tight block truncate">
                  {siteName}
                </span>
                <span className="text-[11px] uppercase font-mono tracking-wider text-sidebar-foreground/60 block">
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
        className={`flex-1 ${collapsed ? "ml-16" : "ml-64"} transition-all duration-300 flex flex-col overflow-hidden print:ml-0 print:overflow-visible print:w-full`}
      >
        <header className="h-16 border-b border-gray-400 bg-gray-100 flex items-center justify-between px-6 sticky top-0 z-30 print:hidden">
          <div className="flex-1 flex items-center">
            <AdminGlobalSearch />
          </div>
          <div className="flex items-center space-x-3">
            <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-white border shadow-xs text-foreground/80">
              Role: <strong className="ml-1 text-primary">{primaryRole || "Staff"}</strong>
            </span>
            <Link to="/admin/sales/new">
              <Button className="bg-red-500 hover:bg-red-600 text-white rounded-full h-9 px-4 font-semibold shadow-sm">
                + Add Sale
              </Button>
            </Link>
            {(isAdmin || hasRole("Purchasing")) && (
              <Link to="/admin/purchases/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full h-9 px-4 font-semibold shadow-sm">
                  + Add Purchase
                </Button>
              </Link>
            )}
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
