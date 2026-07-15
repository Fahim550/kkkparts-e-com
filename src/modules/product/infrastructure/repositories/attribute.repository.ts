import { supabase } from "@/integrations/supabase/client";
import {
  Attribute,
  CreateAttributeDTO,
  UpdateAttributeDTO,
  AttributeWithValues,
  AttributeValue,
  CreateAttributeValueDTO,
  UpdateAttributeValueDTO,
} from "../../domain/types";

export class AttributeRepository {
  static async getAll(): Promise<Attribute[]> {
    const { data, error } = await supabase
      .from("attributes")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getAllWithValues(): Promise<AttributeWithValues[]> {
    // Supabase query to get attributes and their nested values
    const { data, error } = await supabase
      .from("attributes")
      .select(
        `
        *,
        attribute_values (*)
      `,
      )
      .order("name");

    if (error) throw error;

    // Map to our domain type which expects 'values' instead of 'attribute_values' for cleaner DX
    return (data || []).map((attr) => ({
      ...attr,
      values: attr.attribute_values as AttributeValue[],
    }));
  }

  static async getById(id: string): Promise<Attribute | null> {
    const { data, error } = await supabase
      .from("attributes")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateAttributeDTO): Promise<Attribute> {
    const { data, error } = await supabase
      .from("attributes")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateAttributeDTO): Promise<Attribute> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("attributes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("attributes").delete().eq("id", id);

    if (error) throw error;
  }

  // --- Attribute Values ---

  static async createValue(
    payload: CreateAttributeValueDTO,
  ): Promise<AttributeValue> {
    const { data, error } = await supabase
      .from("attribute_values")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateValue(
    payload: UpdateAttributeValueDTO,
  ): Promise<AttributeValue> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("attribute_values")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteValue(id: string): Promise<void> {
    const { error } = await supabase
      .from("attribute_values")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
