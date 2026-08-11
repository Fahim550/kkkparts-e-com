import { CartProduct } from "@/context/CartContext";
import { CheckCircle, ChevronLeft, ChevronRight, Minus, Plus, ShoppingCart, X, XCircle } from "lucide-react";
import React from "react";

interface ProductDetailModalProps {
  selectedProduct: CartProduct | null;
  setSelectedProduct: (product: CartProduct | null) => void;
  isApproved: boolean;
  quantities: Record<string, number>;
  handleQuantityChange: (id: string, delta: number) => void;
  handleAddToCart: (product: CartProduct) => void;
  activeImageIdx: number;
  setActiveImageIdx: React.Dispatch<React.SetStateAction<number>>;
}

export function ProductDetailModal({
  selectedProduct,
  setSelectedProduct,
  isApproved,
  quantities,
  handleQuantityChange,
  handleAddToCart,
  activeImageIdx,
  setActiveImageIdx,
}: ProductDetailModalProps) {
  if (!selectedProduct) return null;

  const p = selectedProduct;
  const qty = quantities[p.id] || 1;
  const wholesalePrice = isApproved
    ? p.dealerPrice || Math.round(p.price * 0.8)
    : p.price;
  const hasDealerDiscount = isApproved && wholesalePrice < p.price;
  const stockVal = p.stock ?? 0;
  const inStock = stockVal > 0;

  // Build image list: prefer p.images array, fallback to single image
  const images: string[] = Array.isArray(p.images) && p.images.length > 0
    ? p.images
    : [p.image || "/placeholder.svg"];
  const hasMultiple = images.length > 1;

  const prevImg = () => setActiveImageIdx((i: number) => (i - 1 + images.length) % images.length);
  const nextImg = () => setActiveImageIdx((i: number) => (i + 1) % images.length);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={() => setSelectedProduct(null)}
      />

      {/* Centered Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-7 py-4 border-b border-gray-100 shrink-0">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                Product Details
              </p>
              <h2 className="font-black text-gray-900 text-lg leading-tight">{p.name}</h2>
            </div>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-2.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body – two column on lg */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-0">
              {/* LEFT: Image Gallery */}
              <div className="bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-100 flex flex-col p-6 gap-4">
                {/* Main Image */}
                <div
                  className="relative rounded-2xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center"
                  style={{ minHeight: 280 }}
                >
                  <img
                    key={activeImageIdx}
                    src={images[activeImageIdx]}
                    alt={`${p.name} – image ${activeImageIdx + 1}`}
                    className="w-full h-72 object-contain p-4"
                  />
                  {/* Stock Badge */}
                  <span
                    className={`absolute top-3 left-3 inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${
                      inStock
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {inStock ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" /> In Stock ({stockVal})
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3.5 h-3.5" /> Out of Stock
                      </>
                    )}
                  </span>

                  {/* Prev / Next arrows – only when multiple images */}
                  {hasMultiple && (
                    <>
                      <button
                        onClick={prevImg}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImg}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-white transition-colors"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  {/* Image counter */}
                  {hasMultiple && (
                    <span className="absolute bottom-3 right-3 bg-black/50 text-white text-[11px] font-bold px-2.5 py-1 rounded-full">
                      {activeImageIdx + 1} / {images.length}
                    </span>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {hasMultiple && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIdx(idx)}
                        className={`shrink-0 w-16 h-16 rounded-xl border-2 overflow-hidden transition-all ${
                          idx === activeImageIdx
                            ? "border-primary shadow-md shadow-primary/20"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <img
                          src={src}
                          alt={`Thumb ${idx + 1}`}
                          className="w-full h-full object-contain p-1 bg-white"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* RIGHT: Details */}
              <div className="p-7 space-y-5 overflow-y-auto">
                {/* Brand & Category */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border border-primary/20">
                    {p.brand || "Generic"}
                  </span>
                  <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold capitalize border border-gray-200">
                    {p.category || "General"}
                  </span>
                </div>

                {/* Name + ID */}
                <div>
                  <h3 className="text-2xl font-black text-gray-900 leading-tight">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-1 font-mono">ID: {p.id}</p>
                </div>

                {/* Pricing */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-100 p-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                    Price
                  </p>
                  <div className="flex items-end gap-3">
                    <div className="flex items-baseline gap-1">
                      <span className="text-sm text-gray-500 font-semibold">AED</span>
                      <span className="text-4xl font-black text-gray-900">
                        {wholesalePrice.toLocaleString()}
                      </span>
                    </div>
                    {hasDealerDiscount && (
                      <div className="mb-1 flex items-center gap-2">
                        <span className="line-through text-sm text-gray-400">
                          AED {p.price.toLocaleString()}
                        </span>
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase">
                          Partner Rate
                        </span>
                      </div>
                    )}
                    {!hasDealerDiscount && (
                      <span className="mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Standard Rate
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {p.description && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Description
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{p.description}</p>
                  </div>
                )}

                {/* Sizes */}
                {Array.isArray(p.sizes) && p.sizes.length > 0 && p.sizes[0] !== 40 && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Available Sizes
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.sizes.map((s: any) => (
                        <span
                          key={s}
                          className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Colors */}
                {Array.isArray(p.colors) && p.colors.length > 0 && p.colors[0] !== "Standard" && (
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1.5">
                      Available Colors
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {p.colors.map((c: any) => (
                        <span
                          key={c}
                          className="px-3 py-1 rounded-lg bg-gray-100 text-gray-700 text-xs font-bold border border-gray-200 capitalize"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + Add to Order */}
                <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200">
                    <button
                      onClick={() => handleQuantityChange(p.id, -1)}
                      className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-black text-base text-gray-900">
                      {qty}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(p.id, 1)}
                      className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    onClick={() => {
                      handleAddToCart(p);
                      setSelectedProduct(null);
                    }}
                    disabled={!inStock}
                    className="flex-1 bg-primary hover:bg-primary/90 text-white py-3 rounded-xl font-bold text-sm uppercase tracking-wider shadow-md shadow-primary/25 transition-all inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    {inStock ? `Add ${qty} to Order` : "Out of Stock"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
