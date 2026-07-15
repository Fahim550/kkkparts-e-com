import { supabase } from "@/integrations/supabase/client";
import {
  Product,
  CreateProductDTO,
  UpdateProductDTO,
  ProductTemplateWithDetails,
  ProductVariation,
  CreateProductVariationDTO,
  UpdateProductVariationDTO,
} from "../../domain/types";

export class ProductRepository {
  static async getAllTemplates(): Promise<ProductTemplateWithDetails[]> {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(*),
        category:categories(*),
        base_uom:units_of_measure(*),
        product_attributes(
          *,
          attribute:attributes(*)
        ),
        variations:product_variations(
          *,
          attributes:variation_attributes(
            *,
            attribute_value:attribute_values(
              *,
              attribute:attributes(*)
            )
          )
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    // The cast is necessary because Supabase's generated types don't inherently deeply nest properly with all the custom joins,
    // but we know at runtime this matches ProductTemplateWithDetails.
    return data as unknown as ProductTemplateWithDetails[];
  }

  static async getTemplateById(
    id: string,
  ): Promise<ProductTemplateWithDetails | null> {
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        brand:brands(*),
        category:categories(*),
        base_uom:units_of_measure(*),
        product_attributes(
          *,
          attribute:attributes(*)
        ),
        variations:product_variations(
          *,
          attributes:variation_attributes(
            *,
            attribute_value:attribute_values(
              *,
              attribute:attributes(*)
            )
          )
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as unknown as ProductTemplateWithDetails;
  }

  static async createTemplate(payload: CreateProductDTO): Promise<Product> {
    const { data, error } = await supabase
      .from("products")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateTemplate(payload: UpdateProductDTO): Promise<Product> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteTemplate(id: string): Promise<void> {
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
  }

  // --- Variations ---

  static async createVariation(
    payload: CreateProductVariationDTO,
  ): Promise<ProductVariation> {
    const { data, error } = await supabase
      .from("product_variations")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateVariation(
    payload: UpdateProductVariationDTO,
  ): Promise<ProductVariation> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("product_variations")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteVariation(id: string): Promise<void> {
    const { error } = await supabase
      .from("product_variations")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
