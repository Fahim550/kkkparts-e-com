import { supabase } from "@/integrations/supabase/client";
import { PricingQueryPayload, PricingResult } from "../../domain/types";

export class PricingEngine {
  /**
   * Evaluates the pricing for a given customer and product variation.
   * 1. Determines applicable Price List (based on customer group or 'Retail' default)
   * 2. Finds the base price
   * 3. Evaluates applicable Discount Rules (e.g. quantity discount, customer specific)
   * 4. Returns the final calculated price
   */
  static async calculatePrice(
    payload: PricingQueryPayload,
  ): Promise<PricingResult> {
    // 1. Determine Price List
    let targetPriceListName = "Retail";
    if (
      payload.customer_group &&
      ["Wholesale", "Dealer"].includes(payload.customer_group)
    ) {
      targetPriceListName = payload.customer_group;
    }

    // Debug: fetch all price lists to see what's available to this user/session
    const { data: allLists } = await supabase.from("price_lists").select("*");
    console.log("ALL available price lists in DB:", allLists);

    // Get the price list id
    const { data: priceList } = await supabase
      .from("price_lists")
      .select("id")
      .ilike("name", `%${targetPriceListName}%`)
      .maybeSingle();

    let basePrice = 0;

    console.log("Price list ", priceList);
    if (priceList) {
      // Get base price from items (try with UOM first)
      let priceQuery = supabase
        .from("price_list_items")
        .select("price")
        .eq("price_list_id", priceList.id)
        .eq("variation_id", payload.variation_id);

      if (payload.uom_id) {
        priceQuery = priceQuery.eq("uom_id", payload.uom_id);
      }

      const { data: priceItem } = await priceQuery.maybeSingle();

      if (priceItem && Number(priceItem.price) > 0) {
        basePrice = Number(priceItem.price);
      } else {
        // Try without uom_id constraint
        const { data: anyUomItem } = await supabase
          .from("price_list_items")
          .select("price")
          .eq("price_list_id", priceList.id)
          .eq("variation_id", payload.variation_id)
          .maybeSingle();
        if (anyUomItem && Number(anyUomItem.price) > 0) {
          basePrice = Number(anyUomItem.price);
        }
      }
    }

    if (basePrice === 0) {
      // Fallback: Check if there's any Retail price in price list
      if (targetPriceListName.toLowerCase() !== "retail") {
        const { data: retailList } = await supabase
          .from("price_lists")
          .select("id")
          .ilike("name", "%Retail%")
          .maybeSingle();
        if (retailList) {
          const { data: retailItem } = await supabase
            .from("price_list_items")
            .select("price")
            .eq("price_list_id", retailList.id)
            .eq("variation_id", payload.variation_id)
            .maybeSingle();
          if (retailItem && Number(retailItem.price) > 0) {
            basePrice = Number(retailItem.price);
          }
        }
      }
    }

    // Fallback: Check any price list item for this variation
    if (basePrice === 0) {
      const { data: anyListItem } = await supabase
        .from("price_list_items")
        .select("price")
        .eq("variation_id", payload.variation_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (anyListItem && Number(anyListItem.price) > 0) {
        basePrice = Number(anyListItem.price);
      }
    }

    // Fallback: Check product record directly (dealer_price or standard price/original_price)
    if (basePrice === 0) {
      const { data: variation } = await supabase
        .from("product_variations")
        .select("product_id, products(price, original_price, dealer_price)")
        .eq("id", payload.variation_id)
        .maybeSingle();

      const prod = (variation as any)?.products;
      if (prod) {
        const isDealer = ["Wholesale", "Dealer"].includes(payload.customer_group || "");
        if (isDealer && Number(prod.dealer_price || 0) > 0) {
          basePrice = Number(prod.dealer_price);
        } else if (Number(prod.price || 0) > 0) {
          basePrice = Number(prod.price);
        } else if (Number(prod.original_price || 0) > 0) {
          basePrice = Number(prod.original_price);
        }
      }
    }

    // 2. Evaluate Discounts
    let finalPrice = basePrice;
    let discountAmount = 0;
    const appliedRules: string[] = [];

    // Fetch all active rules and their conditions
    const { data: rulesData } = await supabase
      .from("discount_rules")
      .select(
        `
        *,
        discount_rule_conditions(*)
      `,
      )
      .eq("is_active", true)
      .order("priority", { ascending: false });

    if (rulesData) {
      for (const rule of rulesData) {
        // Evaluate conditions (All must pass for a rule to apply, simple AND logic for now)
        let applies = true;
        const conditions = rule.discount_rule_conditions || [];

        for (const cond of conditions) {
          if (
            cond.condition_type === "CUSTOMER" &&
            payload.customer_id !== cond.condition_value
          ) {
            applies = false;
            break;
          }
          if (
            cond.condition_type === "CUSTOMER_GROUP" &&
            payload.customer_group !== cond.condition_value
          ) {
            applies = false;
            break;
          }
          if (
            cond.condition_type === "PRODUCT" &&
            payload.variation_id !== cond.condition_value
          ) {
            applies = false;
            break;
          }
          if (
            cond.condition_type === "MIN_QUANTITY" &&
            payload.quantity < Number(cond.condition_value)
          ) {
            applies = false;
            break;
          }
        }

        if (applies && conditions.length > 0) {
          // Require at least one condition to avoid applying to everything
          // Apply discount
          let currentDiscount = 0;
          if (rule.discount_type === "Percentage") {
            currentDiscount = basePrice * (Number(rule.discount_value) / 100);
          } else if (rule.discount_type === "Fixed Amount") {
            currentDiscount = Number(rule.discount_value);
          }

          discountAmount += currentDiscount;
          finalPrice -= currentDiscount;
          appliedRules.push(rule.name);

          // We could break here if we only want the top priority rule to apply,
          // but typically they might stack. For now, we allow stacking.
        }
      }
    }

    // Ensure price doesn't go below 0
    if (finalPrice < 0) finalPrice = 0;

    return {
      base_price: basePrice,
      final_price: finalPrice,
      discount_amount: discountAmount,
      applied_rules: appliedRules,
    };
  }
}
