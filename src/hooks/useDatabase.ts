import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

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
        .select("*, categories(name), brands(name), product_variations(*)");

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
        .select("*, categories(name), brands(name)")
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
        .select("*, categories(name), brands(name)")
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
        .select("*")
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
        combined = [...salesData.filter((o: any) => !o.is_hidden).map((o: any) => ({ ...o, type: 'sales_order' }))];
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

      if (error) {
        // If select().single() fails due to RLS SELECT restrictions, try insert without select
        const { error: insertOnlyErr } = await supabase
          .from("sales_orders")
          .insert(salesOrderPayload);
        if (insertOnlyErr) throw insertOnlyErr;
        return { id: salesOrderPayload.so_number, ...salesOrderPayload };
      }
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
    },
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("sales_orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
    },
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales_orders")
        .update({ is_hidden: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
    },
  });
};

export const useDealerDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("sales_orders")
        .update({ is_hidden_by_dealer: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["orders"] });
      qc.invalidateQueries({ queryKey: ["sales_orders"] });
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
