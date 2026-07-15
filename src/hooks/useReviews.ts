import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
  id: string;
  reviewer_name: string;
  reviewer_image: string;
  review_text: string;
  rating: number;
  product_id: string | null;
  show_for_all: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useReviews = () =>
  useQuery({
    queryKey: ["reviews"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("reviews") as any)
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
  });

export const useProductReviews = (productId: string) =>
  useQuery({
    queryKey: ["reviews", "product", productId],
    queryFn: async () => {
      const { data, error } = await (supabase.from("reviews") as any)
        .select("*")
        .eq("is_active", true)
        .or(`product_id.eq.${productId},show_for_all.eq.true`)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!productId,
  });

export const useAddReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      review: Omit<Review, "id" | "created_at" | "updated_at">,
    ) => {
      const { error } = await (supabase.from("reviews") as any).insert(review);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
};

export const useUpdateReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<Review> & { id: string }) => {
      const { error } = await (supabase.from("reviews") as any)
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
};

export const useDeleteReview = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from("reviews") as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reviews"] }),
  });
};
