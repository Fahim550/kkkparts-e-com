import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Check,
  Edit2,
  FileText,
  Loader2,
  Phone,
  Printer,
  RotateCcw,
  User,
} from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { PosEngine } from "../../application/services/pos.engine";
import { usePosSession } from "../hooks/usePosSession";

export const printPosReceipt = (_receipt?: any) => {
  window.print();
};

export const printThermalSlip = (receipt: any, storeName = "KKK PARTS") => {
  const customerName =
    receipt.customers?.name ||
    receipt.walk_in_customer_name ||
    receipt.walk_in_dealer_name ||
    "Walk-in Customer";

  const customerPhone =
    receipt.customers?.contact_phone ||
    receipt.walk_in_customer_phone ||
    receipt.walk_in_dealer_phone ||
    "";

  const totalPaid = (receipt.pos_payments || []).reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  );
  const dueAmount = Number(receipt.total_amount || 0) - totalPaid;

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt - ${receipt.receipt_number}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 0;
    }
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    html {
      background: #f1f5f9;
      width: 100%;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
      color: #111;
      background: #f1f5f9;
      margin: 0;
      padding: 16px 0;
      width: 100%;
      display: flex;
      justify-content: center;
      align-items: flex-start;
    }
    .receipt-wrapper {
      width: 80mm;
      max-width: 80mm;
      margin: 0 auto;
      padding: 12px 10px;
      background: #fff;
      box-shadow: 0 4px 14px rgba(0,0,0,0.08);
      box-sizing: border-box;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .header {
      text-align: center;
      margin-bottom: 10px;
      border-bottom: 1px dashed #777;
      padding-bottom: 8px;
    }
    .logo-text {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: 1px;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 10px;
      color: #555;
      margin-top: 2px;
    }
    .receipt-title {
      font-size: 13px;
      font-weight: 800;
      margin-top: 6px;
      letter-spacing: 1px;
    }
    .receipt-no {
      font-size: 11px;
      font-family: monospace;
      font-weight: bold;
      margin-top: 2px;
    }
    .date-time {
      font-size: 10px;
      color: #555;
      margin-top: 2px;
    }
    
    .customer-box {
      margin: 8px 0;
      padding: 6px 0;
      border-bottom: 1px dashed #777;
      font-size: 11px;
      line-height: 1.4;
    }
    .customer-label {
      font-size: 9px;
      font-weight: bold;
      text-transform: uppercase;
      color: #666;
    }
    .customer-name {
      font-weight: bold;
      font-size: 12px;
    }
    
    table.items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 11px;
    }
    table.items-table th {
      border-bottom: 1px solid #333;
      padding: 4px 2px;
      font-size: 10px;
      text-transform: uppercase;
      color: #222;
    }
    table.items-table td {
      padding: 5px 2px;
      border-bottom: 1px dotted #ccc;
      vertical-align: top;
    }
    .col-item {
      text-align: left;
    }
    .col-qty {
      text-align: center;
      width: 26px;
      white-space: nowrap;
    }
    .col-price {
      text-align: right;
      white-space: nowrap;
      padding-left: 4px;
      font-variant-numeric: tabular-nums;
    }
    .col-total {
      text-align: right;
      white-space: nowrap;
      padding-left: 4px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
    .item-name {
      font-weight: 600;
      font-size: 11px;
      line-height: 1.3;
      word-break: break-word;
    }
    .item-sku {
      font-size: 9px;
      color: #666;
      font-family: monospace;
      margin-top: 1px;
    }
    
    .totals {
      margin-top: 8px;
      border-top: 1px dashed #777;
      padding-top: 6px;
      font-size: 11px;
    }
    .totals .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }
    .totals .num, .payments .num {
      font-variant-numeric: tabular-nums;
      white-space: nowrap;
    }
    .totals .total-row {
      font-size: 14px;
      font-weight: 900;
      border-top: 1px solid #333;
      padding-top: 6px;
      margin-top: 4px;
    }
    .totals .due-row {
      font-size: 12px;
      font-weight: bold;
      color: #b91c1c;
      padding-top: 2px;
    }

    .payments {
      margin-top: 8px;
      border-top: 1px dashed #777;
      padding-top: 6px;
      font-size: 11px;
    }
    .payments .pay-title {
      font-weight: bold;
      margin-bottom: 3px;
      font-size: 10px;
      text-transform: uppercase;
      color: #444;
    }
    .payments .pay-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2px 0;
    }

    .footer {
      text-align: center;
      margin-top: 14px;
      padding-top: 8px;
      border-top: 1px dashed #777;
      font-size: 10px;
      color: #555;
      line-height: 1.4;
    }

    @media print {
      html, body {
        width: 100% !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #fff !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
      }
      .receipt-wrapper {
        width: 80mm !important;
        max-width: 80mm !important;
        margin: 0 auto !important;
        padding: 4px 6px !important;
        box-shadow: none !important;
        border: none !important;
        box-sizing: border-box !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-wrapper">
    <div class="header">
      <div class="logo-text">${storeName}</div>
      <div class="subtitle">Auto Parts & Accessories</div>
      <div class="receipt-title">SALES RECEIPT</div>
      <div class="receipt-no">${receipt.receipt_number}</div>
      <div class="date-time">${new Date(receipt.transaction_date).toLocaleString("en-GB")}</div>
    </div>

    <div class="customer-box">
      <div class="customer-label">Customer Details:</div>
      <div class="customer-name">${customerName}</div>
      ${customerPhone ? `<div>Tel: ${customerPhone}</div>` : ""}
    </div>

    <table class="items-table">
      <thead>
        <tr>
          <th class="col-item">Item</th>
          <th class="col-qty">Qty</th>
          <th class="col-price">Price</th>
          <th class="col-total">Total</th>
        </tr>
      </thead>
      <tbody>
        ${(receipt.pos_receipt_items || [])
          .map(
            (item: any) => `
          <tr>
            <td class="col-item">
              <div class="item-name">${item.product_variations?.products?.name || "Item"}</div>
              ${item.product_variations?.sku ? `<div class="item-sku">${item.product_variations.sku}</div>` : ""}
            </td>
            <td class="col-qty">${item.quantity}</td>
            <td class="col-price">OMR ${Number(item.unit_price).toFixed(3)}</td>
            <td class="col-total">OMR ${Number(item.total_price).toFixed(3)}</td>
          </tr>
        `
          )
          .join("")}
      </tbody>
    </table>

    <div class="totals">
      <div class="row">
        <span>Subtotal:</span>
        <span class="num">OMR ${(Number(receipt.total_amount || 0) + Number(receipt.discount_amount || 0)).toFixed(3)}</span>
      </div>
      ${
        Number(receipt.discount_amount) > 0
          ? `
      <div class="row" style="color: #15803d;">
        <span>Discount:</span>
        <span class="num">- OMR ${Number(receipt.discount_amount).toFixed(3)}</span>
      </div>
      `
          : ""
      }
      <div class="row total-row">
        <span>TOTAL:</span>
        <span class="num">OMR ${Number(receipt.total_amount).toFixed(3)}</span>
      </div>
      ${
        dueAmount > 0.001
          ? `
      <div class="row due-row">
        <span>Balance Due:</span>
        <span class="num">OMR ${dueAmount.toFixed(3)}</span>
      </div>
      `
          : ""
      }
    </div>

    <div class="payments">
      <div class="pay-title">Payment Settlement:</div>
      ${(receipt.pos_payments || [])
        .map(
          (p: any) => `
        <div class="pay-row">
          <span>${p.payment_method} ${p.reference_code ? `(${p.reference_code})` : ""}</span>
          <span class="num">OMR ${Number(p.amount).toFixed(3)}</span>
        </div>
      `
        )
        .join("")}
    </div>

    <div class="footer">
      <p>Thank you for your business!</p>
      <p style="margin-top: 4px; font-size: 9px; color: #666;">Goods once sold can be returned within policy guidelines.</p>
    </div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 250);
  } else {
    window.print();
  }
};

export default function PosReceiptViewer() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { currentShift } = usePosSession();
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const storeName = s?.site_name || "KKK PARTS";
  const logoUrl = s?.logo_url || "/logo.png";

  // Edit Customer Dialog State
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editCustomerName, setEditCustomerName] = useState("");
  const [editCustomerPhone, setEditCustomerPhone] = useState("");
  const [isUpdatingCustomer, setIsUpdatingCustomer] = useState(false);

  const { data: receipt, isLoading } = useQuery({
    queryKey: ["pos-receipt", id],
    queryFn: async () => {
      let { data, error } = await supabase
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
        .maybeSingle();

      if (!data) {
        // Fallback to sales_orders if it's opened via an order ID
        const { data: salesData, error: salesError } = await supabase
          .from("sales_orders")
          .select(`
            *,
            customers(name, contact_phone),
            sales_order_items(
              *,
              product_variations(sku, products(name))
            )
          `)
          .eq("id", id)
          .maybeSingle();

        if (salesError || !salesData) throw new Error("Receipt not found");

        // Fetch journal entry for sales order to find paid amount
        const { data: jeData } = await supabase
          .from("journal_entries")
          .select("journal_entry_lines(debit_amount, narration)")
          .eq("reference_id", id)
          .eq("reference_type", "sales_order")
          .maybeSingle();

        let paidAmount = 0;
        if (jeData?.journal_entry_lines) {
          const paidLine = jeData.journal_entry_lines.find((l: any) =>
            l.narration?.includes("- Paid")
          );
          if (paidLine) {
            paidAmount = paidLine.debit_amount;
          }
        }

        return {
          id: salesData.id,
          receipt_number: salesData.so_number,
          transaction_date: salesData.order_date || salesData.created_at,
          total_amount: salesData.total_amount,
          tax_amount: 0,
          discount_amount: 0,
          status: salesData.status,
          customer_id: salesData.customer_id,
          customers: salesData.customers,
          walk_in_customer_name: null,
          walk_in_customer_phone: null,
          walk_in_dealer_name: null,
          walk_in_dealer_phone: null,
          pos_payments:
            paidAmount > 0
              ? [{ id: "payment", payment_method: "Cash", amount: paidAmount }]
              : [],
          pos_receipt_items: (salesData.sales_order_items || []).map((i: any) => ({
            variation_id: i.variation_id,
            quantity: i.quantity_ordered,
            unit_price: i.unit_price,
            total_price: i.total_price,
            product_variations: i.product_variations,
          })),
        };
      }
      return data;
    },
    enabled: !!id,
  });

  const handleOpenEditCustomer = () => {
    if (!receipt) return;
    setEditCustomerName(
      receipt.walk_in_customer_name ||
        receipt.walk_in_dealer_name ||
        receipt.customers?.name ||
        ""
    );
    setEditCustomerPhone(
      receipt.walk_in_customer_phone ||
        receipt.walk_in_dealer_phone ||
        receipt.customers?.contact_phone ||
        ""
    );
    setIsEditDialogOpen(true);
  };

  const handleSaveCustomer = async () => {
    if (!receipt?.id) return;
    setIsUpdatingCustomer(true);
    try {
      const { error } = await supabase
        .from("pos_receipts")
        .update({
          walk_in_customer_name: editCustomerName.trim() || null,
          walk_in_customer_phone: editCustomerPhone.trim() || null,
        })
        .eq("id", receipt.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ["pos-receipt", id] });
      toast({
        title: "Customer Details Updated",
        description: "Customer name and phone number have been updated on this slip.",
      });
      setIsEditDialogOpen(false);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: err.message,
      });
    } finally {
      setIsUpdatingCustomer(false);
    }
  };

  const handleReturn = async () => {
    if (!currentShift) {
      toast({
        variant: "destructive",
        title: "Shift Required",
        description: "You must have an open shift to process a return.",
      });
      return;
    }

    try {
      const returnCart = receipt.pos_receipt_items.map((item: any) => ({
        variation_id: item.variation_id,
        quantity: -item.quantity,
        unit_price: item.unit_price,
        total_price: -item.total_price,
      }));

      const { data: shiftInfo } = await supabase
        .from("pos_shifts")
        .select("pos_registers(warehouse_id)")
        .eq("id", currentShift.id)
        .single();

      const warehouseId = shiftInfo?.pos_registers?.warehouse_id;
      if (!warehouseId) throw new Error("Could not determine warehouse");

      await PosEngine.checkout({
        shift_id: currentShift.id,
        customer_id: receipt.customer_id,
        warehouse_id: warehouseId,
        items: returnCart,
        payments: [{ method: "Cash", amount: -receipt.total_amount }],
        total_amount: -receipt.total_amount,
        tax_amount: -receipt.tax_amount,
        discount_amount: -receipt.discount_amount,
      });

      toast({
        title: "Return Processed",
        description: "Inventory has been restocked and refund issued.",
      });
    } catch (e: any) {
      toast({
        variant: "destructive",
        title: "Return Failed",
        description: e.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" />
      </div>
    );
  }

  if (!receipt) {
    return <div className="p-12 text-center text-red-500">Receipt not found</div>;
  }

  const totalPaid = (receipt.pos_payments || []).reduce(
    (sum: number, p: any) => sum + Number(p.amount || 0),
    0
  );
  const dueAmount = Number(receipt.total_amount || 0) - totalPaid;

  const displayName =
    receipt.customers?.name ||
    receipt.walk_in_customer_name ||
    receipt.walk_in_dealer_name ||
    "Walk-in Customer";

  const displayPhone =
    receipt.customers?.contact_phone ||
    receipt.walk_in_customer_phone ||
    receipt.walk_in_dealer_phone;

  return (
    <div className="max-w-2xl mx-auto space-y-6 print:max-w-none print:w-full print:m-0 print:p-0 print:space-y-0">
      {/* Top Action Bar - Hidden during printing */}
      <div className="flex justify-between items-center hide-on-print">
        <Link to="/admin/reports/sales">
          <Button variant="ghost">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sales
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditCustomer}
            className="text-xs"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Edit Customer Info
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => window.print()}
            className="text-xs font-semibold shadow-sm bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print Receipt
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => printThermalSlip(receipt, storeName)}
            className="text-xs"
            title="Print compact 80mm thermal receipt slip"
          >
            <FileText className="w-3.5 h-3.5 mr-1.5" /> 80mm POS Slip
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleReturn}
            disabled={receipt.total_amount < 0}
            className="text-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Refund
          </Button>
        </div>
      </div>

      {/* Main Printable Card */}
      <Card className="print-area shadow-sm border border-slate-200 bg-white print:border print:border-gray-300 print:shadow-none print:w-full print:m-0">
        <CardHeader className="text-center border-b pb-5 print:pb-4">
          <div className="flex flex-col items-center justify-center gap-1.5 mb-1.5">
            <img
              src={logoUrl}
              alt={storeName}
              className="h-10 w-auto object-contain print:h-9"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
            <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground print:text-gray-600">
              {storeName} · Auto Parts
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-wider print:text-xl">SALES RECEIPT</CardTitle>
          <p className="text-muted-foreground font-mono text-sm mt-1 font-semibold print:text-gray-700">
            {receipt.receipt_number}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 print:text-gray-500">
            {new Date(receipt.transaction_date).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 print:pt-4 print:space-y-4">
          {/* Customer Details Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex justify-between items-center text-sm print:bg-slate-50 print:border-slate-300">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-0.5 print:text-gray-600">
                Customer Details
              </p>
              <p className="font-bold text-gray-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-blue-600 print:text-blue-600" />
                {displayName}
              </p>
              {displayPhone ? (
                <p className="text-xs text-gray-600 flex items-center gap-1.5 mt-0.5 font-medium print:text-gray-700">
                  <Phone className="w-3.5 h-3.5 text-gray-400 print:text-gray-500" />
                  {displayPhone}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground italic mt-0.5">No phone number recorded</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenEditCustomer}
              className="h-8 text-xs hide-on-print text-blue-600 hover:text-blue-700"
            >
              <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
            </Button>
          </div>

          {/* Items Table */}
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-muted-foreground print:border-gray-300 print:text-gray-600">
                <th className="text-left pb-2 font-semibold">Item Description</th>
                <th className="text-center pb-2 font-semibold w-16">Qty</th>
                <th className="text-right pb-2 font-semibold w-28">Price</th>
                <th className="text-right pb-2 font-semibold w-32">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 print:divide-gray-200">
              {(receipt.pos_receipt_items || []).map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50/50 print:hover:bg-transparent">
                  <td className="py-2.5">
                    <div className="font-medium text-gray-900">
                      {item.product_variations?.products?.name || "Auto Part"}
                    </div>
                    {item.product_variations?.sku && (
                      <div className="text-xs font-mono text-muted-foreground print:text-gray-500">
                        {item.product_variations?.sku}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 text-center font-semibold text-gray-800">{item.quantity}</td>
                  <td className="py-2.5 text-right font-mono text-gray-600 print:text-gray-700">
                    OMR {Number(item.unit_price || 0).toFixed(3)}
                  </td>
                  <td className="py-2.5 text-right font-bold font-mono text-gray-900">
                    OMR {Number(item.total_price || 0).toFixed(3)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Financial Totals */}
          <div className="flex flex-col items-end space-y-1.5 text-sm border-t border-gray-200 pt-4 print:border-gray-300">
            <div className="flex justify-between w-64 text-gray-600 print:text-gray-700">
              <span>Subtotal:</span>
              <span className="font-mono font-medium">
                OMR {(Number(receipt.total_amount || 0) + Number(receipt.discount_amount || 0)).toFixed(3)}
              </span>
            </div>
            {Number(receipt.discount_amount) > 0 && (
              <div className="flex justify-between w-64 text-emerald-600 font-medium print:text-emerald-700">
                <span>Discount Applied:</span>
                <span className="font-mono">− OMR {Number(receipt.discount_amount).toFixed(3)}</span>
              </div>
            )}
            <div className="flex justify-between w-64 text-base font-bold border-t border-gray-200 pt-2 text-gray-900 print:border-gray-300">
              <span>Total Amount:</span>
              <span className="font-mono text-blue-700 print:text-gray-900">
                OMR {Number(receipt.total_amount || 0).toFixed(3)}
              </span>
            </div>
            {dueAmount > 0.001 && (
              <div className="flex justify-between w-64 text-sm font-bold text-red-600 pt-1 print:text-red-700">
                <span>Due / Outstanding:</span>
                <span className="font-mono">OMR {dueAmount.toFixed(3)}</span>
              </div>
            )}
          </div>

          {/* Payment breakdown */}
          <div className="border-t border-gray-200 pt-4 print:border-gray-300">
            <p className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-2 print:text-gray-600">
              Payment Settlement
            </p>
            {(receipt.pos_payments || []).map((p: any) => (
              <div key={p.id} className="flex justify-between text-sm py-1">
                <span className="text-gray-700">
                  {p.payment_method} {p.reference_code ? `(${p.reference_code})` : ""}
                </span>
                <span className="font-bold font-mono text-gray-900">
                  OMR {Number(p.amount || 0).toFixed(3)}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t border-gray-200 print:border-gray-300 print:text-gray-500">
            Thank you for your business! Goods once sold can be returned within policy guidelines.
          </div>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="cust-name">Customer Name</Label>
              <Input
                id="cust-name"
                placeholder="Enter customer name..."
                value={editCustomerName}
                onChange={(e) => setEditCustomerName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cust-phone">Phone Number</Label>
              <Input
                id="cust-phone"
                placeholder="e.g. +968 9123 4567"
                value={editCustomerPhone}
                onChange={(e) => setEditCustomerPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isUpdatingCustomer}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCustomer} disabled={isUpdatingCustomer}>
              {isUpdatingCustomer ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" /> Save to Receipt
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
