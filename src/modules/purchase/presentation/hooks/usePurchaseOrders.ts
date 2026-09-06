import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchaseOrderService } from "../../application/services/purchase-order.service";
import { PurchaseOrderFilters } from "../../infrastructure/repositories/purchase-order.repository";
import { CreatePurchaseOrderDTO, CreatePurchaseOrderItemDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const usePurchaseOrders = (filters?: PurchaseOrderFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["purchase-orders", filters ?? {}],
    queryFn: () => PurchaseOrderService.getAllOrders(filters),
  });

  const createMutation = useMutation({
    mutationFn: async (data: { po: CreatePurchaseOrderDTO & { paid_amount?: number }; items: CreatePurchaseOrderItemDTO[] }) => {
      const paidAmount = Number(data.po.paid_amount || 0);
      const { paid_amount, ...poData } = data.po;
      
      const createdPo = await PurchaseOrderService.createOrder(poData as any, data.items);
      
      try {
        const { AccountingEngine } = await import("../../../accounting/application/services/accounting.engine");
        const { supabase } = await import("@/integrations/supabase/client");
        
        let payableAccountId = undefined;
        if (createdPo.supplier_id) {
          const { data: suppData } = await supabase
            .from("suppliers")
            .select("payable_account_id")
            .eq("id", createdPo.supplier_id)
            .single();
          if (suppData?.payable_account_id) {
            payableAccountId = suppData.payable_account_id;
          }
        }

        await AccountingEngine.postPurchaseOrder(
          createdPo.id,
          createdPo.po_number,
          createdPo.total_amount,
          paidAmount,
          payableAccountId
        );
      } catch (accError) {
        console.error("Failed to post purchase order to accounting:", accError);
      }
      
      return createdPo;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Success", description: "Purchase Order created successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (data: { id: string; status: string }) =>
      PurchaseOrderService.updateOrderStatus(data.id, data.status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      toast({ title: "Success", description: "Status updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (data: { id: string; type?: string }) =>
      PurchaseOrderService.deleteOrder(data.id, data.type),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-orders"] });
      queryClient.invalidateQueries({ queryKey: ["purchase-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", "active"] });
      queryClient.invalidateQueries({ queryKey: ["stock_balances"] });
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      queryClient.invalidateQueries({ queryKey: ["stock_ledgers"] });
      queryClient.invalidateQueries({ queryKey: ["fifo_ledgers"] });
      queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-history"] });
      queryClient.invalidateQueries({ queryKey: ["supplier-dues"] });
      toast({ title: "Deleted", description: "Purchase order deleted and reversed successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete purchase order." });
    },
  });

  return {
    orders: query.data,
    isLoading: query.isLoading,
    createOrder: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteOrder: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => PurchaseOrderService.getOrderById(id),
    enabled: !!id,
  });
};
