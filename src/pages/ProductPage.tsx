import { useParams, Link, useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";
import {
  Star,
  Heart,
  Minus,
  Plus,
  Truck,
  RefreshCw,
  Shield,
  Zap,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { useActiveProducts } from "@/hooks/useDatabase";
import { useProductVariations } from "@/hooks/useProductVariations";
import { useCart } from "@/context/CartContext";
import { useFacebookTracking } from "@/hooks/useFacebookTracking";
import { useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import ProductCard from "@/components/ProductCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductReviews from "@/components/ProductReviews";
import FakePurchaseNotification from "@/components/FakePurchaseNotification";
import CountdownTimer from "@/components/CountdownTimer";
import DirhamIcon from "@/components/DirhamIcon";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ProductPage = () => {
  const { id } = useParams();
  const { data: dbProducts = [], isLoading } = useActiveProducts();
  const { data: variations = [] } = useProductVariations(id || "");
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { fbTrackViewContent, fbTrackAddToCart } = useFacebookTracking();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const allProducts = useMemo(
    () =>
      dbProducts.map((p: any) => {
        const imageUrl = p.image_url || p.image || "/placeholder.svg";
        return {
          id: p.id,
          name: p.name,
          brand: p.brand || p.brands?.name || "",
          price: Number(p.price) || 0,
          originalPrice: p.original_price ? Number(p.original_price) : undefined,
          dealerPrice: p.dealer_price ? Number(p.dealer_price) : undefined,
          dealerOriginalPrice: p.dealer_original_price
            ? Number(p.dealer_original_price)
            : undefined,
          category: (p.category?.slug || p.categories?.slug || p.category) as any,
          image: imageUrl,
          stock: p.stock || 0,
          images: p.image_url ? [p.image_url] : (p.images || [imageUrl]),
          sizes: p.sizes || [],
          colors: p.colors || [],
          description: p.description || "",
          rating: Number(p.rating) || 4.5,
          reviews: p.reviews || 0,
          isTrending: p.is_trending || false,
          isNew: p.is_new || false,
          isOffer: (p as any).is_offer || false,
        };
      }),
    [dbProducts],
  );

  const product = allProducts.find((p) => p.id === id);

  // Auto-select when only one size or color option
  useEffect(() => {
    if (product) {
      if (product.sizes.length === 1) setSelectedSize(String(product.sizes[0]));
      if (product.colors.length === 1) setSelectedColor(product.colors[0]);
    }
  }, [product?.id]);

  const selectedVariation = useMemo(() => {
    if (!selectedSize || !selectedColor || variations.length === 0) return null;
    return (
      variations.find(
        (v) => v.size === String(selectedSize) && v.color === selectedColor,
      ) || null
    );
  }, [selectedSize, selectedColor, variations]);

  const basePrice =
    isDealer && product?.dealerPrice != null
      ? product.dealerPrice
      : product?.price;
  const displayPrice = selectedVariation?.price
    ? Number(selectedVariation.price)
    : basePrice || 0;
  const variationStock = selectedVariation ? selectedVariation.stock : null;
  const currentStock =
    variationStock !== null ? variationStock : product?.stock;

  useEffect(() => {
    if (product) {
      fbTrackViewContent({
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        value: product.price,
      });
    }
  }, [product?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex h-[80vh] items-center justify-center pt-20">
          <Loader2 className="w-12 h-12 animate-spin text-neon" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center">
          <h1 className="heading-display text-3xl font-bold mb-4 text-foreground">
            {t("product.not_found")}
          </h1>
          <Link to="/parts" className="text-neon font-body text-sm underline">
            {t("product.back_to_shop")}
          </Link>
        </div>
      </div>
    );
  }

  const galleryImages =
    product.images.length > 0 ? product.images : [product.image];
  const related = allProducts
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);
  const wishlisted = isInWishlist(product.id);
  const productNames = allProducts.map((p) => p.name);

  const validateSelection = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      toast.error(t("product.select_size_error"));
      return false;
    }
    if (product.colors.length > 0 && !selectedColor) {
      toast.error(t("product.select_color_error"));
      return false;
    }
    if ((currentStock || 0) <= 0) {
      toast.error(t("product.out_of_stock_error"));
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    const cartProduct = { ...product, price: displayPrice };
    addToCart(
      cartProduct,
      selectedSize,
      selectedColor,
      quantity,
      currentStock !== null ? currentStock : undefined,
    );
    fbTrackAddToCart({
      content_ids: [product.id],
      content_name: product.name,
      value: displayPrice * quantity,
      num_items: quantity,
    });
    toast.success(`${product.name} ${t("product.added_to_cart")}`);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    const cartProduct = { ...product, price: displayPrice };
    addToCart(
      cartProduct,
      selectedSize,
      selectedColor,
      quantity,
      currentStock !== null ? currentStock : undefined,
    );
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-28 lg:pt-32">
        <div className="container mx-auto px-4 lg:px-8 pb-8 pt-4">
          <div className="flex flex-wrap items-center gap-2 font-body text-sm text-muted-foreground mb-8">
            <Link
              to="/"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {t("nav.home")}
            </Link>
            <span>/</span>
            <Link
              to="/parts"
              className="hover:text-foreground transition-colors whitespace-nowrap"
            >
              {t("nav.shop")}
            </Link>
            <span>/</span>
            <span className="text-foreground truncate flex-1 min-w-0">
              {product.name}
            </span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="min-w-0 lg:sticky lg:top-28">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full bg-gray-50/50 p-6 md:p-10 rounded-lg border border-gray-100 mb-4 flex items-center justify-center"
              >
                <img
                  src={galleryImages[selectedImage]}
                  alt={product.name}
                  className="w-full h-auto max-h-[60vh] object-contain mix-blend-multiply"
                />
              </motion.div>
              {galleryImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-4 w-full max-w-full hide-scrollbar snap-x snap-mandatory px-1">
                  {galleryImages.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 md:w-24 md:h-24 shrink-0 rounded-md overflow-hidden border transition-all snap-center p-2 bg-white ${selectedImage === i ? "border-neon shadow-sm ring-1 ring-neon/20" : "border-gray-200 hover:border-neon/50"}`}
                    >
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-contain mix-blend-multiply"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div
              className="min-w-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <span className="flex items-center gap-2 text-neon font-body text-xs font-bold tracking-[0.2em] uppercase mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-neon"></div>
                {product.brand}
              </span>
              <h1 className="heading-display text-2xl md:text-3xl lg:text-4xl font-black mt-1 mb-5 text-gray-900 break-words uppercase tracking-tight leading-none">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mb-8 pb-6 border-b border-gray-100">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 md:w-5 md:h-5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200 fill-gray-100"}`}
                    />
                  ))}
                </div>
                <span className="font-body text-sm font-medium text-gray-500">
                  ({product.reviews.toLocaleString()} {t("product.reviews")})
                </span>
              </div>

              <CountdownTimer />

              <div className="flex flex-wrap items-end gap-4 mb-8">
                <span className="font-heading text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center">
                  <DirhamIcon className="mr-2" />
                  {Number(displayPrice || 0).toFixed(2)}
                </span>
                {isDealer &&
                  product.dealerPrice != null &&
                  !selectedVariation?.price && (
                    <span className="bg-neon/10 text-neon px-2 py-1 mb-2 text-[10px] font-bold tracking-widest uppercase rounded-sm border border-neon/20">
                      Dealer Price
                    </span>
                  )}
                {product.originalPrice != null && Number(product.originalPrice) > 0 && (
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className="font-body text-lg font-bold text-gray-400 line-through decoration-gray-300 flex items-center">
                      <DirhamIcon className="mr-1 opacity-50" />
                      {Number(product.originalPrice).toFixed(2)}
                    </span>
                    <span className="bg-red-500 text-white px-2.5 py-1 text-[11px] font-black tracking-widest uppercase rounded-sm">
                      {Math.round(
                        (1 - displayPrice / product.originalPrice) * 100,
                      )}
                      % OFF
                    </span>
                  </div>
                )}
              </div>

              {currentStock !== undefined && (
                <div className="mb-6 flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${currentStock > 0 ? "bg-green-500" : "bg-red-500"}`}></div>
                  <p
                    className={`font-body text-sm font-bold tracking-wide uppercase ${currentStock > 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {(currentStock || 0) > 0
                      ? `${currentStock} ${t("product.in_stock")}`
                      : t("product.out_of_stock")}
                  </p>
                </div>
              )}

              <p className="font-body text-gray-500 leading-relaxed mb-8 text-sm md:text-base">
                {product.description}
              </p>

              {product.sizes.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-heading font-black uppercase tracking-widest text-xs mb-3 text-gray-900">
                    {t("product.select_size")}
                  </h3>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.sizes.map((size) => (
                      <button
                        key={String(size)}
                        onClick={() => setSelectedSize(String(size))}
                        className={`w-14 h-14 border font-body text-sm font-bold rounded-sm transition-colors flex items-center justify-center ${selectedSize === String(size) ? "border-neon bg-neon text-white" : "border-gray-200 text-gray-600 bg-white hover:border-neon/50"}`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div className="mb-10">
                  <h3 className="font-heading font-black uppercase tracking-widest text-xs mb-3 text-gray-900">
                    {t("product.color")}
                  </h3>
                  <div className="flex flex-wrap gap-2 md:gap-3">
                    {product.colors.map((color) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-6 py-3 border font-body text-xs font-bold uppercase tracking-widest rounded-sm transition-colors ${selectedColor === color ? "border-neon bg-neon text-white" : "border-gray-200 text-gray-600 bg-white hover:border-neon/50"}`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center bg-gray-50 border border-gray-200 rounded-sm h-14 px-1">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-sm flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-12 h-10 flex items-center justify-center font-body text-base font-black text-gray-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 rounded-sm flex items-center justify-center hover:bg-gray-200 transition-colors text-gray-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={(currentStock || 0) <= 0}
                  className="flex-1 min-w-[200px] h-14 bg-neon text-white font-body text-xs md:text-sm font-bold tracking-[0.1em] uppercase hover:bg-neon/90 hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(37,99,235,0.39)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.23)] transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(currentStock || 0) <= 0
                    ? t("product.out_of_stock")
                    : t("product.add_to_cart")}
                </button>
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`w-14 h-14 flex items-center justify-center rounded-sm transition-all border ${wishlisted ? "bg-neon/10 border-neon text-neon" : "bg-white border-gray-200 text-gray-400 hover:border-neon hover:text-neon"}`}
                >
                  <Heart
                    className={`w-5 h-5 ${wishlisted ? "fill-neon" : ""}`}
                  />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                <button
                  onClick={handleBuyNow}
                  disabled={(currentStock || 0) <= 0}
                  className="w-full h-14 bg-gray-900 text-white font-body text-xs md:text-sm font-bold tracking-[0.1em] uppercase hover:bg-gray-800 hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(0,0,0,0.2)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.15)] transition-all rounded-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("product.buy_now")}
                </button>

                <a
                  href={`https://wa.me/96879458035?text=${encodeURIComponent(`Hi! I'd like to order:\n\nProduct: ${product.name}\nBrand: ${product.brand}${product.sizes.length > 0 ? `\nSize: ${selectedSize || "Not selected"}` : ""}${product.colors.length > 0 ? `\nColor: ${selectedColor || "Not selected"}` : ""}\nQuantity: ${quantity}\nPrice: OMR ${displayPrice}\n\nPlease confirm my order. Thank you!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full h-14 bg-[#25D366] text-white font-body text-xs md:text-sm font-bold tracking-[0.1em] uppercase hover:bg-[#20bd5a] hover:-translate-y-0.5 shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] hover:shadow-[0_6px_20px_rgba(37,211,102,0.23)] transition-all rounded-sm flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-5 h-5" />
                  Order on WhatsApp
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-100">
                {[
                  { icon: Shield, text: t("product.authentic") },
                  { icon: Truck, text: t("product.free_delivery") },
                  { icon: RefreshCw, text: t("product.return_policy") },
                  { icon: Zap, text: t("product.cod") },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 font-body text-sm text-gray-600 bg-gray-50/50 p-3 rounded-sm border border-gray-100"
                  >
                    <item.icon className="w-4 h-4 text-neon shrink-0" />
                    <span className="font-medium">{item.text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <ProductReviews productId={product.id} />

          {related.length > 0 && (
            <section className="mt-10">
              <h2 className="heading-display text-lg md:text-2xl font-bold mb-6 text-foreground uppercase">
                {t("product.related")}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {related.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      <FakePurchaseNotification productNames={productNames} />
      <Footer />
    </div>
  );
};

export default ProductPage;
