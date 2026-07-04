import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useMemo, useEffect } from 'react';
import { Star, Heart, Minus, Plus, Truck, RefreshCw, Shield, Zap, MessageCircle, Loader2 } from 'lucide-react';
import { useActiveProducts } from '@/hooks/useDatabase';
import { useProductVariations } from '@/hooks/useProductVariations';
import { useCart } from '@/context/CartContext';
import { useFacebookTracking } from '@/hooks/useFacebookTracking';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import ProductCard from '@/components/ProductCard';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductReviews from '@/components/ProductReviews';
import FakePurchaseNotification from '@/components/FakePurchaseNotification';
import CountdownTimer from '@/components/CountdownTimer';
import DirhamIcon from '@/components/DirhamIcon';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

const ProductPage = () => {
  const { id } = useParams();
  const { data: dbProducts = [], isLoading } = useActiveProducts();
  const { data: variations = [] } = useProductVariations(id || '');
  const { addToCart, toggleWishlist, isInWishlist } = useCart();
  const { fbTrackViewContent, fbTrackAddToCart } = useFacebookTracking();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === 'dealer' && profile?.is_approved;

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);

  const allProducts = useMemo(() => dbProducts.map(p => ({
    id: p.id, name: p.name, brand: p.brand, price: Number(p.price),
    originalPrice: p.original_price ? Number(p.original_price) : undefined,
    dealerPrice: p.dealer_price ? Number(p.dealer_price) : undefined,
    dealerOriginalPrice: p.dealer_original_price ? Number(p.dealer_original_price) : undefined,
    category: p.category as any, image: p.image,
    stock: p.stock || 0,
    images: p.images || [p.image], sizes: p.sizes || [], colors: p.colors || [],
    description: p.description || '', rating: Number(p.rating) || 4.5,
    reviews: p.reviews || 0, isTrending: p.is_trending || false, isNew: p.is_new || false, isOffer: (p as any).is_offer || false,
  })), [dbProducts]);

  const product = allProducts.find(p => p.id === id);

  // Auto-select when only one size or color option
  useEffect(() => {
    if (product) {
      if (product.sizes.length === 1) setSelectedSize(String(product.sizes[0]));
      if (product.colors.length === 1) setSelectedColor(product.colors[0]);
    }
  }, [product?.id]);

  const selectedVariation = useMemo(() => {
    if (!selectedSize || !selectedColor || variations.length === 0) return null;
    return variations.find(v => v.size === String(selectedSize) && v.color === selectedColor) || null;
  }, [selectedSize, selectedColor, variations]);

  const basePrice = isDealer && product?.dealerPrice != null ? product.dealerPrice : product?.price;
  const displayPrice = selectedVariation?.price ? Number(selectedVariation.price) : basePrice || 0;
  const variationStock = selectedVariation ? selectedVariation.stock : null;
  const currentStock = variationStock !== null ? variationStock : product?.stock;

  useEffect(() => {
    if (product) {
      fbTrackViewContent({
        content_ids: [product.id], content_name: product.name,
        content_category: product.category, value: product.price,
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
          <h1 className="heading-display text-3xl font-bold mb-4 text-foreground">{t('product.not_found')}</h1>
          <Link to="/parts" className="text-neon font-body text-sm underline">{t('product.back_to_shop')}</Link>
        </div>
      </div>
    );
  }

  const galleryImages = product.images.length > 0 ? product.images : [product.image];
  const related = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);
  const wishlisted = isInWishlist(product.id);
  const productNames = allProducts.map(p => p.name);

  const validateSelection = () => {
    if (product.sizes.length > 0 && !selectedSize) { toast.error(t('product.select_size_error')); return false; }
    if (product.colors.length > 0 && !selectedColor) { toast.error(t('product.select_color_error')); return false; }
    if ((currentStock || 0) <= 0) { toast.error(t('product.out_of_stock_error')); return false; }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateSelection()) return;
    const cartProduct = { ...product, price: displayPrice };
    addToCart(cartProduct, selectedSize, selectedColor, quantity, currentStock !== null ? currentStock : undefined);
    fbTrackAddToCart({
      content_ids: [product.id], content_name: product.name,
      value: displayPrice * quantity, num_items: quantity,
    });
    toast.success(`${product.name} ${t('product.added_to_cart')}`);
  };

  const handleBuyNow = () => {
    if (!validateSelection()) return;
    const cartProduct = { ...product, price: displayPrice };
    addToCart(cartProduct, selectedSize, selectedColor, quantity, currentStock !== null ? currentStock : undefined);
    navigate('/checkout');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 lg:pt-36">
        <div className="container mx-auto px-4 lg:px-8 py-8">
          <div className="flex flex-wrap items-center gap-2 font-body text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-foreground transition-colors whitespace-nowrap">{t('nav.home')}</Link><span>/</span>
            <Link to="/parts" className="hover:text-foreground transition-colors whitespace-nowrap">{t('nav.shop')}</Link><span>/</span>
            <span className="text-foreground truncate flex-1 min-w-0">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            <div className="min-w-0 lg:sticky lg:top-28">
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-full bg-card overflow-hidden rounded-lg border border-border mb-4 flex items-center justify-center">
                <img src={galleryImages[selectedImage]} alt={product.name} className="w-full h-auto max-h-[60vh] object-contain" />
              </motion.div>
              {galleryImages.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2 w-full max-w-full hide-scrollbar snap-x snap-mandatory">
                  {galleryImages.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)}
                      className={`w-20 h-20 shrink-0 rounded-md overflow-hidden border-2 transition-all snap-center ${selectedImage === i ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <motion.div className="min-w-0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <span className="font-body text-sm text-neon font-bold tracking-wider uppercase">{product.brand}</span>
              <h1 className="heading-display text-3xl md:text-4xl font-bold mt-1 mb-4 text-foreground break-words">{product.name}</h1>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-neon text-neon' : 'text-border'}`} />
                  ))}
                </div>
                <span className="font-body text-sm text-muted-foreground">({product.reviews.toLocaleString()} {t('product.reviews')})</span>
              </div>

              <CountdownTimer />

              <div className="flex flex-wrap items-center gap-3 mb-8">
                <span className="font-heading lg:text-3xl md:text-2xl text-2xl font-bold text-blue-500"><DirhamIcon className="mr-2" />{displayPrice}</span>
                {isDealer && product.dealerPrice != null && !selectedVariation?.price && (
                  <span className="bg-neon/10 text-neon px-2 py-1 text-[10px] font-bold tracking-wider uppercase rounded-sm">Dealer Price</span>
                )}
                {product.originalPrice && (
                  <>
                    <span className="font-body text-lg text-muted-foreground line-through"><DirhamIcon className="mr-1" />{product.originalPrice}</span>
                    <span className="bg-destructive text-destructive-foreground px-2 py-1 text-xs font-body font-bold tracking-wider uppercase rounded-sm">
                      {Math.round((1 - displayPrice / product.originalPrice) * 100)}% OFF
                    </span>
                  </>
                )}
              </div>

              {currentStock !== undefined && (
                <p className={`font-body text-sm mb-4 ${(currentStock || 0) > 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {(currentStock || 0) > 0 ? `${currentStock} ${t('product.in_stock')}` : t('product.out_of_stock')}
                </p>
              )}

              <p className="font-body text-muted-foreground leading-relaxed mb-8">{product.description}</p>

              {product.sizes.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-heading font-bold uppercase tracking-wider text-sm mb-3 text-foreground">{t('product.select_size')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.sizes.map(size => (
                      <button key={String(size)} onClick={() => setSelectedSize(String(size))}
                        className={`w-12 h-12 border font-body text-sm font-semibold rounded-sm transition-all ${selectedSize === String(size) ? 'border-neon bg-neon text-accent-foreground glow-neon' : 'border-border text-foreground hover:border-neon/50'}`}>
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.colors.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-heading font-bold uppercase tracking-wider text-sm mb-3 text-foreground">{t('product.color')}</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.colors.map(color => (
                      <button key={color} onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border font-body text-sm font-medium rounded-sm transition-all ${selectedColor === color ? 'border-neon bg-neon text-accent-foreground' : 'border-border text-foreground hover:border-neon/50'}`}>
                        {color}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 mb-8">
                <div className="flex items-center border border-border rounded-sm">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-12 flex items-center justify-center hover:bg-card transition-colors"><Minus className="w-4 h-4" /></button>
                  <span className="w-12 h-12 flex items-center justify-center font-body text-sm font-bold">{quantity}</span>
                  <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-12 flex items-center justify-center hover:bg-card transition-colors"><Plus className="w-4 h-4" /></button>
                </div>
                <button onClick={handleAddToCart}
                  disabled={(currentStock || 0) <= 0}
                  className="flex-1 min-w-[150px] h-12 bg-neon text-accent-foreground font-body text-sm font-bold tracking-wider uppercase hover:bg-neon-glow transition-all duration-300 glow-neon rounded-sm disabled:opacity-50 disabled:cursor-not-allowed">
                  {(currentStock || 0) <= 0 ? t('product.out_of_stock') : t('product.add_to_cart')}
                </button>
                <button onClick={() => toggleWishlist(product.id)}
                  className={`w-12 h-12 border flex items-center justify-center rounded-sm transition-all ${wishlisted ? 'border-neon bg-neon/10' : 'border-border hover:border-neon/50'}`}>
                  <Heart className={`w-5 h-5 ${wishlisted ? 'fill-neon text-neon' : 'text-foreground'}`} />
                </button>
              </div>

              <button onClick={handleBuyNow}
                disabled={(currentStock || 0) <= 0}
                className="w-full h-12 bg-foreground text-background font-body text-sm font-bold tracking-wider uppercase hover:bg-foreground/90 transition-all duration-300 rounded-sm disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                {t('product.buy_now')}
              </button>

              <a
                href={`https://wa.me/96879458035?text=${encodeURIComponent(`Hi! I'd like to order:\n\nProduct: ${product.name}\nBrand: ${product.brand}${product.sizes.length > 0 ? `\nSize: ${selectedSize || 'Not selected'}` : ''}${product.colors.length > 0 ? `\nColor: ${selectedColor || 'Not selected'}` : ''}\nQuantity: ${quantity}\nPrice: OMR ${displayPrice}\n\nPlease confirm my order. Thank you!`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 bg-[#25D366] text-white font-body text-sm font-bold tracking-wider uppercase hover:bg-[#20bd5a] transition-all duration-300 rounded-sm flex items-center justify-center gap-2 mb-8"
              >
                <MessageCircle className="w-5 h-5" />
                Order on WhatsApp
              </a>

              <div className="space-y-3 border-t border-border pt-6">
                {[
                  { icon: Shield, text: t('product.authentic') },
                  { icon: Truck, text: t('product.free_delivery') },
                  { icon: RefreshCw, text: t('product.return_policy') },
                  { icon: Zap, text: t('product.cod') },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 font-body text-sm text-muted-foreground">
                    <item.icon className="w-4 h-4 text-neon shrink-0" />{item.text}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          <ProductReviews productId={product.id} />

          {related.length > 0 && (
            <section className="mt-16 pt-10 border-t border-border">
              <h2 className="heading-display text-xl md:text-3xl font-bold mb-8 text-foreground">{t('product.related')}</h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-6">
                {related.map(p => <ProductCard key={p.id} product={p} />)}
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
