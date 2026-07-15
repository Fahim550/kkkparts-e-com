import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
}

export const useContactMessages = () => {
  return useQuery({
    queryKey: ["contact-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContactMessage[];
    },
  });
};

export const useAddContactMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (
      message: Omit<ContactMessage, "id" | "created_at" | "status">,
    ) => {
      const { data, error } = await supabase
        .from("contact_messages")
        .insert([{ ...message, status: "unread" }])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
};

export const useUpdateContactMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<ContactMessage> & { id: string }) => {
      const { data, error } = await supabase
        .from("contact_messages")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
};

export const useDeleteContactMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("contact_messages")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["contact-messages"] }),
  });
};
