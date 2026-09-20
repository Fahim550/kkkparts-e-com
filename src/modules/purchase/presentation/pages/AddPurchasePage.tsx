import { QuickCalculatorPopover } from "@/components/admin/QuickCalculatorPopover";
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
import { Loader2, Plus, Settings, Trash2, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

interface PurchaseDraft {
  id: string;
  tabNumber: number;
  supplierId: string;
  phone: string;
  billNumber: string;
  billDate: string;
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

const createInitialPurchaseDraft = (tabNum: number): PurchaseDraft => ({
  id: `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  tabNumber: tabNum,
  supplierId: "",
  phone: "",
  billNumber: "",
  billDate: new Date().toISOString().split("T")[0],
  paymentType: "Cash",
  roundOff: false,
  roundOffAmount: 0,
  isReceived: false,
  receivedAmount: 0,
  items: [
    { id: 1, variation_id: "", qty: 0, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
  ]
});

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

  const [tabs, setTabs] = useState<PurchaseDraft[]>(() => [createInitialPurchaseDraft(1)]);
  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || "");
  const [tabCounter, setTabCounter] = useState(2);

  const activeDraft = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const updateActiveDraft = (
    updater: Partial<PurchaseDraft> | ((prev: PurchaseDraft) => Partial<PurchaseDraft>)
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

  const supplierId = activeDraft.supplierId;
  const phone = activeDraft.phone;
  const billNumber = activeDraft.billNumber;
  const billDate = activeDraft.billDate;
  const paymentType = activeDraft.paymentType;
  const roundOff = activeDraft.roundOff;
  const roundOffAmount = activeDraft.roundOffAmount;
  const isReceived = activeDraft.isReceived;
  const receivedAmount = activeDraft.receivedAmount;
  const items = activeDraft.items;

  const setSupplierId = (val: string) => updateActiveDraft({ supplierId: val });
  const setPhone = (val: string) => updateActiveDraft({ phone: val });
  const setBillNumber = (val: string) => updateActiveDraft({ billNumber: val });
  const setBillDate = (val: string) => updateActiveDraft({ billDate: val });
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
    const newDraft = createInitialPurchaseDraft(tabCounter);
    setTabCounter((prev) => prev + 1);
    setTabs((prev) => [...prev, newDraft]);
    setActiveTabId(newDraft.id);
  };

  const handleCloseTab = (tabIdToClose: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) {
      const reset = createInitialPurchaseDraft(1);
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

  // Support pre-filling deficit product & quantity from URL query params (e.g. from Low Stock Reorder or Warehouse Dashboard Negative Stock alert)
  const paramVariationId = searchParams.get("variation_id");
  const paramProductId = searchParams.get("product_id");
  const paramProductName = searchParams.get("product_name") || searchParams.get("search");
  const paramQty = searchParams.get("qty");

  useEffect(() => {
    if (!editId && (paramVariationId || paramProductId || paramProductName) && products && products.length > 0) {
      const foundProduct = products.find((p) => {
        if (paramVariationId && p.product_variations?.some((v: any) => v.id === paramVariationId)) return true;
        if (paramProductId && p.id === paramProductId) return true;
        if (paramProductName && p.name.toLowerCase().includes(paramProductName.toLowerCase())) return true;
        return false;
      });

      if (foundProduct) {
        const foundVariation =
          (paramVariationId
            ? foundProduct.product_variations?.find((v: any) => v.id === paramVariationId)
            : foundProduct.product_variations?.[0]) || foundProduct.product_variations?.[0];

        const targetVariationId = foundVariation?.id || foundProduct.id;
        const costPrice = Number(
          foundVariation?.cost_price ||
            foundProduct.original_price ||
            foundProduct.price ||
            0
        );
        const desiredQty = Math.max(1, Number(paramQty) || 10);

        setItems([
          {
            id: Date.now(),
            variation_id: targetVariationId,
            qty: desiredQty,
            uom: foundProduct.base_uom_id || "NONE",
            price: costPrice,
            discountPct: 0,
            discountAmt: 0,
            taxPct: 0,
            taxAmt: 0,
            amount: costPrice * desiredQty,
          },
          {
            id: Date.now() + 1,
            variation_id: "",
            qty: 0,
            uom: "NONE",
            price: 0,
            discountPct: 0,
            discountAmt: 0,
            taxPct: 0,
            taxAmt: 0,
            amount: 0,
          },
        ]);

        toast({
          title: "Product Pre-Selected for Purchase",
          description: `Ready to restock ${foundProduct.name} (${desiredQty} units). Please select a supplier and review price.`,
        });
      }
    }
  }, [editId, paramVariationId, paramProductId, paramProductName, paramQty, products]);


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
            status: (isReceived && receivedAmount >= totalAmount) ? "Paid" : "Pending",
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
        if (tabs.length > 1) {
          const remaining = tabs.filter((t) => t.id !== activeDraft.id);
          setTabs(remaining);
          setActiveTabId(remaining[0].id);
        } else {
          navigate("/admin/purchase-orders");
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

  return (
    <div className="space-y-4 max-w-[1200px] mx-auto pb-20">
      {/* Vyapar Desktop Tab Bar */}
      <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl px-3.5 py-2 flex items-center justify-between shadow-xs">
        {/* Left: Tab List + Plus Button */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5 hide-scrollbar">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const supplierName = suppliers?.find((s) => s.id === tab.supplierId)?.name;
            const label = `Purchase #${tab.tabNumber}${supplierName ? ` (${supplierName})` : ""}`;

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
            title="New Purchase (Add Tab)"
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
            onClick={() => navigate("/admin/purchase-orders")}
            className="p-1.5 rounded-lg hover:text-red-600 hover:bg-slate-200/80 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

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

          <div className="space-y-4 md:col-span-3">
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
