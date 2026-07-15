import { z } from "zod";

export const PriceListSchema = z.object({
  name: z.string().min(1, "Name is required"),
  currency: z.string().default("BDT"),
  is_tax_included: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const PriceListItemSchema = z.object({
  price_list_id: z.string().uuid("Price list required"),
  variation_id: z.string().uuid("Variation required"),
  uom_id: z.string().uuid("UOM required"),
  price: z.number().min(0, "Price cannot be negative"),
});

export const DiscountRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priority: z.number().int().default(0),
  discount_type: z.enum(["Percentage", "Fixed Amount"]),
  discount_value: z.number().min(0, "Discount cannot be negative"),
  valid_from: z.string().optional().nullable(),
  valid_to: z.string().optional().nullable(),
  is_active: z.boolean().default(true),
});

export const DiscountRuleConditionSchema = z.object({
  discount_rule_id: z.string().uuid("Rule required"),
  condition_type: z.enum(["CUSTOMER", "CUSTOMER_GROUP", "PRODUCT", "CATEGORY", "MIN_QUANTITY"]),
  condition_value: z.string().min(1, "Condition value required"),
});
