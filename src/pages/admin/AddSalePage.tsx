import { InvoiceData, InvoicePreviewModal } from "@/components/admin/InvoicePreviewModal";
import { CustomerCombobox } from "@/components/CustomerCombobox";
import { ProductCombobox } from "@/components/ProductCombobox";
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
import { useAddOrder, useProducts } from "@/hooks/useDatabase";
import { supabase } from "@/integrations/supabase/client";
import { AccountingEngine } from "@/modules/accounting/application/services/accounting.engine";
import { useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import { useUOMs } from "@/modules/product/presentation/hooks/useUOMs";
import { Building2, Loader2, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function AddSalePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editType = searchParams.get("type"); // "Sales Order" or "Sales Invoice"
  const isEditing = !!editId;

  const { toast } = useToast();
  const { customers } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUOMs();
  const { mutateAsync: createOrder, isPending: isCreating } = useAddOrder();

  const [customerId, setCustomerId] = useState("");
  const [phone, setPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
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
          const tableName = editType === "Sales Invoice" ? "sales_invoices" : "sales_orders";
          const { data, error } = await supabase
            .from(tableName)
            .select(`*, sales_order_items(*)`) // Assuming sales_invoices might also map items identically, though if it's sales_invoices, relations might differ. We fallback below.
            .eq("id", editId)
            .single();

          if (error) throw error;

          if (data) {
            setCustomerId(data.customer_id || "");
            const cust = customers?.find((c: any) => c.id === data.customer_id);
            if (cust) setPhone(cust.contact_phone || "");
            
            setInvoiceNumber(data.so_number || data.invoice_number || "");
            setInvoiceDate(data.order_date || data.invoice_date || data.created_at?.split('T')[0] || "");
            
            // Always query the journal entry for the actual amount paid
            const { data: jeData } = await supabase
              .from("journal_entries")
              .select(`
                id,
                journal_entry_lines (
                  debit_amount,
                  narration
                )
              `)
              .eq("reference_id", editId)
              .eq("reference_type", "sales_order"); // AccountingEngine ALWAYS uses 'sales_order'

            if (jeData && jeData.length > 0) {
               let totalPaid = 0;
               jeData.forEach((je: any) => {
                  if (je.journal_entry_lines) {
                     je.journal_entry_lines.forEach((line: any) => {
                        if (line.narration?.endsWith(" - Paid")) {
                           totalPaid += Number(line.debit_amount || 0);
                        }
                     });
                  }
               });
               if (totalPaid > 0) {
                 setPaymentType("Cash");
                 setIsReceived(true);
                 setReceivedAmount(totalPaid);
               } else {
                 setPaymentType(data.status?.toLowerCase() === 'paid' ? "Cash" : "Bank");
                 setIsReceived(false);
                 setReceivedAmount(0);
               }
            } else {
              setPaymentType(data.status?.toLowerCase() === 'paid' ? "Cash" : "Bank");
              setIsReceived(false);
              setReceivedAmount(0);
            }

            if (data.sales_order_items && data.sales_order_items.length > 0) {
              setItems(data.sales_order_items.map((item: any, idx: number) => ({
                 id: item.id || Date.now() + idx,
                 variation_id: item.variation_id || item.product_variation_id || "",
                 qty: item.quantity_ordered || item.quantity || 1,
                 uom: item.uom_id || "NONE",
                 price: Number(item.unit_price) || 0,
                 discountPct: 0,
                 discountAmt: Number(item.discount_amount) || 0,
                 taxPct: 0,
                 taxAmt: 0,
                 amount: Number(item.total_price) || 0,
              })));
            } else {
               // Add empty row if no items found
               setItems([{ id: Date.now(), variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }]);
            }
          }
        } catch (err: any) {
          toast({ variant: "destructive", title: "Error fetching data", description: err.message });
        } finally {
          setIsFetchingData(false);
        }
      };
      // We only fetch once we have customers available to map phone number
      if (customers && customers.length > 0) {
        fetchOrder();
      }
    }
  }, [editId, editType, customers]);

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
      const currentCust = customers?.find(c => c.id === customerId);
      const isDealer = currentCust?.customer_group === "Dealer";
      const dealerPrice = product.dealer_price && Number(product.dealer_price) > 0 ? Number(product.dealer_price) : null;
      const price = Number((isDealer && dealerPrice != null) ? dealerPrice : (variation?.sell_price || variation?.price || product.price || 0));

      const updatedItems = items.map((item, index) => {
        if (item.id === id) {
          if (index === items.length - 1) {
            isLastRow = true;
          }
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
  let balance = totalAmount - (Number(receivedAmount) || 0);

  const handleShowPreview = () => {
    if (!customerId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a customer." });
      return; 
    }
    
    const validItems = items.filter(i => i.variation_id && i.qty > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one valid item." });
      return;
    }

    const customer = customers?.find(c => c.id === customerId);
    let partyName = customer?.name || "CASH CUSTOMER";
    if (customerId.startsWith("NEW:")) {
       partyName = customerId.substring(4);
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
      type: "Sale",
      partyName,
      partyPhone: phone,
      invoiceNo: invoiceNumber || "Draft",
      date: invoiceDate,
      items: invoiceItems,
      totalQty,
      subTotal,
      discount: totalDiscount,
      tax: totalTax,
      roundOff: roundOff ? roundOffAmount : 0,
      total: totalAmount,
      received: receivedAmount,
      balance: balance
    });
    
    setShowPreview(true);
  };

  const handleCommitSave = async () => {
    if (!customerId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a customer." });
      return;
    }
    
    const validItems = items.filter(i => i.variation_id && i.qty > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one valid item." });
      return;
    }

    try {
      let finalCustomerId = customerId;
      
      // Handle inline customer creation
      if (customerId.startsWith("NEW:")) {
        const newName = customerId.substring(4);
        
        // Fetch an Asset account for the new customer
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: accounts } = await supabase
          .from("chart_of_accounts")
          .select("id")
          .eq("account_type", "Asset")
          .limit(1);
          
        if (!accounts || accounts.length === 0) {
          toast({ variant: "destructive", title: "Error", description: "No Asset account available to assign to the new customer." });
          return;
        }

        const { data: newCust, error } = await supabase
          .from("customers")
          .insert({
            name: newName,
            contact_phone: phone || null,
            receivable_account_id: accounts[0].id,
            is_active: true
          })
          .select()
          .single();

        if (error || !newCust) {
          toast({ variant: "destructive", title: "Error", description: "Failed to create customer: " + (error?.message || "Unknown error") });
          return;
        }
        finalCustomerId = newCust.id;
      }

      if (isEditing && editId) {
        const tableName = editType === "Sales Invoice" ? "sales_invoices" : "sales_orders";
        
        const updatePayload: any = {
          customer_id: finalCustomerId,
          total_amount: totalAmount,
          status: paymentType === "Cash" ? "paid" : "pending",
        };
        
        if (tableName === "sales_orders") {
          updatePayload.so_number = invoiceNumber || `SO-${Date.now()}`;
          updatePayload.order_date = invoiceDate;
        } else {
          updatePayload.invoice_number = invoiceNumber || `INV-${Date.now()}`;
          updatePayload.invoice_date = invoiceDate;
        }

        const { error: updateError } = await supabase
          .from(tableName)
          .update(updatePayload)
          .eq("id", editId);

        if (updateError) throw updateError;

        // For items, easiest is to delete all and insert new ones
        const itemsTableName = editType === "Sales Invoice" ? "sales_invoice_items" : "sales_order_items";
        const foreignKeyColumn = editType === "Sales Invoice" ? "sales_invoice_id" : "sales_order_id";
        
        // Skip items update for invoices if schema varies significantly, but let's try standard mapping
        if (tableName === "sales_orders") {
          const { error: deleteError } = await supabase
            .from("sales_order_items")
            .delete()
            .eq("sales_order_id", editId);
            
          if (deleteError) throw deleteError;
          
          const fallbackUomId = uoms && uoms.length > 0 ? uoms[0].id : undefined;

          const itemsToInsert = validItems.map(item => ({
            sales_order_id: editId,
            variation_id: item.variation_id,
            quantity_ordered: item.qty,
            unit_price: item.price,
            total_price: item.amount,
            discount_amount: 0,
            uom_id: item.uom && item.uom !== "NONE" ? item.uom : fallbackUomId,
          }));
          
          const { error: insertItemsError } = await supabase
            .from("sales_order_items")
            .insert(itemsToInsert);
            
          if (insertItemsError) throw insertItemsError;
        }

        // 3. Update accounting: reverse old entry and post new one
        try {
          await AccountingEngine.reverseSalesOrder(editId);
          let receivableAccountId = undefined;
          if (finalCustomerId) {
            const { data: customerData } = await supabase
              .from("customers")
              .select("receivable_account_id")
              .eq("id", finalCustomerId)
              .single();
            if (customerData?.receivable_account_id) {
              receivableAccountId = customerData.receivable_account_id;
            }
          }

          await AccountingEngine.postSalesOrder(
            editId,
            tableName === "sales_orders" ? (invoiceNumber || `SO-${Date.now()}`) : (invoiceNumber || `INV-${Date.now()}`),
            totalAmount,
            Number(receivedAmount) || 0,
            receivableAccountId
          );
        } catch (accError) {
          console.error("Failed to update accounting for edited sale:", accError);
          // Non-fatal, just log it. The app doesn't have strict transaction boundaries.
        }

        toast({ title: "Success", description: "Transaction updated successfully." });
        navigate(-1);
      } else {
        await createOrder({
          customer_id: finalCustomerId,
          total: totalAmount.toString(),
          subtotal: (totalAmount + totalDiscount - totalTax).toString(),
          discount_amount: totalDiscount.toString(),
          tax_amount: totalTax.toString(),
          shipping_method_id: null,
          shipping_cost: "0",
          billing_address_id: null,
          shipping_address_id: null,
          status: "confirmed",
          payment_status: paymentType === "Cash" ? "paid" : "pending",
          paid_amount: receivedAmount,
          coupon_id: null,
          notes: "Created via Add Sale page",
          items: validItems.map(item => ({
            product_variation_id: item.variation_id,
            quantity: item.qty,
            unit_price: item.price.toString(),
            total_price: item.amount.toString(),
          }))
        });
        
        toast({ title: "Success", description: "Sale created successfully." });
        navigate("/admin/orders");
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

  const handleCustomerChange = (val: string, newCust?: any) => {
    setCustomerId(val);
    const cust = newCust || customers?.find(c => c.id === val);
    if (cust && cust.contact_phone) setPhone(cust.contact_phone);

    if (cust?.customer_group === "Dealer") {
      const hasValidItems = items.some(i => i.variation_id);
      if (hasValidItems) {
        setItems(prev => prev.map(item => {
          if (!item.variation_id) return item;
          const prod = products.find(p => p.product_variations?.some((v: any) => v.id === item.variation_id) || p.id === item.variation_id);
          const dPrice = prod?.dealer_price && Number(prod.dealer_price) > 0 ? Number(prod.dealer_price) : null;
          if (dPrice != null) {
            const baseAmt = item.qty * dPrice;
            const dAmt = item.discountPct ? baseAmt * (item.discountPct / 100) : item.discountAmt;
            const afterDiscount = baseAmt - dAmt;
            const tAmt = item.taxPct ? afterDiscount * (item.taxPct / 100) : item.taxAmt;
            return {
              ...item,
              price: dPrice,
              discountAmt: dAmt,
              taxAmt: tAmt,
              amount: afterDiscount + tAmt,
            };
          }
          return item;
        }));
        toast({ title: "Dealer Selected", description: "Wholesale dealer pricing automatically applied to eligible items." });
      }
    }
  };

  const selectedParty = customers?.find(c => c.id === customerId);

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Sale" : "Sale"}</h1>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6 shadow-sm">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Customer *</Label>
              {selectedParty?.customer_group === "Dealer" && (
                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Dealer Pricing
                </span>
              )}
            </div>
            <CustomerCombobox
              customers={customers || []}
              value={customerId}
              onChange={handleCustomerChange}
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
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Invoice Number</Label>
            <Input 
              value={invoiceNumber} 
              onChange={e => setInvoiceNumber(e.target.value)} 
              placeholder="Auto-generated"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Invoice Date</Label>
            <Input 
              type="date"
              value={invoiceDate} 
              onChange={e => setInvoiceDate(e.target.value)}
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
                  <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-red-600 hover:text-red-700 hover:bg-red-50">
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 pt-4">
          <div className="space-y-4 lg:col-span-1">
            <div className="border rounded-md p-4 bg-muted/10">
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Terms & Conditions</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Sales Invoice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Sales Invoice</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
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

          <div className="space-y-4 lg:col-span-2">
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
                    }
                  }} 
                />
                <Label htmlFor="is-received" className="cursor-pointer font-bold whitespace-nowrap">Received</Label>
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
              <Button variant="outline" onClick={() => navigate("/admin/orders")}>Cancel</Button>
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
