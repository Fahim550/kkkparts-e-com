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
    try {
      // 1. Check if already in cart
      const existingIdx = cart.findIndex(
        (i) => i.variation_id === variation.id,
      );
      let newQty = quantity;
      if (existingIdx > -1) {
        newQty += cart[existingIdx].quantity;
      }

      // 2. Ask Pricing Engine
      const priceResult = await PricingEngine.calculatePrice({
        customer_id: customerId,
        customer_group: customerGroup,
        variation_id: variation.id,
        uom_id: product.base_uom_id,
        quantity: newQty,
      });

      // 3. Update Cart
      const newItem: CartItem = {
        variation_id: variation.id,
        sku: variation.sku,
        name: product.name,
        uom_id: product.base_uom_id,
        uom_abbreviation: product.units_of_measure?.abbreviation || "Unit",
        quantity: newQty,
        unit_price: priceResult.base_price, // Unit price before discount
        discount_amount: priceResult.discount_amount,
        total_price: priceResult.final_price * newQty, // Or however you want to structure line totals
        applied_rules: priceResult.applied_rules,
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
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Pricing Error",
        description: e.message,
      });
    }
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
    removeItem,
    clearCart,
    subtotal,
    totalDiscount,
    total,
    checkout: checkoutMutation.mutateAsync,
    isCheckingOut: checkoutMutation.isPending,
  };
};
