import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const usePreviousWalkIns = () => {
  return useQuery({
    queryKey: ["previousWalkIns"],
    queryFn: async () => {
      // Fetch recent receipts that have walk-in information
      const { data, error } = await supabase
        .from("pos_receipts")
        .select("walk_in_customer_name, walk_in_customer_phone, walk_in_dealer_name, walk_in_dealer_phone")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;

      const walkIns: { name: string; phone: string; type: "customer" | "dealer" }[] = [];
      const seen = new Set<string>();

      data?.forEach((row) => {
        if (row.walk_in_customer_name) {
          const key = `customer-${row.walk_in_customer_name}`;
          if (!seen.has(key)) {
            seen.add(key);
            walkIns.push({
              name: row.walk_in_customer_name,
              phone: row.walk_in_customer_phone || "",
              type: "customer",
            });
          }
        }
        if (row.walk_in_dealer_name) {
          const key = `dealer-${row.walk_in_dealer_name}`;
          if (!seen.has(key)) {
            seen.add(key);
            walkIns.push({
              name: row.walk_in_dealer_name,
              phone: row.walk_in_dealer_phone || "",
              type: "dealer",
            });
          }
        }
      });

      return walkIns;
    },
    staleTime: 1000 * 60 * 5,
  });
};
