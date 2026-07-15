import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StockService } from "../../application/services/stock.service";
import { StockTransferDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useStock = (warehouseId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const balancesQuery = useQuery({
    queryKey: ["stock-balances", warehouseId],
    queryFn: () =>
      warehouseId
        ? StockService.getBalancesByWarehouse(warehouseId)
        : Promise.resolve([]),
    enabled: !!warehouseId,
  });

  const transferMutation = useMutation({
    mutationFn: (data: StockTransferDTO) => StockService.transferStock(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["stock-balances", variables.from_warehouse_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["stock-balances", variables.to_warehouse_id],
      });
      toast({
        title: "Success",
        description: "Stock transferred successfully.",
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
    balances: balancesQuery.data,
    isLoadingBalances: balancesQuery.isLoading,
    transferStock: transferMutation.mutateAsync,
    isTransferring: transferMutation.isPending,
  };
};
