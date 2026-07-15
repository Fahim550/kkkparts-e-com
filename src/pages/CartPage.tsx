import { Link } from "react-router-dom";
import { Minus, Plus, X, ArrowRight, ShoppingBag } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import DirhamIcon from "@/components/DirhamIcon";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CartPage = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    cartTotal,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    discountAmount,
  } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;
  const cartCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const isDealerMOQMet = true; // Minimum order quantity removed

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <div className="pt-32 pb-32 text-center px-4 flex-1 flex flex-col items-center justify-center">
          <ShoppingBag className="w-16 h-16 mx-auto mb-6 text-muted-foreground" />
          <h1 className="heading-display text-4xl font-bold mb-4 text-foreground">
            {t("cart.empty")}
          </h1>
          <p className="font-body text-muted-foreground mb-8">
            {t("cart.empty_subtitle")}
          </p>
          <Link
            to="/parts"
            className="inline-flex items-center gap-2 bg-neon text-accent-foreground px-8 py-4 font-body text-sm font-bold tracking-wider uppercase glow-neon hover:bg-neon-glow transition-all rounded-sm"
          >
            {t("hero.shop_now")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const shipping = cartTotal >= 30 ? 0 : 3;
  const finalTotal = cartTotal - discountAmount + shipping;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.trim().toUpperCase())
        .single();

      if (error || !data) {
        toast.error(t("cart.invalid_coupon") || "Invalid coupon code");
        return;
      }

      if (!data.is_active) {
        toast.error("This coupon is no longer active");
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast.error("This coupon has expired");
        return;
      }

      if (data.min_order && cartTotal < Number(data.min_order)) {
        toast.error(
          `Minimum order amount is ${data.min_order} to use this coupon`,
        );
        return;
      }

      if (
        data.max_uses &&
        data.used_count &&
        data.used_count >= data.max_uses
      ) {
        toast.error("This coupon has reached its usage limit");
        return;
      }

      applyCoupon({
        code: data.code,
        type: data.type,
        value: Number(data.value),
      });
      toast.success("Coupon applied successfully");
      setCouponCode("");
    } catch (err) {
      toast.error("Failed to validate coupon");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20 lg:pt-24">
        <div className="container mx-auto px-4 lg:px-8 py-10">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="heading-display text-4xl md:text-5xl font-bold mb-10 text-foreground"
          >
            {t("cart.title")}
          </motion.h1>

          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6 min-w-0">
              {items.map((item) => (
                <motion.div
                  key={item.product.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-4 sm:gap-6 border-b border-border pb-6"
                >
                  <Link
                    to={`/product/${item.product.id}`}
                    className="w-24 h-24 sm:w-32 sm:h-32 bg-card shrink-0 overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0 flex-1">
                        <span className="font-body text-xs text-neon font-bold tracking-wider uppercase block truncate">
                          {item.product.brand}
                        </span>
                        <Link
                          to={`/product/${item.product.id}`}
                          className="block font-heading font-bold text-sm sm:text-base uppercase tracking-wide text-foreground hover-neon transition-colors truncate"
                        >
                          {item.product.name}
                        </Link>
                        {(item.size || item.color) && (
                          <p className="font-body text-xs text-muted-foreground mt-1">
                            {[
                              item.size ? `${t("size")}: ${item.size}` : null,
                              item.color,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() =>
                          removeFromCart(item.product.id, item.size, item.color)
                        }
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center justify-between mt-4 gap-2">
                      <div className="flex items-center border border-border rounded-sm shrink-0">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity - 1,
                              item.size,
                              item.color,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 h-8 flex items-center justify-center font-body text-xs font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.product.id,
                              item.quantity + 1,
                              item.size,
                              item.color,
                            )
                          }
                          className="w-8 h-8 flex items-center justify-center hover:bg-card transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <span className="font-heading font-bold text-blue-500">
                        <DirhamIcon className="w-[2em] mr-1" />
                        {(item.product.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="bg-card p-6 sm:p-8 border border-border rounded-lg h-fit min-w-0">
              <h2 className="font-heading text-xl font-bold uppercase tracking-wider mb-6 text-foreground">
                {t("cart.order_summary")}
              </h2>
              <div className="space-y-3 font-body text-sm border-b border-border pb-6 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.subtotal")}
                  </span>
                  <span className="text-foreground">
                    <DirhamIcon className="w-[2em] mr-1" />
                    {cartTotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {t("cart.shipping")}
                  </span>
                  <span className="text-foreground flex items-center">
                    {shipping === 0 ? (
                      t("cart.free")
                    ) : (
                      <>
                        <DirhamIcon className="w-[2.5em] mr-1" />
                        {shipping.toFixed(2)}
                      </>
                    )}
                  </span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount ({appliedCoupon.code})</span>
                    <span className="flex items-center">
                      -<DirhamIcon className="w-[2em] mx-1" />
                      {discountAmount.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>

              {!appliedCoupon ? (
                <div className="flex gap-2 mb-6">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) =>
                      setCouponCode(e.target.value.toUpperCase())
                    }
                    placeholder="Coupon Code"
                    className="flex-1 min-w-0 bg-background border border-border px-4 py-2 rounded-md font-body text-sm text-foreground focus:outline-none focus:border-primary uppercase"
                  />
                  <button
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponCode.trim()}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 disabled:opacity-50 transition-all"
                  >
                    {isValidating ? "..." : "Apply"}
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-2 bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-md mb-6 font-body text-sm">
                  <div className="truncate">
                    <span className="font-bold">{appliedCoupon.code}</span>{" "}
                    applied!
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-green-800 hover:text-green-900 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex justify-between font-heading text-xl font-bold mb-8 text-foreground">
                <span>{t("cart.total")}</span>
                <span className="text-blue-500 flex items-center font-bold">
                  <DirhamIcon className="w-[2.5em] mr-1" />
                  {finalTotal.toFixed(2)}
                </span>
              </div>

              <Link
                to="/checkout"
                className="w-full block text-center bg-primary text-primary-foreground py-4 font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all duration-300 rounded-md mb-3"
              >
                {t("cart.checkout")}
              </Link>

              <p className="text-center font-body text-xs text-muted-foreground">
                {t("cart.cod_available")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartPage;
