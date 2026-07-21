import { supabase } from "@/integrations/supabase/client";
import {
  CreatePurchaseOrderDTO,
  CreatePurchaseOrderItemDTO,
  PurchaseOrder,
} from "../../domain/types";

export type PurchaseOrderFilters = {
  supplierId?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string; // searches PO number
};

export class PurchaseOrderRepository {
  static async getAll(
    filters?: PurchaseOrderFilters,
  ): Promise<PurchaseOrder[]> {
    let query = supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers(id, name),
        purchase_order_items(
          *,
          product_variations(id, sku, products(name))
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.supplierId) {
      query = query.eq("supplier_id", filters.supplierId);
    }
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("order_date", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("order_date", filters.dateTo);
    }
    if (filters?.search) {
      query = query.ilike("po_number", `%${filters.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as any;
  }

  static async getById(id: string): Promise<PurchaseOrder | null> {
    const { data, error } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        suppliers(*),
        purchase_order_items(
          *,
          product_variations(id, sku, products(name)),
          units_of_measure(id, name, abbreviation)
        )
      `,
      )
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as any;
  }

  static async create(
    po: CreatePurchaseOrderDTO,
    items: CreatePurchaseOrderItemDTO[],
  ): Promise<PurchaseOrder> {
    const { data: createdPo, error: poError } = await supabase
      .from("purchase_orders")
      .insert(po)
      .select()
      .single();

    if (poError) throw poError;

    const itemsToInsert = items.map((item) => ({
      ...item,
      purchase_order_id: createdPo.id,
    }));

    const { error: itemsError } = await supabase
      .from("purchase_order_items")
      .insert(itemsToInsert);

    if (itemsError) {
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
