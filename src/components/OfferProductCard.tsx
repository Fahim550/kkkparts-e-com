import { Link } from "react-router-dom";
import { Heart, Tag, Clock, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/data/products";
import { motion } from "framer-motion";
import DirhamIcon from "@/components/DirhamIcon";

interface OfferProductCardProps {
  product: Product;
}

const OfferProductCard = ({ product }: OfferProductCardProps) => {
  const { toggleWishlist, isInWishlist } = useCart();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;
  const wishlisted = isInWishlist(product.id);

  const activePrice =
    isDealer && product.dealerPrice != null
      ? product.dealerPrice
      : product.price;
  const activeOriginalPrice =
    isDealer && product.dealerOriginalPrice != null
      ? product.dealerOriginalPrice
      : product.originalPrice;

  const discountPercentage = activeOriginalPrice
    ? Math.round(
        ((activeOriginalPrice - activePrice) / activeOriginalPrice) * 100,
      )
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px 50px 0px" }}
      transition={{ duration: 0.4 }}
      className="group relative bg-card rounded-2xl overflow-hidden border border-border shadow-sm hover:shadow-xl hover:border-primary/40 transition-all duration-300 w-full flex flex-row h-[220px]"
    >
      {/* Left Side: Image Area */}
      <div className="relative w-[45%] h-full bg-secondary/10 overflow-hidden shrink-0">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <img
            src={product.image}
            alt={product.name}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-700 ease-in-out"
            loading="lazy"
          />
        </Link>

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 z-20 bg-destructive text-destructive-foreground font-bold text-[11px] px-2.5 py-1 rounded-full shadow-sm flex items-center">
            {discountPercentage}% OFF
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id);
          }}
          aria-label={`Toggle wishlist for ${product.name}`}
          className="absolute bottom-3 left-3 w-8 h-8 flex items-center justify-center bg-background/80 backdrop-blur-md rounded-full transition-all hover:bg-background z-20 shadow-sm border border-border/50"
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
          />
        </button>
      </div>

      {/* Right Side: Details */}
      <div className="w-[55%] p-4 sm:p-5 flex flex-col justify-between relative bg-gradient-to-r from-transparent to-secondary/5">
        <div>
          {/* Top Label */}
          <div className="flex items-center gap-1.5 mb-2">
            <span className="bg-primary/10 text-primary text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1">
              <Tag className="w-3 h-3" /> Special Deal
            </span>
          </div>

          <Link to={`/product/${product.id}`} className="block">
            {/* Title & Brand */}
            <h3 className="text-base sm:text-lg font-bold text-foreground line-clamp-2 leading-tight group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="text-[12px] text-muted-foreground mt-1 uppercase tracking-wider font-medium">
              {product.brand}
            </p>
          </Link>
        </div>

        <div className="mt-2">
          {/* Price */}
          <div className="flex items-end gap-2 mb-3">
            <span className="font-heading font-black text-2xl text-primary leading-none flex items-baseline gap-1">
              <span className="text-sm font-bold">
                <DirhamIcon />
              </span>{" "}
              {activePrice}
            </span>
            {activeOriginalPrice && (
              <>
                <span className="text-muted-foreground font-medium line-through text-xs flex items-baseline gap-1 pb-0.5 opacity-70">
                  <span className="text-[10px]">
                    <DirhamIcon />
                  </span>{" "}
                  {activeOriginalPrice}
                </span>
                <span className="text-hot text-[12px] font-bold leading-none self-end pb-1">
                  ({discountPercentage}% OFF)
                </span>
              </>
            )}
          </div>

          <div className="pt-2 border-t border-border/60">
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-bold text-foreground">
                {(product.stock || 0) > 0
                  ? `In Stock: ${product.stock}`
                  : "Out of Stock"}
              </span>
              <span className="text-muted-foreground">
                {product.stock || 0} left
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full ${(product.stock || 0) > 10 ? "bg-green-500" : (product.stock || 0) > 0 ? "bg-orange-500" : "bg-red-500"} rounded-full`}
                style={{
                  width: `${Math.min(((product.stock || 0) / 50) * 100, 100)}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default OfferProductCard;
