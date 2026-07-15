import { supabase } from "@/integrations/supabase/client";
import { DiscountRule, CreateDiscountRuleDTO, DiscountRuleCondition, CreateDiscountRuleConditionDTO } from "../../domain/types";

export class DiscountRepository {
  static async getAllRules(): Promise<DiscountRule[]> {
    const { data, error } = await supabase
      .from("discount_rules")
      .select("*")
      .order("priority", { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getConditions(ruleId: string): Promise<DiscountRuleCondition[]> {
    const { data, error } = await supabase
      .from("discount_rule_conditions")
      .select("*")
      .eq("discount_rule_id", ruleId);

    if (error) throw error;
    return data;
  }

  static async createRule(payload: CreateDiscountRuleDTO, conditions: CreateDiscountRuleConditionDTO[]): Promise<DiscountRule> {
    const { data: rule, error: ruleError } = await supabase
      .from("discount_rules")
      .insert(payload)
      .select()
      .single();

    if (ruleError) throw ruleError;

    if (conditions && conditions.length > 0) {
      const conditionsWithRuleId = conditions.map(c => ({ ...c, discount_rule_id: rule.id }));
      const { error: condError } = await supabase
        .from("discount_rule_conditions")
        .insert(conditionsWithRuleId);

      if (condError) throw condError;
    }

    return rule;
  }

  static async updateRule(id: string, payload: Partial<CreateDiscountRuleDTO>): Promise<DiscountRule> {
    const { data, error } = await supabase
      .from("discount_rules")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteRule(id: string): Promise<void> {
    const { error } = await supabase.from("discount_rules").delete().eq("id", id);
    if (error) throw error;
  }

  static async addCondition(payload: CreateDiscountRuleConditionDTO): Promise<DiscountRuleCondition> {
    const { data, error } = await supabase
      .from("discount_rule_conditions")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async removeCondition(id: string): Promise<void> {
    const { error } = await supabase.from("discount_rule_conditions").delete().eq("id", id);
    if (error) throw error;
  }
}
