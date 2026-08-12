import { supabase } from "@/integrations/supabase/client";
import { CheckoutPayload, PosReceipt } from "../../domain/types";

export class PosCheckoutRepository {
  static async createReceipt(payload: CheckoutPayload): Promise<PosReceipt> {
    // Generate receipt number
    const dateStr = new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
    const receiptNumber = `POS-${dateStr}`;

    const dueAmount = payload.payments.filter(p => p.method === "Due").reduce((acc, p) => acc + p.amount, 0);
    const receiptStatus = dueAmount > 0 ? (dueAmount >= payload.total_amount ? "Unpaid" : "Partial") : "Paid";

    const { data: receipt, error: receiptError } = await supabase
      .from("pos_receipts")
      .insert({
        receipt_number: receiptNumber,
        shift_id: payload.shift_id,
        customer_id: payload.customer_id,
        walk_in_customer_name: payload.walk_in_customer_name,
        walk_in_customer_phone: payload.walk_in_customer_phone,
        transaction_date: new Date().toISOString(),
        total_amount: payload.total_amount,
        tax_amount: payload.tax_amount,
        discount_amount: payload.discount_amount,
        status: receiptStatus,
      })
      .select()
      .single();

    if (receiptError) throw receiptError;

    // Insert items
    const itemsData = payload.items.map((item) => ({
      receipt_id: receipt.id,
      variation_id: item.variation_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }));

    const { error: itemsError } = await supabase
      .from("pos_receipt_items")
      .insert(itemsData);

    if (itemsError) throw itemsError;

    // Insert payments
    const paymentsData = payload.payments.map((p) => ({
      receipt_id: receipt.id,
      payment_method: p.method,
      amount: p.amount,
      reference_code: p.reference_code,
    }));

    const { error: paymentsError } = await supabase
      .from("pos_payments")
      .insert(paymentsData);

    if (paymentsError) throw paymentsError;

    return receipt;
  }
}
