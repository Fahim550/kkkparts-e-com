import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountingEngine } from "@/modules/accounting/application/services/accounting.engine";

export { useActiveCategories, useCategories } from "./useCategories";

export type DbProduct = Database["public"]["Tables"]["products"]["Row"] & { product_variations?: any[] };
export type DbProductInsert =
  Database["public"]["Tables"]["products"]["Insert"];
export type DbOrder = Database["public"]["Tables"]["orders"]["Row"];
export type DbOrderInsert = Database["public"]["Tables"]["orders"]["Insert"];
export type DbCoupon = Database["public"]["Tables"]["coupons"]["Row"];
export type DbCouponInsert = Database["public"]["Tables"]["coupons"]["Insert"];
export type DbBanner = Database["public"]["Tables"]["banners"]["Row"];
export type DbBannerInsert = Database["public"]["Tables"]["banners"]["Insert"];
export type DbSettings = Database["public"]["Tables"]["site_settings"]["Row"];

// ==================== PRODUCTS ====================
export const useProducts = () =>
  useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name), product_variations(*, stock_balances(*, warehouse_bins(*)))");

      if (error) {
        const { data: fallbackData } = await supabase
          .from("products")
          .select("*");
        return fallbackData || [];
      }
      return data || [];
    },
  });

export const useActiveProducts = () =>
  useQuery({
    queryKey: ["products", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name), product_variations(*, stock_balances(*, warehouse_bins(*)))")
        .eq("is_active", true);

      if (error) {
        const { data: fallbackData } = await supabase
          .from("products")
          .select("*")
          .eq("is_active", true);
        return fallbackData || [];
      }
      return data || [];
    },
  });

export const useProduct = (id: string) =>
  useQuery({
    queryKey: ["products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, categories(name), brands(name), product_variations(*, stock_balances(*, warehouse_bins(*)))")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data as DbProduct;
    },
    enabled: !!id,
  });

export const useAddProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: DbProductInsert) => {
      const { data, error } = await supabase
        .from("products")
        .insert(product)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DbProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from("products")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
    },
  });
};

// ==================== ORDERS ====================
export const useOrders = () =>
  useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data: salesData, error: salesError } = await supabase
        .from("sales_orders")
        .select(`
          *,
          customers(name, contact_email, contact_phone, customer_group),
          sales_order_items(
            *,
            product_variations(sku, products(name))
          )
        `)
        .order("created_at", { ascending: false });

      const { data: posData, error: posError } = await supabase
        .from("pos_receipts")
        .select(`
          *,
          customers(name, contact_email, contact_phone),
          pos_receipt_items(
            *,
            product_variations(sku, products(name))
          )
        `);

      let combined: any[] = [];
      
      if (!salesError && salesData) {
        const mappedSales = salesData.map((o: any) => ({
          id: o.id,
          order_number: o.so_number,
          status: o.status.toLowerCase(),
          created_at: o.order_date || o.created_at,
          customer_name: o.customers?.name || "Customer",
          customer_email: o.customers?.contact_email || "",
          customer_phone: o.customers?.contact_phone || "",
          customer_group: o.customers?.customer_group || "Customer",
          shipping_address: "",
          total: o.total_amount,
          is_hidden: false,
          type: 'sales_order',
          items: o.sales_order_items?.map((i: any) => ({
            productName: i.product_variations?.products?.name || "Item",
            size: "",
            color: "",
            quantity: i.quantity_ordered || i.quantity || 1,
            price: i.unit_price
          })) || []
        }));
        combined = [...mappedSales];
      }

      if (!posError && posData) {
        const mappedPos = posData.map((r: any) => ({
          id: r.id,
          order_number: r.receipt_number,
          status: r.status.toLowerCase(), // "paid", "partial", "unpaid"
          created_at: r.transaction_date,
          customer_name: r.walk_in_customer_name || r.customers?.name || "Walk-in Customer",
          customer_email: r.customers?.contact_email || "",
          customer_phone: r.walk_in_customer_phone || r.customers?.contact_phone || "",
          shipping_address: "POS In-store",
          total: r.total_amount,
          is_hidden: false,
          type: 'pos_receipt',
          items: r.pos_receipt_items?.map((i: any) => ({
            productName: i.product_variations?.products?.name || "Item",
            size: "",
            color: "",
            quantity: i.quantity,
            price: i.unit_price
          })) || []
        }));
        combined = [...combined, ...mappedPos];
      }

      return combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
  });

export const useCustomerOrders = (email?: string) =>
  useQuery({
    queryKey: ["orders", email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && Array.isArray(data)) {
        if (email) {
          return data.filter(
            (o: any) =>
              (o.customer_email === email || o.email === email) &&
              !o.is_hidden_by_dealer,
          );
        }
        return data.filter((o: any) => !o.is_hidden_by_dealer);
      }

      return [];
    },
  });

export const useAddOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: DbOrderInsert) => {
      // 1. Try inserting into 'orders' table first (if table exists)
      const { data: orderData, error: orderErr } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();

      if (!orderErr && orderData) return orderData;

      // 2. If 'orders' table does not exist, insert into 'sales_orders' using valid schema columns
      // Resolve a valid customer_id from 'customers' table to satisfy foreign key constraint
      let validCustomerId = (order as any).customer_id;
      if (!validCustomerId) {
        try {
          const { data: existingCust } = await supabase
            .from("customers")
            .select("id")
            .limit(1);

          if (existingCust && existingCust.length > 0) {
            validCustomerId = existingCust[0].id;
          } else {
            const { data: newCust } = await supabase
              .from("customers")
              .insert({
                name: (order as any).customer_name || "Wholesale Dealer",
                contact_email: (order as any).customer_email || "dealer@example.com",
              } as any)
              .select("id")
              .single();
            if (newCust?.id) validCustomerId = newCust.id;
          }
        } catch (cErr) {
          console.warn("Could not resolve customer_id:", cErr);
        }
      }

      const salesOrderPayload = {
        so_number: (order as any).order_number || `SO-${Date.now()}`,
        order_date: new Date().toISOString().split("T")[0],
        total_amount: Number((order as any).total || 0),
        status: (order as any).status || "pending",
        customer_id: validCustomerId || "00000000-0000-0000-0000-000000000000",
      };

      const { data, error } = await supabase
        .from("sales_orders")
        .insert(salesOrderPayload)
        .select()
        .single();

      let salesOrderData = data;

      if (error) {
        // If select().single() fails due to RLS SELECT restrictions, try insert without select
        const { error: insertOnlyErr } = await supabase
          .from("sales_orders")
          .insert(salesOrderPayload);
        if (insertOnlyErr) throw insertOnlyErr;
        
        // Fetch the inserted order to get its UUID
        const { data: fetchedData } = await supabase
          .from("sales_orders")
          .select("*")
          .eq("so_number", salesOrderPayload.so_number)
          .maybeSingle();
          
        salesOrderData = fetchedData;
      }
      
      const insertedOrderId = salesOrderData?.id; 

      // Insert items if they exist
      const orderItems = (order as any).items || [];
      if (orderItems.length > 0 && insertedOrderId) {
        // We need a uom_id since it's required by the schema
        const { data: uomData } = await supabase.from("units_of_measure").select("id").limit(1).maybeSingle();
        const fallbackUomId = uomData?.id || "00000000-0000-0000-0000-000000000000";

        const itemsToInsert = orderItems.map((item: any) => ({
          sales_order_id: insertedOrderId,
          variation_id: item.product_variation_id,
          quantity_ordered: item.quantity,
          quantity_delivered: item.quantity,
          unit_price: Number(item.unit_price),
          total_price: Number(item.total_price),
          discount_amount: 0,
          uom_id: item.uom_id || fallbackUomId,
        }));
        
        const { error: itemsError } = await supabase
          .from("sales_order_items")
          .insert(itemsToInsert);
          
        if (itemsError) {
          console.error("Failed to insert sales order items:", itemsError);
          throw new Error("Failed to insert items: " + itemsError.message);
        }

        // Inventory Integration: Deduct stock from selected warehouse
        const warehouseId = (order as any).warehouse_id;
        if (warehouseId) {
          const { InventoryEngine } = await import("@/modules/inventory/application/services/inventory.engine");
          for (const item of orderItems) {
            try {
              await InventoryEngine.processMovement({
                variation_id: item.product_variation_id,
                warehouse_id: warehouseId,
                uom_id: item.uom_id || fallbackUomId,
                quantity: -Number(item.quantity),
                reference_type: "sales_order",
                reference_id: insertedOrderId,
                unit_cost: 0,
              });
            } catch (invError: any) {
              console.error("Failed to process inventory movement for sales order item:", invError);
              throw invError;
            }
          }
        }
      }

      // Accounting Integration
      try {
        let receivableAccountId = undefined;
        if (validCustomerId) {
          const { data: customerData } = await supabase
            .from("customers")
            .select("receivable_account_id")
            .eq("id", validCustomerId)
            .single();
          if (customerData?.receivable_account_id) {
            receivableAccountId = customerData.receivable_account_id;
          }
        }

        const paidAmount = Number((order as any).paid_amount || 0);
        await AccountingEngine.postSalesOrder(
          insertedOrderId,
          salesOrderPayload.so_number,
          salesOrderPayload.total_amount,
          paidAmount,
          receivableAccountId
        );
      } catch (accError) {
        console.error("Failed to post sales order to accounting:", accError);
      }

      return salesOrderData || { id: salesOrderPayload.so_number, ...salesOrderPayload };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
      qc.invalidateQueries({ queryKey: ["stock_balances"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
      qc.invalidateQueries({ queryKey: ["fifo_ledgers"] });
      qc.invalidateQueries({ queryKey: ["stock_ledgers"] });
    },
  });
};

export const reverseOrderSideEffects = async (orderId: string) => {
  // 1. Reverse Inventory Stock: Restore products back into the warehouse
  try {
    const { data: previousLedgers } = await supabase
      .from("stock_ledgers")
      .select("*")
      .eq("reference_type", "sales_order")
      .eq("reference_id", orderId);

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

      // Restore FIFO cost layers if any were consumed
      const { data: cogsEntries } = await supabase
        .from("cogs_entries")
        .select("*")
        .eq("outbound_reference_type", "sales_order")
        .eq("outbound_reference_id", orderId);

      if (cogsEntries && cogsEntries.length > 0) {
        for (const cogs of cogsEntries) {
          const { data: layer } = await supabase
            .from("fifo_ledgers")
            .select("quantity_remaining")
            .eq("id", cogs.fifo_ledger_id)
            .single();

          if (layer) {
            await supabase
              .from("fifo_ledgers")
              .update({
                quantity_remaining: Number(layer.quantity_remaining) + Number(cogs.quantity_deducted),
              })
              .eq("id", cogs.fifo_ledger_id);
          }
        }
        await supabase
          .from("cogs_entries")
          .delete()
          .eq("outbound_reference_type", "sales_order")
          .eq("outbound_reference_id", orderId);
      }

      // Delete the outbound stock ledger records
      await supabase
        .from("stock_ledgers")
        .delete()
        .eq("reference_type", "sales_order")
        .eq("reference_id", orderId);
    }
  } catch (invRevError) {
    console.error("Failed to restore inventory for sales order:", invRevError);
  }

  // 2. Reverse Accounting: Cancel Customer Due and Sales Revenue
  try {
    const { AccountingEngine } = await import("@/modules/accounting/application/services/accounting.engine");
    await AccountingEngine.reverseSalesOrder(orderId);
  } catch (accRevError) {
    console.error("Failed to reverse accounting for sales order:", accRevError);
  }
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      // If order is being cancelled, reverse stock and customer due
      if (status.toLowerCase() === "cancelled") {
        await reverseOrderSideEffects(id);
      }

      const { error } = await supabase
        .from("sales_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
      qc.invalidateQueries({ queryKey: ["stock_balances"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
      qc.invalidateQueries({ queryKey: ["stock_ledgers"] });
      qc.invalidateQueries({ queryKey: ["fifo_ledgers"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-history"] });
      qc.invalidateQueries({ queryKey: ["customer-dues"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
    },
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Revert Inventory stock and Accounting entries
      await reverseOrderSideEffects(id);

      // 2. Clean up order items first to prevent foreign key constraint violations
      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .delete()
        .eq("sales_order_id", id);
        
      if (itemsError) throw itemsError;

      // 3. Delete the sales order
      const { error } = await supabase
        .from("sales_orders")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
      qc.invalidateQueries({ queryKey: ["stock_balances"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
      qc.invalidateQueries({ queryKey: ["stock_ledgers"] });
      qc.invalidateQueries({ queryKey: ["fifo_ledgers"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-history"] });
      qc.invalidateQueries({ queryKey: ["customer-dues"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
    },
  });
};

export const useDealerDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // 1. Revert Inventory stock and Accounting entries
      await reverseOrderSideEffects(id);

      // 2. Clean up order items first to prevent foreign key constraint violations
      const { error: itemsError } = await supabase
        .from("sales_order_items")
        .delete()
        .eq("sales_order_id", id);
        
      if (itemsError) throw itemsError;

      // 3. Delete the sales order
      const { error } = await supabase
        .from("sales_orders")
        .delete()
        .eq("id", id);
        
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products", "active"] });
      qc.invalidateQueries({ queryKey: ["stock_balances"] });
      qc.invalidateQueries({ queryKey: ["stock-balances"] });
      qc.invalidateQueries({ queryKey: ["stock_ledgers"] });
      qc.invalidateQueries({ queryKey: ["fifo_ledgers"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer-history"] });
      qc.invalidateQueries({ queryKey: ["customer-dues"] });
      qc.invalidateQueries({ queryKey: ["receivables"] });
    },
  });
};
export const useCoupons = () =>
  useQuery({
    queryKey: ["coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbCoupon[];
    },
  });

export const useValidateCoupon = (code: string) =>
  useQuery({
    queryKey: ["coupons", code],
    queryFn: async () => {
      if (!code) return null;
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();
      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      return data as DbCoupon;
    },
    enabled: !!code,
  });

export const useAddCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (coupon: DbCouponInsert) => {
      const { data, error } = await supabase
        .from("coupons")
        .insert(coupon)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useUpdateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DbCoupon> & { id: string }) => {
      const { error } = await supabase
        .from("coupons")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

export const useDeleteCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["coupons"] }),
  });
};

// ==================== BANNERS ====================
export const useBanners = () =>
  useQuery({
    queryKey: ["banners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Error fetching banners:", error);
        return [];
      }
      return data as DbBanner[];
    },
  });

export const useActiveBanners = () =>
  useQuery({
    queryKey: ["banners", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) {
        console.warn("Error fetching active banners:", error);
        return [];
      }
      return data as DbBanner[];
    },
  });

export const useAddBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (banner: DbBannerInsert) => {
      const { data, error } = await supabase
        .from("banners")
        .insert(banner)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useUpdateBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DbBanner> & { id: string }) => {
      const { error } = await supabase
        .from("banners")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

export const useDeleteBanner = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["banners"] }),
  });
};

// ==================== SETTINGS ====================
export const useSettings = () =>
  useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*")
        .limit(1)
        .single();
      if (error) throw error;
      return data as DbSettings;
    },
  });

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (updates: Partial<DbSettings>) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .limit(1)
        .single();
      if (!existing) throw new Error("No settings row");
      const { error } = await supabase
        .from("site_settings")
        .update(updates)
        .eq("id", existing.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};
