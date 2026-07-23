import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export { useCategories, useActiveCategories } from "./useCategories";

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
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error || !data) return [];
      return (data as DbOrder[]).filter((o: any) => !o.is_hidden);
    },
  });

export const useCustomerOrders = (email?: string) =>
  useQuery({
    queryKey: ["orders", email],
    queryFn: async () => {
      const { data: ordersData, error: ordersErr } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!ordersErr && Array.isArray(ordersData) && ordersData.length > 0) {
        if (email) {
          return ordersData.filter(
            (o: any) =>
              (o.customer_email === email || o.email === email) &&
              !o.is_hidden_by_dealer,
          );
        }
        return ordersData.filter((o: any) => !o.is_hidden_by_dealer);
      }

      // Fallback: Check sales_orders table
      const { data: salesData, error: salesErr } = await supabase
        .from("sales_orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (!salesErr && Array.isArray(salesData)) {
        return salesData;
      }

      return [];
    },
  });

export const useAddOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (order: DbOrderInsert) => {
      const { data, error } = await supabase
        .from("orders")
        .insert(order)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ is_hidden: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

export const useDealerDeleteOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("orders")
        .update({ is_hidden_by_dealer: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
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
