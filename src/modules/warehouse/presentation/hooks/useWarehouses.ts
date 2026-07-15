import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WarehouseService } from "../../application/services/warehouse.service";
import { CreateWarehouseDTO, UpdateWarehouseDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useWarehouses = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["warehouses"],
    queryFn: WarehouseService.getAllWarehouses,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWarehouseDTO) =>
      WarehouseService.createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateWarehouseDTO) =>
      WarehouseService.updateWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => WarehouseService.deleteWarehouse(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      toast({
        title: "Success",
        description: "Warehouse deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    warehouses: query.data,
    isLoading: query.isLoading,
    createWarehouse: createMutation.mutateAsync,
    updateWarehouse: updateMutation.mutateAsync,
    deleteWarehouse: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};
