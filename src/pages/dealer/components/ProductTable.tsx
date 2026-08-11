import DirhamIcon from "@/components/DirhamIcon";
import { CartProduct } from "@/context/CartContext";
import { CheckCircle, Eye, Minus, Package, Plus, ShoppingCart, Warehouse, XCircle } from "lucide-react";
import React from "react";

interface ProductTableProps {
  selectedWarehouse: string;
  setSelectedWarehouse: (val: string) => void;
  warehouses: any[];
  isLoading: boolean;
  filteredProducts: CartProduct[];
  quantities: Record<string, number>;
  handleQuantityChange: (id: string, delta: number) => void;
  isApproved: boolean;
  setSelectedProduct: (product: CartProduct) => void;
  setActiveImageIdx: (idx: number) => void;
  handleAddToCart: (product: CartProduct) => void;
}

export function ProductTable({
  selectedWarehouse,
  setSelectedWarehouse,
  warehouses,
  isLoading,
  filteredProducts,
  quantities,
  handleQuantityChange,
  isApproved,
  setSelectedProduct,
  setActiveImageIdx,
  handleAddToCart,
}: ProductTableProps) {
  if (!selectedWarehouse) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-10 text-center text-amber-900 shadow-sm m-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <Warehouse className="w-7 h-7 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Select a Warehouse to View Live Stock
          </h3>
          <p className="text-sm text-gray-600 max-w-md mx-auto mb-6 leading-relaxed">
            Please select a warehouse from the filter above (or select <strong>All Warehouses</strong>) to view exact stock quantities and place orders.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl mx-auto">
            <button
              onClick={() => setSelectedWarehouse("all")}
              className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Select All Warehouses
            </button>
            {Array.isArray(warehouses) &&
              warehouses.map((wh: any) => (
                <button
                  key={wh.id}
                  onClick={() => setSelectedWarehouse(wh.id)}
                  className="bg-white hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all shadow-xs"
                >
                  {wh.name}
                </button>
              ))}
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center text-gray-500 font-medium">
          Loading products &amp; stock...
        </div>
      </div>
    );
  }

  if (filteredProducts.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-12 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h4 className="font-bold text-gray-900 text-lg mb-1">
            No Products Found
          </h4>
          <p className="text-sm text-gray-500">
            Try adjusting your search criteria or category filter.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm font-body">
          <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-500 border-b border-gray-100">
            <tr>
              <th className="py-4 px-6">Product</th>
              <th className="py-4 px-4">Brand / Category</th>
              <th className="py-4 px-4">Price</th>
              <th className="py-4 px-4">Stock Status</th>
              <th className="py-4 px-4">Quantity</th>
              <th className="py-4 px-6 text-right">Order Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredProducts.map((product: CartProduct) => {
              const qty = quantities[product.id] || 1;
              const wholesalePrice = isApproved
                ? product.dealerPrice || Math.round(product.price * 0.8)
                : product.price;

              const hasDealerDiscount = isApproved && wholesalePrice < product.price;
              const stockVal = product.stock ?? 0;
              const inStock = stockVal > 0;

              return (
                <tr
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product);
                    setActiveImageIdx(0);
                  }}
                  className="hover:bg-primary/5 transition-colors group cursor-pointer"
                >
                  {/* Product info */}
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <img
                        src={product.image || "/placeholder.svg"}
                        alt={product.name}
                        className="w-12 h-12 rounded-xl object-cover bg-gray-100 border border-gray-200 shrink-0"
                      />
                      <div>
                        <h4 className="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors flex items-center gap-1.5">
                          {product.name}
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
                        </h4>
                        <p className="text-xs text-gray-400">ID: {product.id}</p>
                      </div>
                    </div>
                  </td>

                  {/* Brand / Category */}
                  <td className="py-4 px-4">
                    <div className="space-y-1">
                      <span className="inline-block bg-primary/10 text-primary px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider border border-primary/20">
                        {product.brand || "Generic"}
                      </span>
                      <p className="text-xs text-gray-500 font-medium capitalize">
                        {product.category || "General"}
                      </p>
                    </div>
                  </td>

                  {/* Price */}
                  <td className="py-4 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-extrabold text-base text-gray-900">
                        <DirhamIcon size={16} />
                        <span>{wholesalePrice.toLocaleString()}</span>
                      </div>
                      {hasDealerDiscount ? (
                        <div className="flex items-center gap-2">
                          <span className="line-through text-xs text-gray-400 flex items-center gap-0.5">
                            <DirhamIcon size={11} />
                            {product.price.toLocaleString()}
                          </span>
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                            Partner Rate
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                          Standard Rate
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Stock */}
                  <td className="py-4 px-4">
                    {inStock ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>In Stock ({stockVal})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Out of Stock (0)</span>
                      </span>
                    )}
                  </td>

                  {/* Quantity Counter */}
                  <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-max border border-gray-200">
                      <button
                        onClick={() => handleQuantityChange(product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-bold text-sm text-gray-900">
                        {qty}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>

                  {/* Add to Cart */}
                  <td className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className="bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      <span>Add to Order</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
