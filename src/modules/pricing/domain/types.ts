import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

export type PriceList = PublicSchema["price_lists"]["Row"];
export type PriceListItem = PublicSchema["price_list_items"]["Row"] & {
  product_variations?: any;
  units_of_measure?: any;
};

export type DiscountRule = PublicSchema["discount_rules"]["Row"];
export type DiscountRuleCondition = PublicSchema["discount_rule_conditions"]["Row"];

export type CreatePriceListDTO = Omit<PriceList, "id" | "created_at" | "updated_at">;
export type CreatePriceListItemDTO = Omit<PriceListItem, "id" | "created_at" | "updated_at" | "product_variations" | "units_of_measure">;

export type CreateDiscountRuleDTO = Omit<DiscountRule, "id" | "created_at" | "updated_at">;
export type CreateDiscountRuleConditionDTO = Omit<DiscountRuleCondition, "id" | "created_at">;

// Payload for calculating a price
export type PricingQueryPayload = {
  customer_id?: string;
  customer_group?: string;
  variation_id: string;
  uom_id: string;
  quantity: number;
};

// Response from the pricing engine
export type PricingResult = {
  base_price: number;
  final_price: number;
  discount_amount: number;
  applied_rules: string[];
};
