import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export interface AdminProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  sizes: string[];
  colors: string[];
  description: string;
  stock: number;
  isActive: boolean;
  isTrending: boolean;
  isNew: boolean;
  isOffer: boolean;
  createdAt: string;
}

export interface Order {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: {
    productName: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }[];
  total: number;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  paymentMethod: "cod";
  shippingAddress: string;
  createdAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  position: "hero" | "promo" | "category";
}

export interface SiteSettings {
  siteName: string;
  siteDescription: string;
  metaTitle: string;
  metaDescription: string;
  whatsappNumber: string;
  instagramHandle: string;
  freeShippingThreshold: number;
  currency: string;
}

interface AdminContextType {
  products: AdminProduct[];
  orders: Order[];
  coupons: Coupon[];
  banners: Banner[];
  settings: SiteSettings;
  addProduct: (p: Omit<AdminProduct, "id" | "createdAt">) => void;
  updateProduct: (id: string, p: Partial<AdminProduct>) => void;
  deleteProduct: (id: string) => void;
  addOrder: (o: Omit<Order, "id" | "createdAt">) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  addCoupon: (c: Omit<Coupon, "id">) => void;
  updateCoupon: (id: string, c: Partial<Coupon>) => void;
  deleteCoupon: (id: string) => void;
  addBanner: (b: Omit<Banner, "id">) => void;
  updateBanner: (id: string, b: Partial<Banner>) => void;
  deleteBanner: (id: string) => void;
  updateSettings: (s: Partial<SiteSettings>) => void;
}

const defaultSettings: SiteSettings = {
  siteName: "Legacy-29",
  siteDescription: "Premium sports shoes in Dubai",
  metaTitle: "Legacy-29 - Premium Sports Shoes in Dubai",
  metaDescription:
    "Shop authentic Nike, Adidas, Puma sports shoes in Dubai. Fast delivery and COD.",
  whatsappNumber: "+96512345678",
  instagramHandle: "legacy29",
  freeShippingThreshold: 30,
  currency: "BDT",
};

const defaultOrders: Order[] = [
  {
    id: "ORD001",
    customerName: "Ahmed Al-Sabah",
    customerEmail: "ahmed@email.com",
    customerPhone: "+96599001122",
    items: [
      {
        productName: "Ultraboost 24",
        size: 43,
        color: "Core Black",
        quantity: 1,
        price: 32,
      },
    ],
    total: 32,
    status: "delivered",
    paymentMethod: "cod",
    shippingAddress: "Downtown, Dubai",
    createdAt: "2026-03-01",
  },
  {
    id: "ORD002",
    customerName: "Fatima Hassan",
    customerEmail: "fatima@email.com",
    customerPhone: "+96599003344",
    items: [
      {
        productName: "Air Jordan Retro High OG",
        size: 40,
        color: "Gym Red/Black",
        quantity: 1,
        price: 45,
      },
    ],
    total: 45,
    status: "shipped",
    paymentMethod: "cod",
    shippingAddress: "Marina, Dubai",
    createdAt: "2026-03-05",
  },
  {
    id: "ORD003",
    customerName: "Omar Khalid",
    customerEmail: "omar@email.com",
    customerPhone: "+96599005566",
    items: [
      {
        productName: "Predator Elite FG",
        size: 44,
        color: "Core Black/Gold",
        quantity: 1,
        price: 55,
      },
      {
        productName: "Gel-Kayano 30",
        size: 44,
        color: "Safety Yellow",
        quantity: 1,
        price: 38,
      },
    ],
    total: 93,
    status: "confirmed",
    paymentMethod: "cod",
    shippingAddress: "Jumeirah, Dubai",
    createdAt: "2026-03-08",
  },
  {
    id: "ORD004",
    customerName: "Sara Mohammed",
    customerEmail: "sara@email.com",
    customerPhone: "+96599007788",
    items: [
      {
        productName: "Cloudrunner 2",
        size: 38,
        color: "Hot Pink",
        quantity: 2,
        price: 36,
      },
    ],
    total: 72,
    status: "pending",
    paymentMethod: "cod",
    shippingAddress: "Deira, Dubai",
    createdAt: "2026-03-09",
  },
  {
    id: "ORD005",
    customerName: "Khalid Nasser",
    customerEmail: "khalid@email.com",
    customerPhone: "+96599009900",
    items: [
      {
        productName: "Air Max 97",
        size: 42,
        color: "Triple Black",
        quantity: 1,
        price: 35,
      },
    ],
    total: 35,
    status: "pending",
    paymentMethod: "cod",
    shippingAddress: "Al Barsha, Dubai",
    createdAt: "2026-03-10",
  },
];

const defaultCoupons: Coupon[] = [
  {
    id: "c1",
    code: "WELCOME10",
    type: "percentage",
    value: 10,
    minOrder: 20,
    maxUses: 100,
    usedCount: 34,
    isActive: true,
    expiresAt: "2026-06-30",
  },
  {
    id: "c2",
    code: "RAMADAN25",
    type: "percentage",
    value: 25,
    minOrder: 50,
    maxUses: 50,
    usedCount: 12,
    isActive: true,
    expiresAt: "2026-04-15",
  },
  {
    id: "c3",
    code: "FREE5",
    type: "fixed",
    value: 5,
    minOrder: 30,
    maxUses: 200,
    usedCount: 89,
    isActive: true,
    expiresAt: "2026-12-31",
  },
];

const defaultBanners: Banner[] = [
  {
    id: "b1",
    title: "New Arrivals",
    subtitle: "Check out the latest drops",
    imageUrl: "/assets/hero-sports.jpg",
    linkUrl: "/parts",
    isActive: true,
    position: "hero",
  },
  {
    id: "b2",
    title: "Ramadan Sale",
    subtitle: "Up to 30% off selected items",
    imageUrl: "/assets/shoe-basketball.jpg",
    linkUrl: "/parts",
    isActive: true,
    position: "promo",
  },
];

const AdminContext = createContext<AdminContextType | undefined>(undefined);

function loadState<T>(key: string, fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [products, setProducts] = useState<AdminProduct[]>(() =>
    loadState("admin_products", []),
  );
  const [orders, setOrders] = useState<Order[]>(() =>
    loadState("admin_orders", defaultOrders),
  );
  const [coupons, setCoupons] = useState<Coupon[]>(() =>
    loadState("admin_coupons", defaultCoupons),
  );
  const [banners, setBanners] = useState<Banner[]>(() =>
    loadState("admin_banners", defaultBanners),
  );
  const [settings, setSettings] = useState<SiteSettings>(() =>
    loadState("admin_settings", defaultSettings),
  );

  useEffect(() => {
    localStorage.setItem("admin_products", JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem("admin_orders", JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem("admin_coupons", JSON.stringify(coupons));
  }, [coupons]);
  useEffect(() => {
    localStorage.setItem("admin_banners", JSON.stringify(banners));
  }, [banners]);
  useEffect(() => {
    localStorage.setItem("admin_settings", JSON.stringify(settings));
  }, [settings]);

  const addProduct = useCallback(
    (p: Omit<AdminProduct, "id" | "createdAt">) => {
      setProducts((prev) => [
        ...prev,
        { ...p, id: `p_${Date.now()}`, createdAt: new Date().toISOString() },
      ]);
    },
    [],
  );
  const updateProduct = useCallback((id: string, p: Partial<AdminProduct>) => {
    setProducts((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...p } : item)),
    );
  }, []);
  const deleteProduct = useCallback((id: string) => {
    setProducts((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const addOrder = useCallback((o: Omit<Order, "id" | "createdAt">) => {
    setOrders((prev) => [
      ...prev,
      {
        ...o,
        id: `ORD${String(prev.length + 1).padStart(3, "0")}`,
        createdAt: new Date().toISOString(),
      },
    ]);
  }, []);
  const updateOrderStatus = useCallback(
    (id: string, status: Order["status"]) => {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o)),
      );
    },
    [],
  );
  const addCoupon = useCallback((c: Omit<Coupon, "id">) => {
    setCoupons((prev) => [...prev, { ...c, id: `c_${Date.now()}` }]);
  }, []);
  const updateCoupon = useCallback((id: string, c: Partial<Coupon>) => {
    setCoupons((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...c } : item)),
    );
  }, []);
  const deleteCoupon = useCallback((id: string) => {
    setCoupons((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const addBanner = useCallback((b: Omit<Banner, "id">) => {
    setBanners((prev) => [...prev, { ...b, id: `b_${Date.now()}` }]);
  }, []);
  const updateBanner = useCallback((id: string, b: Partial<Banner>) => {
    setBanners((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...b } : item)),
    );
  }, []);
  const deleteBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((item) => item.id !== id));
  }, []);
  const updateSettings = useCallback((s: Partial<SiteSettings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  return (
    <AdminContext.Provider
      value={{
        products,
        orders,
        coupons,
        banners,
        settings,
        addProduct,
        updateProduct,
        deleteProduct,
        addOrder,
        updateOrderStatus,
        addCoupon,
        updateCoupon,
        deleteCoupon,
        addBanner,
        updateBanner,
        deleteBanner,
        updateSettings,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
};
