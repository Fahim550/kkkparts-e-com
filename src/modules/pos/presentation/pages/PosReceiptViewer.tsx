import React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, RotateCcw, Loader2 } from "lucide-react";
import { PosEngine } from "../../application/services/pos.engine";
import { useToast } from "@/hooks/use-toast";
import { usePosSession } from "../hooks/usePosSession";

export default function PosReceiptViewer() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const { currentShift } = usePosSession();

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["pos-receipt", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pos_receipts")
        .select(`
          *,
          customers(name, contact_phone),
          pos_receipt_items(
            *,
            product_variations(sku, products(name))
          ),
          pos_payments(*)
        `)
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id
  });

  const handleReturn = async () => {
    if (!currentShift) {
      toast({ variant: "destructive", title: "Shift Required", description: "You must have an open shift to process a return." });
      return;
    }
    
    try {
      // 1. Create a negative cart
      const returnCart = receipt.pos_receipt_items.map((item: any) => ({
        variation_id: item.variation_id,
        quantity: -item.quantity, // Negative quantity for return
        unit_price: item.unit_price, // Keep original price
        total_price: -item.total_price
      }));

      // 2. We need a warehouse ID. For a strict implementation we fetch the warehouse from the shift's register.
      // Assuming shift -> register -> warehouse. Let's fetch it quickly.
      const { data: shiftInfo } = await supabase.from("pos_shifts").select("pos_registers(warehouse_id)").eq("id", currentShift.id).single();
      
      const warehouseId = shiftInfo?.pos_registers?.warehouse_id;
      if (!warehouseId) throw new Error("Could not determine warehouse");

      // 3. Process checkout (return)
      await PosEngine.checkout({
        shift_id: currentShift.id,
        customer_id: receipt.customer_id,
        warehouse_id: warehouseId,
        items: returnCart,
        payments: [{ method: "Cash", amount: -receipt.total_amount }], // Refunding total in cash as example
        total_amount: -receipt.total_amount,
        tax_amount: -receipt.tax_amount,
        discount_amount: -receipt.discount_amount
      });

      toast({ title: "Return Processed", description: "Inventory has been restocked and refund issued." });
      // In a real app, you might want to mark the original receipt as 'Returned'
    } catch (e: any) {
      toast({ variant: "destructive", title: "Return Failed", description: e.message });
    }
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;
  if (!receipt) return <div className="p-12 text-center text-red-500">Receipt not found</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <Link to="/admin/pos">
          <Button variant="ghost"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button>
        </Link>
        <div className="space-x-2">
          <Button variant="outline" onClick={() => window.print()}><Printer className="w-4 h-4 mr-2" /> Print</Button>
          <Button variant="destructive" onClick={handleReturn} disabled={receipt.total_amount < 0}><RotateCcw className="w-4 h-4 mr-2" /> Refund / Return</Button>
        </div>
      </div>

      <Card className="print-area">
        <CardHeader className="text-center border-b pb-6">
          <CardTitle className="text-3xl">RECEIPT</CardTitle>
          <p className="text-muted-foreground mt-2">{receipt.receipt_number}</p>
          <p className="text-sm mt-1">{new Date(receipt.transaction_date).toLocaleString()}</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {receipt.customers ? (
            <div className="text-sm">
              <p className="font-semibold">Customer:</p>
              <p>{receipt.customers.name}</p>
              <p>{receipt.customers.contact_phone}</p>
            </div>
          ) : receipt.walk_in_customer_name ? (
            <div className="text-sm">
              <p className="font-semibold">Customer (Walk-in):</p>
              <p>{receipt.walk_in_customer_name}</p>
              {receipt.walk_in_customer_phone && <p>{receipt.walk_in_customer_phone}</p>}
            </div>
          ) : null}

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left pb-2">Item</th>
                <th className="text-center pb-2">Qty</th>
                <th className="text-right pb-2">Price</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {receipt.pos_receipt_items.map((item: any) => (
                <tr key={item.id} className="border-b">
                  <td className="py-2">
                    <div className="font-medium">{item.product_variations?.products?.name}</div>
                    <div className="text-xs text-muted-foreground">{item.product_variations?.sku}</div>
                  </td>
                  <td className="py-2 text-center">{item.quantity}</td>
                  <td className="py-2 text-right">${Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-2 text-right font-semibold">${Number(item.total_price).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex flex-col items-end space-y-2 text-sm">
            <div className="flex justify-between w-48">
              <span>Subtotal:</span>
              <span>${(receipt.total_amount + receipt.discount_amount).toFixed(2)}</span>
            </div>
            {receipt.discount_amount > 0 && (
              <div className="flex justify-between w-48 text-green-600">
                <span>Discount:</span>
                <span>-${Number(receipt.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between w-48 text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>${Number(receipt.total_amount).toFixed(2)}</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="font-semibold text-sm mb-2">Payments</p>
            {receipt.pos_payments.map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm text-muted-foreground">
                <span>{p.payment_method} {p.reference_code ? `(${p.reference_code})` : ''}</span>
                <span>${Number(p.amount).toFixed(2)}</span>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-8">
            Thank you for your business!
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
