import { supabase } from "@/integrations/supabase/client";
import { UOM, CreateUOMDTO, UpdateUOMDTO } from "../../domain/types";

export class UomRepository {
  static async getAll(): Promise<UOM[]> {
    const { data, error } = await supabase
      .from("units_of_measure")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<UOM | null> {
    const { data, error } = await supabase
      .from("units_of_measure")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateUOMDTO): Promise<UOM> {
    const { data, error } = await supabase
      .from("units_of_measure")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateUOMDTO): Promise<UOM> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("units_of_measure")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("units_of_measure")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
