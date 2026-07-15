import { supabase } from "@/integrations/supabase/client";
import {
  WarehouseBin,
  CreateWarehouseBinDTO,
  UpdateWarehouseBinDTO,
} from "../../domain/types";

export class WarehouseBinRepository {
  static async getByZoneId(zoneId: string): Promise<WarehouseBin[]> {
    const { data, error } = await supabase
      .from("warehouse_bins")
      .select("*")
      .eq("zone_id", zoneId)
      .order("code");

    if (error) throw error;
    return data || [];
  }

  static async getById(id: string): Promise<WarehouseBin | null> {
    const { data, error } = await supabase
      .from("warehouse_bins")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateWarehouseBinDTO): Promise<WarehouseBin> {
    const { data, error } = await supabase
      .from("warehouse_bins")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateWarehouseBinDTO): Promise<WarehouseBin> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("warehouse_bins")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouse_bins")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
