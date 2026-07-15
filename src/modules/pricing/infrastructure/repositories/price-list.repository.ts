import { supabase } from "@/integrations/supabase/client";
import { PriceList, CreatePriceListDTO, PriceListItem, CreatePriceListItemDTO } from "../../domain/types";

export class PriceListRepository {
  static async getAll(): Promise<PriceList[]> {
    const { data, error } = await supabase
      .from("price_lists")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data;
  }

  static async getItems(priceListId: string): Promise<PriceListItem[]> {
    const { data, error } = await supabase
      .from("price_list_items")
      .select(`
        *,
        product_variations(id, sku, products(name)),
        units_of_measure(id, abbreviation)
      `)
      .eq("price_list_id", priceListId);

    if (error) throw error;
    return data as any;
  }

  static async create(payload: CreatePriceListDTO): Promise<PriceList> {
    const { data, error } = await supabase
      .from("price_lists")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(id: string, payload: Partial<CreatePriceListDTO>): Promise<PriceList> {
    const { data, error } = await supabase
      .from("price_lists")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async setItemPrice(payload: CreatePriceListItemDTO): Promise<PriceListItem> {
    // Upsert behavior on unique constraint (price_list_id, variation_id, uom_id)
    const { data, error } = await supabase
      .from("price_list_items")
      .upsert(payload, { onConflict: 'price_list_id, variation_id, uom_id' })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  }

  static async removeItemPrice(id: string): Promise<void> {
    const { error } = await supabase.from("price_list_items").delete().eq("id", id);
    if (error) throw error;
  }
}
