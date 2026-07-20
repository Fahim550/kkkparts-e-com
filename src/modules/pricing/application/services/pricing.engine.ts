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
      // Get base price from items
      const { data: priceItem } = await supabase
        .from("price_list_items")
        .select("price")
        .eq("price_list_id", priceList.id)
        .eq("variation_id", payload.variation_id)
        .eq("uom_id", payload.uom_id)
        .maybeSingle();

      if (priceItem) {
        basePrice = Number(priceItem.price);
      }
    }

    if (basePrice === 0) {
      // Fallback: Check if there's any Retail price if Wholesale/Dealer wasn't found
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
            .eq("uom_id", payload.uom_id)
            .maybeSingle();
          if (retailItem) basePrice = Number(retailItem.price);
        }
      }
    }

    if (basePrice === 0) {
      throw new Error(
        `No price defined for variation ${payload.variation_id} in Price List ${targetPriceListName}`,
      );
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
