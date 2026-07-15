import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ProductVariation {
  id: string;
  product_id: string;
  size: string;
  color: string;
  sku: string;
  price: number | null;
  stock: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariationInsert {
  product_id: string;
  size: string;
  color: string;
  sku?: string;
  price?: number | null;
  stock: number;
}

export const useProductVariations = (productId: string) =>
  useQuery({
    queryKey: ["product-variations", productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .eq("product_id", productId)
        .order("size", { ascending: true });
      if (error) throw error;
      return data as ProductVariation[];
    },
    enabled: !!productId,
  });

export const useSaveVariations = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      productId,
      variations,
    }: {
      productId: string;
      variations: Omit<ProductVariationInsert, "product_id">[];
    }) => {
      // Delete existing variations
      await supabase
        .from("product_variations")
        .delete()
        .eq("product_id", productId);
      // Insert new ones
      if (variations.length > 0) {
        const rows = variations.map((v) => ({ ...v, product_id: productId }));
        const { error } = await supabase
          .from("product_variations")
          .insert(rows as any);
        if (error) throw error;
      }
    },
    onSuccess: (_, { productId }) => {
      qc.invalidateQueries({ queryKey: ["product-variations", productId] });
      qc.invalidateQueries({ queryKey: ["product-variations"] });
    },
  });
};

export const useAllVariationsForProducts = (productIds: string[]) =>
  useQuery({
    queryKey: ["product-variations", "bulk", productIds],
    queryFn: async () => {
      if (productIds.length === 0) return [];
      const { data, error } = await supabase
        .from("product_variations")
        .select("*")
        .in("product_id", productIds);
      if (error) throw error;
      return data as ProductVariation[];
    },
    enabled: productIds.length > 0,
  });
