import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useRef, useCallback } from "react";

export interface CheckoutLead {
  id: string;
  session_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  shipping_address: string;
  area: string;
  notes: string;
  cart_items: any[];
  cart_total: number;
  status: string;
  contacted: boolean;
  created_at: string;
  updated_at: string;
}

// Generate a session ID per checkout visit
const getSessionId = () => {
  let sid = sessionStorage.getItem("checkout_session_id");
  if (!sid) {
    sid = `ses_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("checkout_session_id", sid);
  }
  return sid;
};

export const clearCheckoutSession = () => {
  sessionStorage.removeItem("checkout_session_id");
};

// ==================== AUTO-SAVE HOOK ====================
export const useCheckoutLeadAutoSave = () => {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const savedRef = useRef(false);

  const save = useCallback(
    (data: {
      name: string;
      phone: string;
      email: string;
      address: string;
      area: string;
      notes: string;
      cartItems: any[];
      cartTotal: number;
    }) => {
      // Only trigger if phone has at least 8 chars
      if (data.phone.replace(/\D/g, "").length < 8) return;

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        const sessionId = getSessionId();
        const payload = {
          session_id: sessionId,
          customer_name: data.name,
          customer_phone: data.phone,
          customer_email: data.email,
          shipping_address: data.address,
          area: data.area,
          notes: data.notes,
          cart_items: data.cartItems,
          cart_total: data.cartTotal,
          status: "pending_checkout",
        };

        try {
          if (!savedRef.current) {
            // Check if a lead already exists for this session
            const { data: existing } = await supabase
              .from("checkout_leads")
              .select("id")
              .eq("session_id", sessionId)
              .maybeSingle();

            if (existing) {
              await supabase
                .from("checkout_leads")
                .update(payload)
                .eq("session_id", sessionId);
            } else {
              const { error } = await supabase
                .from("checkout_leads")
                .insert(payload);
              if (error) console.error("Lead insert error:", error);
            }
            savedRef.current = true;
          } else {
            await supabase
              .from("checkout_leads")
              .update(payload)
              .eq("session_id", sessionId);
          }
        } catch (err) {
          console.error("Lead save error:", err);
        }
      }, 1500);
    },
    [],
  );

  const markCompleted = useCallback(async () => {
    const sessionId = getSessionId();
    try {
      await supabase
        .from("checkout_leads")
        .update({ status: "completed" })
        .eq("session_id", sessionId);
      clearCheckoutSession();
    } catch {
      // Silent
    }
  }, []);

  return { save, markCompleted };
};

// ==================== ADMIN HOOKS ====================
export const useCheckoutLeads = () =>
  useQuery({
    queryKey: ["checkout_leads"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checkout_leads")
        .select("*")
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as CheckoutLead[];
    },
  });

export const useUpdateCheckoutLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<CheckoutLead> & { id: string }) => {
      const { error } = await supabase
        .from("checkout_leads")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkout_leads"] }),
  });
};

export const useDeleteCheckoutLead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("checkout_leads")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["checkout_leads"] }),
  });
};
