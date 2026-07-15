import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PageContent {
  id: string;
  page_slug: string;
  page_title: string;
  content: string;
  meta_title: string;
  meta_description: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const usePageContent = (slug: string) =>
  useQuery({
    queryKey: ["page-content", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .eq("page_slug", slug)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return data as PageContent | null;
    },
    enabled: !!slug,
  });

export const useAllPageContents = () =>
  useQuery({
    queryKey: ["page-contents"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("page_contents")
        .select("*")
        .order("page_slug");
      if (error) throw error;
      return data as PageContent[];
    },
  });

export const useUpsertPageContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (page: Partial<PageContent> & { page_slug: string }) => {
      const { data: existing } = await supabase
        .from("page_contents")
        .select("id")
        .eq("page_slug", page.page_slug)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("page_contents")
          .update(page)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("page_contents")
          .insert(page as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-contents"] });
      qc.invalidateQueries({ queryKey: ["page-content"] });
    },
  });
};

export const useDeletePageContent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("page_contents")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["page-contents"] });
      qc.invalidateQueries({ queryKey: ["page-content"] });
    },
  });
};
