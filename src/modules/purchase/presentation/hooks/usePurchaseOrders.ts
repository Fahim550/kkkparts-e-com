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
    mutationFn: (data: { po: CreatePurchaseOrderDTO; items: CreatePurchaseOrderItemDTO[] }) =>
      PurchaseOrderService.createOrder(data.po, data.items),
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

  return {
    orders: query.data,
    isLoading: query.isLoading,
    createOrder: createMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};

export const usePurchaseOrder = (id: string) => {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => PurchaseOrderService.getOrderById(id),
    enabled: !!id,
  });
};
