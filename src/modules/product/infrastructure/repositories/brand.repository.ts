import { supabase } from "@/integrations/supabase/client";
import { Brand, CreateBrandDTO, UpdateBrandDTO } from "../../domain/types";

export class BrandRepository {
  static async getAll(): Promise<Brand[]> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Brand | null> {
    const { data, error } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateBrandDTO): Promise<Brand> {
    const { data, error } = await supabase
      .from("brands")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateBrandDTO): Promise<Brand> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("brands")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("brands").delete().eq("id", id);

    if (error) throw error;
  }
}
