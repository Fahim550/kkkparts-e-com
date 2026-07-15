import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/data/products";
import { motion } from "framer-motion";
import DirhamIcon from "@/components/DirhamIcon";

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { toggleWishlist, isInWishlist } = useCart();
  const { user, profile } = useAuth();
  const isDealer = !!user && profile?.role === "dealer" && profile?.is_approved;

  const wishlisted = isInWishlist(product.id);
  const hasMultipleImages = product.images && product.images.length > 1;

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
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px 50px 0px" }}
      transition={{ duration: 0.4 }}
      className="group bg-white rounded-xl overflow-hidden shadow-[0_4px_15px_rgba(0,0,0,0.1)] md:hover:shadow-[0_8px_25px_rgba(0,0,0,0.15)] md:hover:-translate-y-1 transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-background">
          <img
            src={product.image}
            alt={product.name}
            width="400"
            height="400"
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${hasMultipleImages ? "group-hover:opacity-0" : "group-hover:scale-105 transition-transform"}`}
            loading="lazy"
          />
          {hasMultipleImages && (
            <img
              src={product.images[1]}
              alt={`${product.name} alternate`}
              width="400"
              height="400"
              decoding="async"
              className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-500 group-hover:scale-105"
              loading="lazy"
            />
          )}

          <button
            onClick={(e) => {
              e.preventDefault();
              toggleWishlist(product.id);
            }}
            aria-label={`Toggle wishlist for ${product.name}`}
            className="absolute bottom-2 right-2 w-7 h-7 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full transition-all hover:bg-background z-20 shadow-sm border border-border/50"
          >
            <Heart
              className={`w-4 h-4 ${wishlisted ? "fill-neon text-neon" : "text-muted-foreground hover:text-foreground"}`}
            />
          </button>
        </div>

        <div className="p-3">
          <h3 className="text-[15px] font-medium text-foreground truncate mb-1.5">
            {product.name}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-[18px] text-blue-500 leading-none flex items-center gap-1">
              <DirhamIcon /> <span>{activePrice}</span>
              {isDealer && product.dealerPrice != null && (
                <span className="text-neon text-[10px] uppercase tracking-wider bg-neon/10 px-1 py-0.5 rounded ml-1">
                  Dealer Price
                </span>
              )}
            </span>
            {activeOriginalPrice && (
              <>
                <span className="text-gray-400 font-medium line-through text-[14px] leading-none flex items-center gap-1">
                  <DirhamIcon /> <span>{activeOriginalPrice}</span>
                </span>
                <span className="text-hot text-[12px] font-bold leading-none">
                  ({discountPercentage}% OFF)
                </span>
              </>
            )}
          </div>

          <div className="mt-2 text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${(product.stock || 0) > 10 ? "bg-green-500" : (product.stock || 0) > 0 ? "bg-orange-500" : "bg-red-500"}`}
            ></span>
            {(product.stock || 0) > 0
              ? `In Stock: ${product.stock}`
              : "Out of Stock"}
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
