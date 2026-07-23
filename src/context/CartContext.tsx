import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
// Shared enriched product shape used in the cart (compatible with DealerDashboard)
export interface CartProduct {
  id: string;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  dealerPrice?: number;
  dealerOriginalPrice?: number;
  category: string;
  image: string;
  images?: string[];
  sizes?: number[];
  colors?: string[];
  description?: string;
  rating?: number;
  reviews?: number;
  stock?: number;
  isTrending?: boolean;
  isNew?: boolean;
  isOffer?: boolean;
}
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export interface CartItem {
  product: CartProduct;
  quantity: number;
  size: number;
  color: string;
  stock?: number;
}

export interface AppliedCoupon {
  code: string;
  type: string;
  value: number;
}

interface CartContextType {
  items: CartItem[];
  wishlist: string[];
  addToCart: (
    product: CartProduct,
    size: number,
    color: string,
    quantity?: number,
    stock?: number,
  ) => void;
  removeFromCart: (productId: string, size?: number, color?: string) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    size?: number,
    color?: string,
  ) => void;
  clearCart: () => void;
  toggleWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  cartTotal: number;
  cartCount: number;
  appliedCoupon: AppliedCoupon | null;
  discountAmount: number;
  applyCoupon: (coupon: AppliedCoupon) => void;
  removeCoupon: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;

  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem("cart");
    return saved ? JSON.parse(saved) : [];
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem("wishlist");
    return saved ? JSON.parse(saved) : [];
  });

  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    () => {
      const saved = localStorage.getItem("appliedCoupon");
      return saved ? JSON.parse(saved) : null;
    },
  );

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(items));
  }, [items]);
  useEffect(() => {
    localStorage.setItem("wishlist", JSON.stringify(wishlist));
  }, [wishlist]);
  useEffect(() => {
    if (appliedCoupon)
      localStorage.setItem("appliedCoupon", JSON.stringify(appliedCoupon));
    else localStorage.removeItem("appliedCoupon");
  }, [appliedCoupon]);

  const addToCart = useCallback(
    (
      product: CartProduct,
      size: number,
      color: string,
      quantity: number = 1,
      stock?: number,
    ) => {
      setItems((prev) => {
        const existing = prev.find(
          (i) =>
            i.product.id === product.id && i.size === size && i.color === color,
        );
        if (existing) {
          const newQty = existing.quantity + quantity;
          if (stock !== undefined && newQty > stock) {
            toast.error(`Only ${stock} items available`);
            return prev.map((i) =>
              i === existing ? { ...i, quantity: stock, stock } : i,
            );
          }
          return prev.map((i) =>
            i === existing
              ? {
                  ...i,
                  quantity: newQty,
                  stock: stock !== undefined ? stock : i.stock,
                }
              : i,
          );
        }
        if (stock !== undefined && stock <= 0) {
          toast.error("Item is out of stock");
          return prev;
        }
        const initialQty =
          stock !== undefined && quantity > stock ? stock : quantity;
        if (stock !== undefined && quantity > stock) {
          toast.error(`Only ${stock} items available`);
        }
        return [...prev, { product, quantity: initialQty, size, color, stock }];
      });
    },
    [],
  );

  const removeFromCart = useCallback(
    (productId: string, size?: number, color?: string) => {
      setItems((prev) =>
        prev.filter((i) => {
          if (size !== undefined && color !== undefined) {
            return !(
              i.product.id === productId &&
              i.size === size &&
              i.color === color
            );
          }
          return i.product.id !== productId;
        }),
      );
    },
    [],
  );

  const updateQuantity = useCallback(
    (productId: string, quantity: number, size?: number, color?: string) => {
      if (quantity <= 0) {
        removeFromCart(productId, size, color);
        return;
      }
      setItems((prev) =>
        prev.map((i) => {
          if (
            i.product.id === productId &&
            (size === undefined || i.size === size) &&
            (color === undefined || i.color === color)
          ) {
            if (i.stock !== undefined && quantity > i.stock) {
              toast.error(`Only ${i.stock} items available`);
              return { ...i, quantity: i.stock };
            }
            return { ...i, quantity };
          }
          return i;
        }),
      );
    },
    [removeFromCart],
  );

  const clearCart = useCallback(() => setItems([]), []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlist((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId],
    );
  }, []);

  const isInWishlist = useCallback(
    (productId: string) => wishlist.includes(productId),
    [wishlist],
  );

  const cartTotal = items.reduce((sum, i) => {
    const activePrice =
      isDealer && i.product.dealerPrice != null
        ? i.product.dealerPrice
        : i.product.price;
    return sum + activePrice * i.quantity;
  }, 0);

  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);

  const applyCoupon = useCallback((coupon: AppliedCoupon) => {
    setAppliedCoupon(coupon);
  }, []);

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
  }, []);

  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === "percentage") {
      discountAmount = cartTotal * (appliedCoupon.value / 100);
    } else if (appliedCoupon.type === "fixed") {
      discountAmount = appliedCoupon.value;
    }
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  return (
    <CartContext.Provider
      value={{
        items,
        wishlist,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        toggleWishlist,
        isInWishlist,
        cartTotal,
        cartCount,
        appliedCoupon,
        discountAmount,
        applyCoupon,
        removeCoupon,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
