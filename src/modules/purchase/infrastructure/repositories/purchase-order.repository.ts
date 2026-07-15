import { supabase } from "@/integrations/supabase/client";
import { PurchaseOrder, CreatePurchaseOrderDTO, CreatePurchaseOrderItemDTO } from "../../domain/types";

export class PurchaseOrderRepository {
  static async getAll(): Promise<PurchaseOrder[]> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        suppliers(id, name),
        purchase_order_items(*)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as any;
  }

  static async getById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(`
        *,
        suppliers(*),
        purchase_order_items(
          *,
          product_variations(id, sku, products(name)),
          units_of_measure(id, name, abbreviation)
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as any;
  }

  static async create(po: CreatePurchaseOrderDTO, items: CreatePurchaseOrderItemDTO[]): Promise<PurchaseOrder> {
    // We do this in a single transaction-like way if possible, or sequentially.
    // Supabase JS doesn't have true transactions, so we insert PO, then Items.
    const { data: createdPo, error: poError } = await supabase
      .from("purchase_orders")
      .insert(po)
      .select()
      .single();

    if (poError) throw poError;

    const itemsToInsert = items.map(item => ({
      ...item,
      purchase_order_id: createdPo.id
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
      // Rollback PO manually if items fail (compensating action)
      await supabase.from("purchase_orders").delete().eq("id", createdPo.id);
      throw itemsError;
    }

    return createdPo as any;
  }

  static async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("purchase_orders")
      .update({ status })
      .eq("id", id);
      
    if (error) throw error;
  }
}
