import { supabase } from "@/integrations/supabase/client";
import {
  WarehouseZone,
  CreateWarehouseZoneDTO,
  UpdateWarehouseZoneDTO,
  WarehouseZoneWithBins,
} from "../../domain/types";

export class WarehouseZoneRepository {
  static async getByWarehouseId(
    warehouseId: string,
  ): Promise<WarehouseZoneWithBins[]> {
    const { data, error } = await supabase
      .from("warehouse_zones")
      .select(
        `
        *,
        bins:warehouse_bins(*)
      `,
      )
      .eq("warehouse_id", warehouseId)
      .order("name");

    if (error) throw error;
    return data as WarehouseZoneWithBins[];
  }

  static async getById(id: string): Promise<WarehouseZone | null> {
    const { data, error } = await supabase
      .from("warehouse_zones")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateWarehouseZoneDTO): Promise<WarehouseZone> {
    const { data, error } = await supabase
      .from("warehouse_zones")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateWarehouseZoneDTO): Promise<WarehouseZone> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("warehouse_zones")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("warehouse_zones")
      .delete()
      .eq("id", id);

    if (error) throw error;
  }
}
