import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { PricingEngine } from "../../../pricing/application/services/pricing.engine";
import { PosEngine } from "../../application/services/pos.engine";
import { CartItem } from "../../domain/types";

export const usePosCart = (
  warehouseId: string,
  shiftId?: string,
  customerId?: string,
  customerGroup?: string,
) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const addItem = async (
    variation: any,
    product: any,
    quantity: number = 1,
  ) => {
    // 1. Check if already in cart
    const existingIdx = cart.findIndex(
      (i) => i.variation_id === variation.id,
    );
    let newQty = quantity;
    if (existingIdx > -1) {
      newQty += cart[existingIdx].quantity;
    }

    // Determine fallback price from product
    const isDealer = customerGroup === "Dealer";
    const productPrice = Number(
      (isDealer && Number(product.dealer_price || 0) > 0)
        ? product.dealer_price
        : (product.price || product.original_price || 0)
    );

    let basePrice = productPrice;
    let finalPrice = productPrice;
    let discountAmount = 0;
    let appliedRules: string[] = [];

    try {
      const priceResult = await PricingEngine.calculatePrice({
        customer_id: customerId,
        customer_group: customerGroup,
        variation_id: variation.id,
        uom_id: product.base_uom_id,
        quantity: newQty,
      });

      if (priceResult && priceResult.base_price > 0) {
        basePrice = priceResult.base_price;
        finalPrice = priceResult.final_price;
        discountAmount = priceResult.discount_amount;
        appliedRules = priceResult.applied_rules || [];
      }
    } catch (e: any) {
      // Fall back to product base price
      console.warn("Pricing engine fallback for", variation.sku, e.message);
    }

    // 3. Update Cart
    const newItem: CartItem = {
      variation_id: variation.id,
      sku: variation.sku,
      name: product.name,
      uom_id: product.base_uom_id,
      uom_abbreviation: product.units_of_measure?.abbreviation || "Unit",
      quantity: newQty,
      unit_price: basePrice,
      discount_amount: discountAmount,
      total_price: finalPrice * newQty,
      applied_rules: appliedRules,
    };

    setCart((prev) => {
      const next = [...prev];
      if (existingIdx > -1) {
        next[existingIdx] = newItem;
      } else {
        next.push(newItem);
      }
      return next;
    });
  };

  const updateQuantity = async (variationId: string, newQty: number) => {
    if (newQty <= 0) {
      removeItem(variationId);
      return;
    }

    const item = cart.find((i) => i.variation_id === variationId);
    if (!item) return;

    let basePrice = item.unit_price;
    let finalPrice = item.unit_price;
    let discountAmount = 0;
    let appliedRules: string[] = item.applied_rules || [];

    try {
      const priceResult = await PricingEngine.calculatePrice({
        customer_id: customerId,
        customer_group: customerGroup,
        variation_id: variationId,
        uom_id: item.uom_id,
        quantity: newQty,
      });

      if (priceResult && priceResult.base_price > 0) {
        basePrice = priceResult.base_price;
        finalPrice = priceResult.final_price;
        discountAmount = priceResult.discount_amount;
        appliedRules = priceResult.applied_rules || [];
      }
    } catch (e) {
      // Keep existing unit price
    }

    setCart((prev) =>
      prev.map((i) => {
        if (i.variation_id === variationId) {
          return {
            ...i,
            quantity: newQty,
            unit_price: basePrice,
            discount_amount: discountAmount,
            total_price: finalPrice * newQty,
            applied_rules: appliedRules,
          };
        }
        return i;
      })
    );
  };

  const removeItem = (variationId: string) => {
    setCart((prev) => prev.filter((i) => i.variation_id !== variationId));
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.unit_price * item.quantity,
    0,
  );
  const totalDiscount = cart.reduce(
    (sum, item) => sum + item.discount_amount,
    0,
  );
  const total = cart.reduce((sum, item) => sum + item.total_price, 0); // final total

  const checkoutMutation = useMutation({
    mutationFn: (payload: {
      payments: { method: any; amount: number; reference_code?: string }[];
      walkInName?: string;
      walkInPhone?: string;
      walkInDealerName?: string;
      walkInDealerPhone?: string;
    }) => {
      if (!shiftId) throw new Error("No active shift");
      return PosEngine.checkout({
        shift_id: shiftId,
        customer_id: customerId && customerId !== "dealer" ? customerId : undefined,
        walk_in_customer_name: payload.walkInName,
        walk_in_customer_phone: payload.walkInPhone,
        walk_in_dealer_name: payload.walkInDealerName,
        walk_in_dealer_phone: payload.walkInDealerPhone,
        warehouse_id: warehouseId,
        items: cart,
        payments: payload.payments,
        total_amount: total,
        tax_amount: 0,
        discount_amount: totalDiscount,
      });
    },
    onSuccess: (receipt) => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] }); // Invalidate inventory as it's consumed
      toast({
        title: "Checkout Successful",
        description: `Receipt ${receipt.receipt_number} generated.`,
      });
      clearCart();
    },
    onError: (e: any) => {
      console.log(e.message);
      toast({
        variant: "destructive",
        title: "Checkout Failed",
        description: e.message,
      });
    },
  });

  return {
    cart,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    total,
    checkout: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
  };
};
