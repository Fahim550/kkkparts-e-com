import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { LanguageProvider } from "@/context/LanguageContext";
import { lazy, Suspense } from "react";
// import WhatsAppButton from "@/components/WhatsAppButton";
import FacebookPixelProvider from "@/components/FacebookPixelProvider";
import ProtectedAdminRoute from "@/components/ProtectedAdminRoute";
import VisitorTracker from "@/components/VisitorTracker";
import ScrollToTop from "@/components/ScrollToTop";
import LanguagePopup from "@/components/LanguagePopup";
import PageTitleUpdater from "@/components/PageTitleUpdater";
import { Loader2 } from "lucide-react";

// Eager load homepage for better LCP performance
import Index from "./pages/Index.tsx";

// Lazy load other pages
const ShopPage = lazy(() => import("./pages/ShopPage.tsx"));
const ProductPage = lazy(() => import("./pages/ProductPage.tsx"));
const CartPage = lazy(() => import("./pages/CartPage.tsx"));
const CheckoutPage = lazy(() => import("./pages/CheckoutPage.tsx"));
const WishlistPage = lazy(() => import("./pages/WishlistPage.tsx"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout.tsx"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage.tsx"));
const Dashboard = lazy(() => import("./pages/admin/Dashboard.tsx"));
const ProductsManager = lazy(() => import("./pages/admin/ProductsManager.tsx"));
const OrdersManager = lazy(() => import("./pages/admin/OrdersManager.tsx"));
const DealerOrdersManager = lazy(
  () => import("./pages/admin/DealerOrdersManager.tsx"),
);
const OrderDetailsPage = lazy(
  () => import("./pages/admin/OrderDetailsPage.tsx"),
);
const CouponsManager = lazy(() => import("./pages/admin/CouponsManager.tsx"));
const CheckoutLeadsManager = lazy(
  () => import("./pages/admin/CheckoutLeadsManager.tsx"),
);
const CategoriesManager = lazy(
  () => import("./pages/admin/CategoriesManager.tsx"),
);
const BrandsPage = lazy(
  () => import("./modules/product/presentation/pages/BrandsPage.tsx"),
);
const UOMsPage = lazy(
  () => import("./modules/product/presentation/pages/UOMsPage.tsx"),
);
const AttributesPage = lazy(
  () => import("./modules/product/presentation/pages/AttributesPage.tsx"),
);
const WarehousesPage = lazy(
  () => import("./modules/warehouse/presentation/pages/WarehousesPage.tsx"),
);
const WarehouseLocationsPage = lazy(
  () =>
    import("./modules/warehouse/presentation/pages/WarehouseLocationsPage.tsx"),
);
const StockTransfersPage = lazy(
  () => import("./modules/warehouse/presentation/pages/StockTransfersPage.tsx"),
);
const WarehouseDashboardPage = lazy(
  () =>
    import("./modules/warehouse/presentation/pages/WarehouseDashboardPage.tsx"),
);
const SuppliersManager = lazy(
  () => import("./modules/supplier/presentation/pages/SuppliersManager.tsx"),
);
const CustomersManager = lazy(
  () => import("./modules/customer/presentation/pages/CustomersManager.tsx"),
);
const CustomerProfilePage = lazy(
  () => import("./modules/customer/presentation/pages/CustomerProfilePage.tsx"),
);
const PriceListsManager = lazy(
  () => import("./modules/pricing/presentation/pages/PriceListsManager.tsx"),
);
const DiscountRulesManager = lazy(
  () => import("./modules/pricing/presentation/pages/DiscountRulesManager.tsx"),
);
const PurchaseOrdersPage = lazy(
  () => import("./modules/purchase/presentation/pages/PurchaseOrdersPage.tsx"),
);
const GoodsReceivePage = lazy(
  () => import("./modules/purchase/presentation/pages/GoodsReceivePage.tsx"),
);
const SupplierDuePage = lazy(
  () => import("./modules/purchase/presentation/pages/SupplierDuePage.tsx"),
);
const PurchaseHistoryPage = lazy(
  () => import("./modules/purchase/presentation/pages/PurchaseHistoryPage.tsx"),
);
const StockLedgerPage = lazy(
  () => import("./modules/inventory/presentation/pages/StockLedgerPage.tsx"),
);
const StockAdjustmentsPage = lazy(
  () => import("./modules/inventory/presentation/pages/StockAdjustmentsPage.tsx"),
);
const FifoCostLayersPage = lazy(
  () => import("./modules/inventory/presentation/pages/FifoCostLayersPage.tsx"),
);
const BannersManager = lazy(() => import("./pages/admin/BannersManager.tsx"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage.tsx"));
const VehicleDataManager = lazy(
  () => import("./pages/admin/VehicleDataManager.tsx"),
);
const VisitorAnalyticsPage = lazy(
  () => import("./pages/admin/VisitorAnalyticsPage.tsx"),
);
const ShippingMethodsManager = lazy(
  () => import("./pages/admin/ShippingMethodsManager.tsx"),
);
const ReviewsManager = lazy(() => import("./pages/admin/ReviewsManager.tsx"));
const CustomersPage = lazy(() => import("./pages/admin/CustomersPage.tsx"));
const UsersManager = lazy(() => import("./pages/admin/UsersManager.tsx"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage.tsx"));
const MarketingTrackingPage = lazy(
  () => import("./pages/admin/MarketingTrackingPage.tsx"),
);
const MessagesManager = lazy(() => import("./pages/admin/MessagesManager.tsx"));
const PagesManager = lazy(() => import("./pages/admin/PagesManager.tsx"));
const JobApplicationsManager = lazy(
  () => import("./pages/admin/JobApplicationsManager.tsx"),
);
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const CareersPage = lazy(() => import("./pages/CareersPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const DealerLoginPage = lazy(() => import("./pages/DealerLoginPage.tsx"));
const DealerDashboard = lazy(() => import("./pages/DealerDashboard.tsx"));

const queryClient = new QueryClient();

// Page loading fallback
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center bg-background">
    <Loader2 className="w-12 h-12 animate-spin text-neon" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <CartProvider>
          <AdminAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <LanguageProvider>
                <ScrollToTop />
                <LanguagePopup />
                <PageTitleUpdater />
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/parts" element={<ShopPage />} />
                    <Route path="/product/:id" element={<ProductPage />} />
                    <Route path="/cart" element={<CartPage />} />
                    <Route path="/checkout" element={<CheckoutPage />} />
                    <Route path="/wishlist" element={<WishlistPage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/contact" element={<ContactPage />} />
                    <Route path="/careers" element={<CareersPage />} />
                    <Route path="/dealer/login" element={<DealerLoginPage />} />
                    <Route
                      path="/dealer/register"
                      element={<DealerLoginPage />}
                    />
                    <Route
                      path="/dealer/dashboard"
                      element={<DealerDashboard />}
                    />

                    <Route path="/admin/login" element={<AdminLoginPage />} />
                    <Route
                      path="/admin"
                      element={
                        <ProtectedAdminRoute>
                          <AdminLayout />
                        </ProtectedAdminRoute>
                      }
                    >
                      <Route index element={<Dashboard />} />
                      <Route path="products" element={<ProductsManager />} />
                      <Route path="orders" element={<OrdersManager />} />
                      <Route
                        path="dealer-orders"
                        element={<DealerOrdersManager />}
                      />
                      <Route
                        path="dealer-orders/:id"
                        element={<OrderDetailsPage />}
                      />
                      <Route path="orders/:id" element={<OrderDetailsPage />} />
                      <Route
                        path="categories"
                        element={<CategoriesManager />}
                      />
                      <Route path="brands" element={<BrandsPage />} />
                      <Route path="uoms" element={<UOMsPage />} />
                      <Route path="attributes" element={<AttributesPage />} />
                      <Route
                        path="warehouse/dashboard"
                        element={<WarehouseDashboardPage />}
                      />
                      <Route path="warehouses" element={<WarehousesPage />} />
                      <Route
                        path="warehouse-locations"
                        element={<WarehouseLocationsPage />}
                      />
                      <Route
                        path="stock-transfers"
                        element={<StockTransfersPage />}
                      />
                      <Route path="suppliers" element={<SuppliersManager />} />
                      <Route path="customers" element={<CustomersManager />} />
                      <Route path="customers/:id" element={<CustomerProfilePage />} />
                      <Route path="price-lists" element={<PriceListsManager />} />
                      <Route path="discount-rules" element={<DiscountRulesManager />} />
                      <Route path="purchase-orders" element={<PurchaseOrdersPage />} />
                      <Route path="goods-receive" element={<GoodsReceivePage />} />
                      <Route path="supplier-due" element={<SupplierDuePage />} />
                      <Route path="purchase-history" element={<PurchaseHistoryPage />} />
                      <Route path="stock-ledger" element={<StockLedgerPage />} />
                      <Route path="stock-adjustments" element={<StockAdjustmentsPage />} />
                      <Route path="fifo-layers" element={<FifoCostLayersPage />} />
                      <Route
                        path="vehicle-data"
                        element={<VehicleDataManager />}
                      />
                      <Route path="coupons" element={<CouponsManager />} />
                      <Route
                        path="checkout-leads"
                        element={<CheckoutLeadsManager />}
                      />
                      <Route path="banners" element={<BannersManager />} />
                      <Route path="messages" element={<MessagesManager />} />
                      <Route path="analytics" element={<AnalyticsPage />} />
                      <Route
                        path="visitor-analytics"
                        element={<VisitorAnalyticsPage />}
                      />
                      <Route path="customers" element={<CustomersPage />} />
                      <Route path="users" element={<UsersManager />} />
                      <Route path="settings" element={<SettingsPage />} />
                      <Route
                        path="marketing"
                        element={<MarketingTrackingPage />}
                      />
                      <Route
                        path="shipping"
                        element={<ShippingMethodsManager />}
                      />
                      <Route path="reviews" element={<ReviewsManager />} />
                      <Route path="pages" element={<PagesManager />} />
                      <Route
                        path="job-applications"
                        element={<JobApplicationsManager />}
                      />
                    </Route>
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <VisitorTracker />
                {/* <WhatsAppButton /> */}
                <FacebookPixelProvider />
              </LanguageProvider>
            </BrowserRouter>
          </AdminAuthProvider>
        </CartProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
