import { InvoiceData, InvoicePreviewModal } from "@/components/admin/InvoicePreviewModal";
import { ProductCombobox } from "@/components/ProductCombobox";
import { SupplierCombobox } from "@/components/SupplierCombobox";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { useUOMs } from "@/modules/product/presentation/hooks/useUOMs";
import { usePurchaseOrders } from "@/modules/purchase/presentation/hooks/usePurchaseOrders";
import { useSuppliers } from "@/modules/supplier/presentation/hooks/useSuppliers";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AddPurchasePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editType = searchParams.get("type"); // "Purchase Order" or "Purchase Invoice"
  const isEditing = !!editId;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { suppliers } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUOMs();
  const { createOrder, isCreating } = usePurchaseOrders();

  const [supplierId, setSupplierId] = useState("");
  const [phone, setPhone] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [paymentType, setPaymentType] = useState("Cash");
  const [roundOff, setRoundOff] = useState(false);
  const [roundOffAmount, setRoundOffAmount] = useState(0);
  const [isReceived, setIsReceived] = useState(false);
  const [receivedAmount, setReceivedAmount] = useState(0);

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);

  const [items, setItems] = useState([
    { id: 1, variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
  ]);

  const [isFetchingData, setIsFetchingData] = useState(false);

  useEffect(() => {
    if (editId) {
      const fetchOrder = async () => {
        setIsFetchingData(true);
        try {
          const tableName = editType === "Purchase Invoice" ? "purchase_invoices" : "purchase_orders";
          const itemsRelation = editType === "Purchase Invoice" ? "purchase_invoice_items(*)" : "purchase_order_items(*)";

          const { data, error } = await (supabase as any)
            .from(tableName)
            .select(`*, ${itemsRelation}`)
            .eq("id", editId)
            .single();

          if (error) throw error;

          if (data) {
            setSupplierId(data.supplier_id || "");
            const supp = suppliers?.find((s: any) => s.id === data.supplier_id);
            if (supp && supp.contact_phone) setPhone(supp.contact_phone);

            setBillNumber(data.po_number || data.invoice_number || data.supplier_invoice_number || "");
            setBillDate(data.order_date || data.invoice_date || data.created_at?.split("T")[0] || "");

            // Query journal entries for paid amount
            const { data: jeData } = await supabase
              .from("journal_entries")
              .select(`
                id,
                journal_entry_lines (
                  debit_amount,
                  credit_amount,
                  narration
                )
              `)
              .eq("reference_id", editId)
              .in("reference_type", ["purchase_order", "purchase_invoice"]);

            if (jeData && jeData.length > 0) {
              let totalPaid = 0;
              jeData.forEach((je: any) => {
                if (je.journal_entry_lines) {
                  je.journal_entry_lines.forEach((line: any) => {
                    if (line.narration?.includes("- Paid")) {
                      totalPaid += Number(line.credit_amount || line.debit_amount || 0);
                    }
                  });
                }
              });

              if (totalPaid > 0) {
                setPaymentType("Cash");
                setIsReceived(true);
                setReceivedAmount(totalPaid);
              } else {
                setPaymentType(data.status?.toLowerCase() === "paid" ? "Cash" : "Bank");
                setIsReceived(false);
                setReceivedAmount(0);
              }
            } else {
              setPaymentType(data.status?.toLowerCase() === "paid" ? "Cash" : "Bank");
              setIsReceived(false);
              setReceivedAmount(0);
            }

            const rawItems = data.purchase_order_items || data.purchase_invoice_items;
            if (rawItems && rawItems.length > 0) {
              setItems(
                rawItems.map((item: any, idx: number) => ({
                  id: item.id || Date.now() + idx,
                  variation_id: item.variation_id || "",
                  qty: item.quantity_ordered || item.quantity_billed || item.quantity || 1,
                  uom: item.uom_id || "NONE",
                  price: Number(item.unit_price) || 0,
                  discountPct: 0,
                  discountAmt: Number(item.discount_amount) || 0,
                  taxPct: 0,
                  taxAmt: 0,
                  amount:
                    Number(item.total_price) ||
                    Number((item.unit_price || 0) * (item.quantity_ordered || item.quantity_billed || 1)),
                }))
              );
            } else {
              setItems([
                { id: Date.now(), variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
              ]);
            }
          }
        } catch (err: any) {
          toast({ variant: "destructive", title: "Error fetching data", description: err.message });
        } finally {
          setIsFetchingData(false);
        }
      };

      if (suppliers && suppliers.length > 0) {
        fetchOrder();
      }
    }
  }, [editId, editType, suppliers]);


  const handleAddRow = () => {
    setItems([
      ...items,
      { id: Date.now(), variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
    ]);
  };

  const handleRemoveRow = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amounts if price, qty, discount, or tax change
        if (["qty", "price", "discountPct", "discountAmt", "taxPct", "taxAmt"].includes(field)) {
          let baseAmt = (field === "qty" ? value : updated.qty) * (field === "price" ? value : updated.price);
          
          let dAmt = updated.discountAmt;
          if (field === "discountPct") {
            dAmt = baseAmt * (value / 100);
            updated.discountAmt = dAmt;
          } else if (field === "discountAmt") {
            updated.discountPct = baseAmt > 0 ? (value / baseAmt) * 100 : 0;
          }

          let afterDiscount = baseAmt - dAmt;

          let tAmt = updated.taxAmt;
          if (field === "taxPct") {
            tAmt = afterDiscount * (value / 100);
            updated.taxAmt = tAmt;
          } else if (field === "taxAmt") {
            updated.taxPct = afterDiscount > 0 ? (value / afterDiscount) * 100 : 0;
          }

          updated.amount = afterDiscount + tAmt;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleProductSelect = (id: number, variationId: string, directVariation?: any, directProduct?: any) => {
    const product = directProduct || products.find(p => p.product_variations?.some((v: any) => v.id === variationId) || p.id === directProduct?.id);
    const variation = directVariation || product?.product_variations?.find((v: any) => v.id === variationId);
    
    if (product) {
      let isLastRow = false;
      const updatedItems = items.map((item, index) => {
        if (item.id === id) {
          if (index === items.length - 1) {
            isLastRow = true;
          }
          const price = Number(variation?.cost_price || product.original_price || product.price || 0);
          const qty = item.qty === 0 ? 1 : (item.qty || 1);
          return {
            ...item,
            qty: qty,
            variation_id: variationId,
            uom: product.base_uom_id || "NONE",
            price: price,
            discountPct: 0,
            discountAmt: 0,
            taxPct: 0,
            taxAmt: 0,
            amount: price * qty
          };
        }
        return item;
      });

      if (isLastRow) {
        updatedItems.push({ 
          id: Date.now(), 
          variation_id: "", 
          qty: 0, 
          uom: "NONE", 
          price: 0, 
          discountPct: 0, 
          discountAmt: 0, 
          taxPct: 0, 
          taxAmt: 0, 
          amount: 0 
        });
      }
      
      setItems(updatedItems);
    }
  };

  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discountAmt) || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (Number(item.taxAmt) || 0), 0);
  let totalAmount = items.reduce((sum, item) => sum + (item.amount || 0), 0);
  if (roundOff) {
    totalAmount += (Number(roundOffAmount) || 0);
  }
  let balance = totalAmount - (isReceived ? (Number(receivedAmount) || 0) : 0);

  const handleShowPreview = () => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier." });
      return;
    }
    
    const validItems = items.filter(i => i.variation_id && i.qty > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one valid item." });
      return;
    }

    const supplier = suppliers?.find(s => s.id === supplierId);
    let partyName = supplier?.name || "CASH SUPPLIER";
    if (supplierId.startsWith("NEW:")) {
       partyName = supplierId.substring(4);
    }

    const invoiceItems = validItems.map(item => {
       const product = products.find(p => p.product_variations?.some((v: any) => v.id === item.variation_id));
       const variation = product?.product_variations?.find((v: any) => v.id === item.variation_id);
       return {
         name: variation?.name ? `${product?.name} - ${variation.name}` : (product?.name || 'Unknown'),
         qty: item.qty,
         price: item.price,
         taxPct: item.taxPct,
         amount: item.amount
       };
    });

    const subTotal = validItems.reduce((sum, item) => sum + (item.price * item.qty), 0);

    setPreviewData({
      type: "Purchase",
      partyName,
      partyPhone: phone,
      invoiceNo: billNumber || "Draft",
      date: billDate,
      items: invoiceItems,
      totalQty,
      subTotal,
      discount: totalDiscount,
      tax: totalTax,
      roundOff: roundOff ? roundOffAmount : 0,
      total: totalAmount,
      received: isReceived ? receivedAmount : 0,
      balance: balance
    });
    
    setShowPreview(true);
  };

  const handleCommitSave = async () => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier." });
      return;
    }
    
    const validItems = items.filter(i => i.variation_id && i.qty > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one valid item." });
      return;
    }

    try {
      let finalSupplierId = supplierId;
      
      // Handle inline supplier creation
      if (supplierId.startsWith("NEW:")) {
        const newName = supplierId.substring(4);
        
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: newAccount, error: accError } = await supabase
          .from("chart_of_accounts")
          .insert({
            name: `AP - ${newName}`,
            account_number: `AP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            account_type: "Liability",
            is_group: false,
            is_active: true
          })
          .select("id")
          .single();
          
        if (accError || !newAccount) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create account for new supplier." });
          return;
        }

        const { data: newSupp, error } = await supabase
          .from("suppliers")
          .insert({
            name: newName,
            contact_phone: phone || null,
            payable_account_id: newAccount.id,
            is_active: true
          })
          .select()
          .single();

        if (error || !newSupp) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create supplier: " + (error?.message || "Unknown error") });
          return;
        }
        finalSupplierId = newSupp.id;
      }

      if (isEditing && editId) {
        const tableName = editType === "Purchase Invoice" ? "purchase_invoices" : "purchase_orders";

        const updatePayload: any = {
          supplier_id: finalSupplierId,
          total_amount: totalAmount,
          status: (isReceived && receivedAmount >= totalAmount) ? "Paid" : "Pending",
          updated_at: new Date().toISOString(),
        };

        if (tableName === "purchase_orders") {
          updatePayload.po_number = billNumber || `PO-${Date.now()}`;
          updatePayload.order_date = billDate;
        } else {
          updatePayload.invoice_number = billNumber || `INV-${Date.now()}`;
          updatePayload.invoice_date = billDate;
        }

        const { error: updateError } = await (supabase as any)
          .from(tableName)
          .update(updatePayload)
          .eq("id", editId);

        if (updateError) throw updateError;

        if (tableName === "purchase_orders") {
          const { error: deleteError } = await supabase
            .from("purchase_order_items")
            .delete()
            .eq("purchase_order_id", editId);

          if (deleteError) throw deleteError;

          const fallbackUomId = uoms && uoms.length > 0 ? uoms[0].id : undefined;

          const itemsToInsert = validItems.map((item) => ({
            purchase_order_id: editId,
            variation_id: item.variation_id,
            quantity_ordered: item.qty,
            unit_price: item.price,
            total_price: item.amount,
            uom_id: item.uom && item.uom !== "NONE" ? item.uom : (fallbackUomId as string),
          }));

          const { error: insertItemsError } = await supabase
            .from("purchase_order_items")
            .insert(itemsToInsert);

          if (insertItemsError) throw insertItemsError;
        }

        // Update accounting: reverse previous entries and post new one
        try {
          const { AccountingEngine } = await import("@/modules/accounting/application/services/accounting.engine");
          await AccountingEngine.reversePurchaseOrder(editId);

          let payableAccountId = undefined;
          if (finalSupplierId) {
            const { data: suppData } = await supabase
              .from("suppliers")
              .select("payable_account_id")
              .eq("id", finalSupplierId)
              .single();
            if (suppData?.payable_account_id) {
              payableAccountId = suppData.payable_account_id;
            }
          }

          await AccountingEngine.postPurchaseOrder(
            editId,
            tableName === "purchase_orders"
              ? (billNumber || `PO-${Date.now()}`)
              : (billNumber || `INV-${Date.now()}`),
            totalAmount,
            Number(receivedAmount) || 0,
            payableAccountId
          );
        } catch (accError) {
          console.error("Failed to update accounting for edited purchase order:", accError);
        }

        await queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
        await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
        await queryClient.invalidateQueries({ queryKey: ["supplier-history"] });
        await queryClient.invalidateQueries({ queryKey: ["suppliers"] });

        toast({ title: "Success", description: "Purchase order updated successfully." });
        navigate(-1);
      } else {
        await createOrder({
          po: {
            supplier_id: finalSupplierId,
            po_number: billNumber || `PO-${Date.now()}`,
            order_date: billDate,
            status: "Draft",
            paid_amount: isReceived ? receivedAmount : 0, // Pass paid amount
          } as any, // Cast as any because paid_amount isn't in DB schema for purchase_orders
          items: validItems.map(item => ({
            variation_id: item.variation_id,
            uom_id: item.uom,
            quantity_ordered: item.qty,
            unit_price: item.price,
            // We can send discount and tax if the backend supports it, for now just what's required
          }))
        });
        
        toast({ title: "Success", description: "Purchase order created successfully." });
        navigate("/admin/purchase-orders");
      }
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  if (isFetchingData) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Purchase Order" : "Purchase"}</h1>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6 shadow-sm">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Party *</Label>
            <SupplierCombobox
              suppliers={suppliers || []}
              value={supplierId}
              onChange={(val, newSupp) => {
                setSupplierId(val);
                const supp = newSupp || suppliers?.find(s => s.id === val);
                if (supp && supp.contact_phone) setPhone(supp.contact_phone);
              }}
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Phone No.</Label>
            <Input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="Phone number"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Bill Number</Label>
            <Input 
              value={billNumber} 
              onChange={e => setBillNumber(e.target.value)} 
              placeholder="Optional"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Bill Date</Label>
            <Input 
              type="date"
              value={billDate} 
              onChange={e => setBillDate(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="border rounded-md overflow-hidden bg-background">
          <Table className="border-collapse">
            <TableHeader className="bg-muted">
              <TableRow className="h-10 border-b">
                <TableHead className="w-12 text-center border-r font-semibold align-middle" rowSpan={2}>#</TableHead>
                <TableHead className="min-w-[250px] border-r font-semibold align-middle" rowSpan={2}>Item / Product</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold align-middle" rowSpan={2}>Qty</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold align-middle" rowSpan={2}>Unit</TableHead>
                <TableHead className="w-28 border-r text-right font-semibold align-middle" rowSpan={2}>Price</TableHead>
                <TableHead className="w-48 border-r text-center font-semibold" colSpan={2}>Discount</TableHead>
                <TableHead className="w-48 border-r text-center font-semibold" colSpan={2}>Tax</TableHead>
                <TableHead className="w-32 text-right font-semibold align-middle" rowSpan={2}>Net Amount</TableHead>
              </TableRow>
              <TableRow className="h-8 border-b">
                <TableHead className="w-24 border-r text-center font-semibold bg-muted/50">%</TableHead>
                <TableHead className="w-24 border-r text-right font-semibold bg-muted/50">Amount</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold bg-muted/50">%</TableHead>
                <TableHead className="w-24 border-r text-right font-semibold bg-muted/50">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className="group border-b transition-colors hover:bg-muted/30">
                  <TableCell className="text-center border-r p-2 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-4 text-muted-foreground font-medium">{index + 1}</span>
                      <button 
                        onClick={() => handleRemoveRow(item.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="p-0 border-r">
                    <ProductCombobox 
                      products={products}
                      value={item.variation_id}
                      onChange={(v, directVar, directProd) => handleProductSelect(item.id, v, directVar, directProd)}
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input
                      type="number"
                      min="0"
                      value={item.qty === 0 ? '' : item.qty}
                      onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                     <Select value={item.uom} onValueChange={v => updateItem(item.id, 'uom', v)}>
                      <SelectTrigger className="border-0 shadow-none focus:ring-1 h-9 rounded bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">NONE</SelectItem>
                        {uoms?.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.abbreviation || u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0" 
                      value={item.price || ''} 
                      onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.discountPct || ''} 
                      onChange={e => updateItem(item.id, 'discountPct', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                     <Input 
                      type="number" 
                      min="0"
                      value={item.discountAmt || ''} 
                      onChange={e => updateItem(item.id, 'discountAmt', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.taxPct || ''} 
                      onChange={e => updateItem(item.id, 'taxPct', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.taxAmt || ''} 
                      onChange={e => updateItem(item.id, 'taxAmt', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-4 font-medium align-middle">
                    {item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-muted/20 font-semibold">
                <TableCell colSpan={2} className="border-r p-2">
                  <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" /> ADD ROW
                  </Button>
                </TableCell>
                <TableCell className="text-center border-r align-middle">{totalQty}</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">TOTAL</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">{totalDiscount.toFixed(2)}</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">{totalTax.toFixed(2)}</TableCell>
                <TableCell className="text-right pr-4 align-middle">{items.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Footer Area */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4">
          <div className="space-y-4 md:col-span-1">
            <div className="border rounded-md p-4 bg-muted/10">
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Terms & Conditions</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Purchase Bill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Purchase Bill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
              <Upload className="w-4 h-4 mr-2" /> Upload Bill
            </Button>
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
                <SelectItem value="Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4 md:col-span-2">
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox id="round-off" checked={roundOff} onCheckedChange={(c) => setRoundOff(!!c)} />
                <Label htmlFor="round-off" className="cursor-pointer whitespace-nowrap">Round Off</Label>
              </div>
              <Input 
                type="number" 
                value={roundOffAmount === 0 ? '' : roundOffAmount} 
                onChange={e => setRoundOffAmount(Number(e.target.value))}
                className="w-24 h-9 text-right bg-transparent border-gray-300 shadow-none"
              />
              <div className="flex items-center w-full sm:w-56 bg-muted/20 border border-gray-300 rounded overflow-hidden">
                <span className="px-3 py-1.5 font-bold text-muted-foreground border-r bg-muted/10 w-20 text-center whitespace-nowrap">Total</span>
                <span className="px-3 py-1.5 font-bold flex-1 text-right">{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex flex-wrap sm:flex-nowrap items-center justify-end gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="is-received" 
                  checked={isReceived} 
                  onCheckedChange={(c) => {
                    const checked = !!c;
                    setIsReceived(checked);
                    if (!checked) {
                      setReceivedAmount(0);
                    } else if (receivedAmount === 0) {
                      setReceivedAmount(totalAmount);
                    }
                  }} 
                />
                <Label htmlFor="is-received" className="cursor-pointer font-bold whitespace-nowrap">Paid</Label>
              </div>
              <Input 
                type="number" 
                value={receivedAmount === 0 ? '' : receivedAmount} 
                onChange={e => {
                  const val = Number(e.target.value);
                  setReceivedAmount(val);
                  if (val > 0 && !isReceived) {
                    setIsReceived(true);
                  }
                }}
                className="w-full sm:w-56 h-9 text-right bg-transparent border-gray-300 shadow-none font-bold"
              />
            </div>
            
            <div className="flex justify-end pr-3">
              <span className="font-bold mr-6 whitespace-nowrap">Balance</span>
              <span className="font-bold min-w-[3rem] text-right">{balance.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/admin/purchase-orders")}>Cancel</Button>
              <Button onClick={handleShowPreview} disabled={isCreating} className="bg-red-500 hover:bg-red-600 w-32 text-white shadow-sm">
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
      <InvoicePreviewModal 
        open={showPreview} 
        onOpenChange={setShowPreview} 
        onSave={() => {
          setShowPreview(false);
          handleCommitSave();
        }} 
        data={previewData} 
      />
    </div>
  );
}
