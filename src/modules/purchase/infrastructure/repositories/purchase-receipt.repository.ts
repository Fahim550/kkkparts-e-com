import { supabase } from "@/integrations/supabase/client";
import {
  CreatePurchaseReceiptDTO,
  CreatePurchaseReceiptItemDTO,
  PurchaseReceipt,
} from "../../domain/types";

export class PurchaseReceiptRepository {
  static async getAll(): Promise<PurchaseReceipt[]> {
    const { data, error } = await supabase
      .from("purchase_receipts")
      .select(
        `
        *,
        suppliers(id, name),
        warehouses(id, name),
        purchase_orders(id, po_number)
      `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as any;
  }

  static async create(
    receipt: CreatePurchaseReceiptDTO,
    items: CreatePurchaseReceiptItemDTO[],
  ): Promise<PurchaseReceipt> {
    const { data: createdReceipt, error: receiptError } = await supabase
      .from("purchase_receipts")
      .insert(receipt)
      .select()
      .single();

    if (receiptError) throw receiptError;

    const itemsToInsert = items.map((item: any) => {
      const { unit_cost, ...rest } = item;
      return {
        ...rest,
        purchase_receipt_id: createdReceipt.id,
      };
    });

    const { error: itemsError } = await supabase
      .from("purchase_receipt_items")
      .insert(itemsToInsert);

    if (itemsError) {
      await supabase
        .from("purchase_receipts")
        .delete()
        .eq("id", createdReceipt.id);
      throw itemsError;
    }

    return createdReceipt as any;
  }
}
