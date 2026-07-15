import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ShippingMethod {
  id: string;
  name: string;
  area_zone: string;
  charge: number;
  estimated_delivery: string;
  description: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export const useShippingMethods = (activeOnly = false) =>
  useQuery({
    queryKey: ["shipping_methods", activeOnly],
    queryFn: async () => {
      let q = (supabase.from("shipping_methods") as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (activeOnly) q = q.eq("is_active", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as ShippingMethod[];
    },
  });

export const useAddShippingMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      method: Omit<ShippingMethod, "id" | "created_at" | "updated_at">,
    ) => {
      const { error } = await (supabase.from("shipping_methods") as any).insert(
        method,
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipping_methods"] }),
  });
};

export const useUpdateShippingMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ShippingMethod> & { id: string }) => {
      const { error } = await (supabase.from("shipping_methods") as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipping_methods"] }),
  });
};

export const useDeleteShippingMethod = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("shipping_methods") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["shipping_methods"] }),
  });
};
