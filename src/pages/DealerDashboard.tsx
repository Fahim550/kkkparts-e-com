import { CartProduct, useCart } from "@/context/CartContext";
import { useState } from "react";
import { toast } from "sonner";
import { DashboardFilters } from "./dealer/components/DashboardFilters";
import { DealerGreeting } from "./dealer/components/DealerGreeting";
import { ProductDetailModal } from "./dealer/components/ProductDetailModal";
import { ProductTable } from "./dealer/components/ProductTable";
import DealerLayout from "./dealer/DealerLayout";
import { useDealerProducts } from "./dealer/hooks/useDealerProducts";

export default function DealerDashboard() {
  const { addToCart } = useCart();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedProduct, setSelectedProduct] = useState<CartProduct | null>(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const {
    warehouses,
    categoriesData,
    isLoading,
    filteredProducts,
    isApproved,
    profile,
  } = useDealerProducts(selectedWarehouse, searchTerm, selectedCategory);

  const handleQuantityChange = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 1;
      const updated = Math.max(1, current + delta);
      return { ...prev, [id]: updated };
    });
  };

  const handleAddToCart = (product: CartProduct) => {
    const qty = quantities[product.id] || 1;
    const defaultSize = product.sizes?.[0] || 42;
    const defaultColor = product.colors?.[0] || "Standard";

    addToCart(product, defaultSize, defaultColor, qty, product.stock);
    toast.success(`Added ${qty}x ${product.name} to cart!`);
  };

  return (
    <>
      <DealerLayout>
        <div className="space-y-4">
          <DealerGreeting profile={profile} />

          <DashboardFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            warehouses={warehouses}
            categoriesData={categoriesData}
            productCount={filteredProducts.length}
          />

          <ProductTable
            selectedWarehouse={selectedWarehouse}
            setSelectedWarehouse={setSelectedWarehouse}
            warehouses={warehouses}
            isLoading={isLoading}
            filteredProducts={filteredProducts}
            quantities={quantities}
            handleQuantityChange={handleQuantityChange}
            isApproved={isApproved}
            setSelectedProduct={setSelectedProduct}
            setActiveImageIdx={setActiveImageIdx}
            handleAddToCart={handleAddToCart}
          />
        </div>
      </DealerLayout>

      <ProductDetailModal
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
        isApproved={isApproved}
        quantities={quantities}
        handleQuantityChange={handleQuantityChange}
        handleAddToCart={handleAddToCart}
        activeImageIdx={activeImageIdx}
        setActiveImageIdx={setActiveImageIdx}
      />
    </>
  );
}
