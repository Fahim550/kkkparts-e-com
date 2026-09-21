import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AdminAuthProvider } from "@/hooks/useAdminAuth";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
// import WhatsAppButton from "@/components/WhatsAppButton";
import FacebookPixelProvider from "@/components/FacebookPixelProvider";
import LanguagePopup from "@/components/LanguagePopup";
import PageTitleUpdater from "@/components/PageTitleUpdater";
import ProtectedAdminRoute, { RequireRole } from "@/components/ProtectedAdminRoute";
import ScrollToTop from "@/components/ScrollToTop";
import VisitorTracker from "@/components/VisitorTracker";
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
const ProductsPage = lazy(
  () => import("./modules/product/presentation/pages/ProductsPage.tsx"),
);
const OrdersManager = lazy(() => import("./pages/admin/OrdersManager.tsx"));
const DealerOrdersManager = lazy(
  () => import("./pages/admin/DealerOrdersManager.tsx"),
);
const OrderDetailsPage = lazy(
  () => import("./pages/admin/OrderDetailsPage.tsx"),
);
const AddSalePage = lazy(
  () => import("./pages/admin/AddSalePage.tsx"),
);
const CouponsManager = lazy(() => import("./pages/admin/CouponsManager.tsx"));
const CheckoutLeadsManager = lazy(
  () => import("./pages/admin/CheckoutLeadsManager.tsx"),
);
const CategoriesPage = lazy(
  () => import("./modules/product/presentation/pages/CategoriesPage.tsx"),
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
const ChartOfAccountsPage = lazy(
  () =>
    import("./modules/accounting/presentation/pages/ChartOfAccountsPage.tsx"),
);
const JournalEntriesPage = lazy(
  () =>
    import("./modules/accounting/presentation/pages/JournalEntriesPage.tsx"),
);
const FinancialReportsPage = lazy(
  () =>
    import("./modules/accounting/presentation/pages/FinancialReportsPage.tsx"),
);
const ReportsDashboard = lazy(
  () => import("./modules/reporting/presentation/pages/ReportsDashboard.tsx"),
);
const SalesReport = lazy(
  () => import("./modules/reporting/presentation/pages/SalesReport.tsx"),
);
const InventoryReport = lazy(
  () => import("./modules/reporting/presentation/pages/InventoryReport.tsx"),
);
const PosDashboard = lazy(
  () => import("./modules/pos/presentation/pages/PosDashboard.tsx"),
);
const PosTerminal = lazy(
  () => import("./modules/pos/presentation/pages/PosTerminal.tsx"),
);
const PosReceiptViewer = lazy(
  () => import("./modules/pos/presentation/pages/PosReceiptViewer.tsx"),
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
const AddPurchasePage = lazy(
  () => import("./modules/purchase/presentation/pages/AddPurchasePage.tsx"),
);
const PurchaseOrderDetailsPage = lazy(
  () => import("./modules/purchase/presentation/pages/PurchaseOrderDetailsPage.tsx"),
);
const GoodsReceivePage = lazy(
  () => import("./modules/purchase/presentation/pages/GoodsReceivePage.tsx"),
);
const GoodsReceiveDetailsPage = lazy(
  () => import("./modules/purchase/presentation/pages/GoodsReceiveDetailsPage.tsx"),
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
  () =>
    import("./modules/inventory/presentation/pages/StockAdjustmentsPage.tsx"),
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
const ReceivablePartiesPage = lazy(() => import("./pages/admin/ReceivablePartiesPage.tsx"));
const PayablePartiesPage = lazy(() => import("./pages/admin/PayablePartiesPage.tsx"));
const AboutPage = lazy(() => import("./pages/AboutPage.tsx"));
const ContactPage = lazy(() => import("./pages/ContactPage.tsx"));
const CareersPage = lazy(() => import("./pages/CareersPage.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const DealerLoginPage = lazy(() => import("./pages/DealerLoginPage.tsx"));
const DealerDashboard = lazy(() => import("./pages/DealerDashboard.tsx"));
const DealerOrdersPage = lazy(
  () => import("./pages/dealer/DealerOrdersPage.tsx"),
);
const DealerProfilePage = lazy(
  () => import("./pages/dealer/DealerProfilePage.tsx"),
);


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes cache
      refetchOnWindowFocus: false,
    },
  },
});

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
                    <Route
                      path="/dealer/orders"
                      element={<DealerOrdersPage />}
                    />
                    <Route
                      path="/dealer/profile"
                      element={<DealerProfilePage />}
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
                      <Route path="receivable-parties" element={<ReceivablePartiesPage />} />
                      <Route path="payable-parties" element={<PayablePartiesPage />} />
                      <Route path="sales/new" element={<AddSalePage />} />
                      <Route path="products" element={<ProductsPage />} />
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
                      <Route path="categories" element={<CategoriesPage />} />
                      <Route path="brands" element={<BrandsPage />} />
                      <Route path="uoms" element={<UOMsPage />} />
                      <Route path="attributes" element={<AttributesPage />} />
                      <Route
                        path="warehouse/dashboard"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <WarehouseDashboardPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="warehouses"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <WarehousesPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="warehouse-locations"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <WarehouseLocationsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="stock-transfers"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <StockTransfersPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="suppliers"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <SuppliersManager />
                          </RequireRole>
                        }
                      />
                      <Route path="customers" element={<CustomersManager />} />
                      <Route
                        path="customers/:id"
                        element={<CustomerProfilePage />}
                      />
                      <Route
                        path="accounting/coa"
                        element={
                          <RequireRole allowedRoles={["Admin", "Accountant"]}>
                            <ChartOfAccountsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="accounting/journals"
                        element={
                          <RequireRole allowedRoles={["Admin", "Accountant"]}>
                            <JournalEntriesPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="accounting/financials"
                        element={
                          <RequireRole allowedRoles={["Admin", "Accountant"]}>
                            <FinancialReportsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="reports"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <ReportsDashboard />
                          </RequireRole>
                        }
                      />
                      <Route path="reports/sales" element={<SalesReport />} />
                      <Route
                        path="reports/inventory"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <InventoryReport />
                          </RequireRole>
                        }
                      />
                      <Route path="pos" element={<PosDashboard />} />
                      <Route path="pos/terminal" element={<PosTerminal />} />
                      <Route
                        path="pos/receipt/:id"
                        element={<PosReceiptViewer />}
                      />
                      <Route
                        path="pos/receipts/:id"
                        element={<PosReceiptViewer />}
                      />
                      <Route
                        path="price-lists"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <PriceListsManager />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="discount-rules"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <DiscountRulesManager />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="purchases"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <PurchaseOrdersPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="purchase-orders"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <PurchaseOrdersPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="purchases/new"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <AddPurchasePage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="purchase/new"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <AddPurchasePage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="purchase-orders/:id"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <PurchaseOrderDetailsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="goods-receive"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "WarehouseManager"]}>
                            <GoodsReceivePage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="goods-receive/:id"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "WarehouseManager"]}>
                            <GoodsReceiveDetailsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="supplier-due"
                        element={<Navigate to="/admin/payable-parties" replace />}
                      />
                      <Route
                        path="purchase-history"
                        element={
                          <RequireRole allowedRoles={["Admin", "Purchasing", "Accountant"]}>
                            <PurchaseHistoryPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="stock-ledger"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <StockLedgerPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="stock-adjustments"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager"]}>
                            <StockAdjustmentsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="fifo-layers"
                        element={
                          <RequireRole allowedRoles={["Admin", "WarehouseManager", "Accountant"]}>
                            <FifoCostLayersPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="vehicle-data"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <VehicleDataManager />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="coupons"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <CouponsManager />
                          </RequireRole>
                        }
                      />
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
                      <Route
                        path="users"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <UsersManager />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="settings"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <SettingsPage />
                          </RequireRole>
                        }
                      />
                      <Route
                        path="marketing"
                        element={<MarketingTrackingPage />}
                      />
                      <Route
                        path="shipping"
                        element={
                          <RequireRole allowedRoles={["Admin"]}>
                            <ShippingMethodsManager />
                          </RequireRole>
                        }
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
