import { QuickCalculatorPopover } from "@/components/admin/QuickCalculatorPopover";
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
import { useWarehouses } from "@/modules/warehouse/presentation/hooks/useWarehouses";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, Plus, Settings, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface SaleDraft {
  id: string;
  tabNumber: number;
  customerId: string;
  phone: string;
  warehouseId: string;
  invoiceNumber: string;
  invoiceDate: string;
  paymentType: string;
  roundOff: boolean;
  roundOffAmount: number;
  isReceived: boolean;
  receivedAmount: number;
  items: Array<{
    id: number;
    variation_id: string;
    qty: number;
    uom: string;
    price: number;
    discountPct: number;
    discountAmt: number;
    taxPct: number;
    taxAmt: number;
    amount: number;
  }>;
}

const createInitialSaleDraft = (tabNum: number, whId = ""): SaleDraft => ({
  id: `sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  tabNumber: tabNum,
  customerId: "",
  phone: "",
  warehouseId: whId,
  invoiceNumber: "",
  invoiceDate: new Date().toISOString().split("T")[0],
  paymentType: "Cash",
  roundOff: false,
  roundOffAmount: 0,
  isReceived: false,
  receivedAmount: 0,
  items: [
    { id: 1, variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
  ]
});

export default function AddSalePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const editType = searchParams.get("type"); // "Sales Order" or "Sales Invoice"
  const isEditing = !!editId;

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { customers } = useCustomers();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUOMs();
  const { warehouses = [] } = useWarehouses();
  const { mutateAsync: createOrder, isPending: isCreating } = useAddOrder();

  const [tabs, setTabs] = useState<SaleDraft[]>(() => [createInitialSaleDraft(1)]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || "");
  const [tabCounter, setTabCounter] = useState(2);

  const activeDraft = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const updateActiveDraft = (
    updater: Partial<SaleDraft> | ((prev: SaleDraft) => Partial<SaleDraft>)
  ) => {
    setTabs((prevTabs) =>
      prevTabs.map((t) => {
        if (t.id === activeDraft.id) {
          const updates = typeof updater === "function" ? updater(t) : updater;
          return { ...t, ...updates };
        }
        return t;
      })
    );
  };

  const customerId = activeDraft.customerId;
  const phone = activeDraft.phone;
  const warehouseId = activeDraft.warehouseId;
  const invoiceNumber = activeDraft.invoiceNumber;
  const invoiceDate = activeDraft.invoiceDate;
  const paymentType = activeDraft.paymentType;
  const roundOff = activeDraft.roundOff;
  const roundOffAmount = activeDraft.roundOffAmount;
  const isReceived = activeDraft.isReceived;
  const receivedAmount = activeDraft.receivedAmount;
  const items = activeDraft.items;

  const setCustomerId = (val: string) => updateActiveDraft({ customerId: val });
  const setPhone = (val: string) => updateActiveDraft({ phone: val });
  const setWarehouseId = (val: string) => updateActiveDraft({ warehouseId: val });
  const setInvoiceNumber = (val: string) => updateActiveDraft({ invoiceNumber: val });
  const setInvoiceDate = (val: string) => updateActiveDraft({ invoiceDate: val });
  const setPaymentType = (val: string) => updateActiveDraft({ paymentType: val });
  const setRoundOff = (val: boolean) => updateActiveDraft({ roundOff: val });
  const setRoundOffAmount = (val: number) => updateActiveDraft({ roundOffAmount: val });
  const setIsReceived = (val: boolean) => updateActiveDraft({ isReceived: val });
  const setReceivedAmount = (val: number) => updateActiveDraft({ receivedAmount: val });
  const setItems = (action: React.SetStateAction<typeof activeDraft.items>) => {
    updateActiveDraft((prev) => {
      const nextItems = typeof action === "function" ? action(prev.items) : action;
      return { items: nextItems };
    });
  };

  const handleAddNewTab = () => {
    const newDraft = createInitialSaleDraft(tabCounter, warehouses[0]?.id || "");
    setTabCounter((prev) => prev + 1);
    setTabs((prev) => [...prev, newDraft]);
    setActiveTabId(newDraft.id);
  };

  const handleCloseTab = (tabIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      const reset = createInitialSaleDraft(1, warehouses[0]?.id || "");
      setTabs([reset]);
      setActiveTabId(reset.id);
      return;
    }
    const idx = tabs.findIndex((t) => t.id === tabIdToClose);
    const remaining = tabs.filter((t) => t.id !== tabIdToClose);
    setTabs(remaining);
    if (activeTabId === tabIdToClose) {
      const nextActive = remaining[Math.max(0, idx - 1)];
      setActiveTabId(nextActive.id);
    }
  };

  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<InvoiceData | null>(null);
  const [isFetchingData, setIsFetchingData] = useState(false);

  // Default to first active warehouse if available and not set
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !warehouseId && !editId) {
      setWarehouseId(warehouses[0].id);
    }
  }, [warehouses, warehouseId, editId]);

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
            
            // Try resolving warehouse from existing stock ledger for this sale
            const { data: ledgerData } = await supabase
              .from("stock_ledgers")
              .select("warehouse_id")
              .eq("reference_id", editId)
              .limit(1)
              .maybeSingle();

            if (ledgerData?.warehouse_id) {
              setWarehouseId(ledgerData.warehouse_id);
            } else if (warehouses && warehouses.length > 0) {
              setWarehouseId(warehouses[0].id);
            }

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

    if (!warehouseId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a warehouse." });
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

        // 1. Reverse previous inventory movements for this sale order
        try {
          const { data: previousLedgers } = await supabase
            .from("stock_ledgers")
            .select("*")
            .eq("reference_type", "sales_order")
            .eq("reference_id", editId);

          if (previousLedgers && previousLedgers.length > 0) {
            const { StockRepository } = await import("@/modules/warehouse/infrastructure/repositories/stock.repository");
            for (const ledger of previousLedgers) {
              const absQty = Math.abs(Number(ledger.quantity));
              const currentBal = await StockRepository.getBalance(
                ledger.warehouse_id,
                ledger.variation_id,
                ledger.bin_id || null,
                null
              );
              const restoredQty = (currentBal ? currentBal.quantity : 0) + absQty;
              await StockRepository.upsertBalance({
                warehouse_id: ledger.warehouse_id,
                variation_id: ledger.variation_id,
                bin_id: ledger.bin_id || null,
                batch_number: null,
                quantity: restoredQty,
              });
            }
            await supabase
              .from("stock_ledgers")
              .delete()
              .eq("reference_type", "sales_order")
              .eq("reference_id", editId);
          }
        } catch (invRevError) {
          console.error("Failed to reverse previous inventory for edited sale:", invRevError);
        }

        // For items, easiest is to delete all and insert new ones
        if (tableName === "sales_orders") {
          const { error: deleteError } = await supabase
            .from("sales_order_items")
            .delete()
            .eq("sales_order_id", editId);
            
          if (deleteError) throw deleteError;
          
          const fallbackUomId = uoms && uoms.length > 0 ? uoms[0].id : "00000000-0000-0000-0000-000000000000";

          const itemsToInsert = validItems.map(item => ({
            sales_order_id: editId,
            variation_id: item.variation_id,
            quantity_ordered: item.qty,
            quantity_delivered: item.qty,
            unit_price: item.price,
            total_price: item.amount,
            discount_amount: 0,
            uom_id: item.uom && item.uom !== "NONE" ? item.uom : fallbackUomId,
          }));
          
          const { error: insertItemsError } = await supabase
            .from("sales_order_items")
            .insert(itemsToInsert);
            
          if (insertItemsError) throw insertItemsError;

          // Deduct new inventory movements for the updated sale
          const { InventoryEngine } = await import("@/modules/inventory/application/services/inventory.engine");
          for (const item of validItems) {
            await InventoryEngine.processMovement({
              variation_id: item.variation_id,
              warehouse_id: warehouseId,
              uom_id: item.uom && item.uom !== "NONE" ? item.uom : fallbackUomId,
              quantity: -item.qty,
              reference_type: "sales_order",
              reference_id: editId,
              unit_cost: 0,
            });
          }
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
        }

        queryClient.invalidateQueries({ queryKey: ["orders"] });
        queryClient.invalidateQueries({ queryKey: ["sales_orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        queryClient.invalidateQueries({ queryKey: ["products", "active"] });
        queryClient.invalidateQueries({ queryKey: ["stock_balances"] });
        queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
        queryClient.invalidateQueries({ queryKey: ["fifo_ledgers"] });
        queryClient.invalidateQueries({ queryKey: ["stock_ledgers"] });

        toast({ title: "Success", description: "Transaction updated successfully." });
        navigate(-1);
      } else {
        const fallbackUomId = uoms && uoms.length > 0 ? uoms[0].id : "00000000-0000-0000-0000-000000000000";
        await createOrder({
          customer_id: finalCustomerId,
          warehouse_id: warehouseId,
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
            uom_id: item.uom && item.uom !== "NONE" ? item.uom : fallbackUomId,
            unit_price: item.price.toString(),
            total_price: item.amount.toString(),
          }))
        } as any);
        
        const hadNegativeStock = validItems.some((i) => {
          const prod = products.find((p) =>
            p.product_variations?.some((v: any) => v.id === i.variation_id)
          );
          const vr = prod?.product_variations?.find(
            (v: any) => v.id === i.variation_id
          );
          const currentWhStock =
            vr?.stock_balances
              ?.filter((b: any) => !warehouseId || b.warehouse_id === warehouseId)
              ?.reduce((s: number, b: any) => s + Number(b.quantity || 0), 0) ?? 0;
          return currentWhStock < i.qty;
        });

        if (hadNegativeStock) {
          toast({
            title: "Sale recorded (Negative Stock)",
            description:
              "Items were sold on deficit. Reorder them via Warehouse Dashboard when convenient.",
          });
        } else {
          toast({ title: "Success", description: "Sale created successfully." });
        }
        if (tabs.length > 1) {
          const remaining = tabs.filter((t) => t.id !== activeDraft.id);
          setTabs(remaining);
          setActiveTabId(remaining[0].id);
        } else {
          navigate("/admin/orders");
        }
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
    <div className="space-y-4 max-w-[1200px] mx-auto pb-20">
      {/* Vyapar Desktop Tab Bar */}
      <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-xs">
        {/* Left: Tab List + Plus Button */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const customerName = customers?.find((c) => c.id === tab.customerId)?.name;
            const label = `Sale #${tab.tabNumber}${customerName ? ` (${customerName})` : ""}`;

            return (
              <div
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`group flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-150 select-none ${
                  isActive
                    ? "bg-white text-slate-900 border-slate-300/90 shadow-xs ring-1 ring-slate-200"
                    : "bg-slate-200/70 text-slate-600 border-slate-300/50 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                <span className="truncate max-w-[150px]">{label}</span>
                <button
                  type="button"
                  onClick={(e) => handleCloseTab(tab.id, e)}
                  className="w-4 h-4 rounded-full flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-slate-100 transition-colors"
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          {/* Plus Button */}
          <button
            type="button"
            onClick={handleAddNewTab}
            className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-xs transition-transform active:scale-95 ml-1 shrink-0 cursor-pointer"
            title="New Sale (Add Tab)"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Right: Quick Tools */}
        <div className="flex items-center gap-1.5 text-slate-500 shrink-0 pl-3">
          <QuickCalculatorPopover />
          <Link
            to="/admin/settings"
            className="p-1.5 rounded-lg hover:text-slate-900 hover:bg-slate-200/80 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => navigate("/admin/orders")}
            className="p-1.5 rounded-lg hover:text-red-600 hover:bg-slate-200/80 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">{isEditing ? "Edit Sale" : "Sale"}</h1>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6 shadow-sm">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
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
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Warehouse *</Label>
            <Select value={warehouseId} onValueChange={setWarehouseId}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select Warehouse" />
              </SelectTrigger>
              <SelectContent>
                {warehouses.map((wh) => (
                  <SelectItem key={wh.id} value={wh.id}>
                    {wh.name} {wh.code ? `(${wh.code})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                      warehouseId={warehouseId}
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

          <div className="space-y-4 lg:col-span-3">
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
                    if (checked) {
                      setReceivedAmount(Number(totalAmount.toFixed(2)));
                    } else {
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
                  } else if (val === 0 && isReceived) {
                    setIsReceived(false);
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
