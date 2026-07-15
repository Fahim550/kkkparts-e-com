import { supabase } from "@/integrations/supabase/client";
import {
  Warehouse,
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
} from "../../domain/types";

export class WarehouseRepository {
  static async getAll(): Promise<Warehouse[]> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<Warehouse | null> {
    const { data, error } = await supabase
      .from("warehouses")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateWarehouseDTO): Promise<Warehouse> {
    const { data, error } = await supabase
      .from("warehouses")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateWarehouseDTO): Promise<Warehouse> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("warehouses")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("warehouses").delete().eq("id", id);

    if (error) throw error;
  }
}
