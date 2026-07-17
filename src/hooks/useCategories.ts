import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DbCategory {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  description: string | null;
  image_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface DbCategoryInsert {
  name: string;
  slug: string;
  parent_id?: string | null;
  description?: string | null;
  image_url?: string | null;
  is_active?: boolean | null;
  sort_order?: number | null;
}

export const useCategories = () =>
  useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true });
      if (error) {
        console.warn("Error fetching categories:", error);
        return [];
      }
      return data as DbCategory[];
    },
  });

export const useActiveCategories = () =>
  useQuery({
    queryKey: ["categories", "active"],
    queryFn: async () => {
      // include rows where is_active is true OR is_active is null (legacy rows)
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .or("is_active.eq.true,is_active.is.null")
        .order("name", { ascending: true });
      if (error) {
        console.warn("Error fetching active categories:", error);
        return [];
      }
      return data as DbCategory[];
    },
  });

export const useAddCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (category: DbCategoryInsert) => {
      const { data, error } = await supabase
        .from("categories")
        .insert(category)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories", "active"] });
    },
  });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<DbCategory> & { id: string }) => {
      const { data, error } = await supabase
        .from("categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories", "active"] });
    },
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("categories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["categories", "active"] });
    },
  });
};
