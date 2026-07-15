import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { InventoryRepository } from "../../infrastructure/repositories/inventory.repository";
import { InventoryEngine } from "../../application/services/inventory.engine";
import { useToast } from "@/hooks/use-toast";

export const useInventory = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const ledgersQuery = useQuery({
    queryKey: ["stock-ledgers"],
    queryFn: InventoryRepository.getStockLedgers,
  });

  const fifoQuery = useQuery({
    queryKey: ["fifo-ledgers"],
    queryFn: InventoryRepository.getFifoCostLayers,
  });

  const adjustStockMutation = useMutation({
    mutationFn: (data: { variation_id: string; warehouse_id: string; quantity: number; unit_cost?: number; uom_id: string; reason: string }) => 
      InventoryEngine.adjustStock(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-ledgers"] });
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      queryClient.invalidateQueries({ queryKey: ["fifo-ledgers"] });
      toast({ title: "Success", description: "Stock adjusted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const writeOffDamageMutation = useMutation({
    mutationFn: (data: { variation_id: string; warehouse_id: string; quantity: number; uom_id: string; reason: string }) => 
      InventoryEngine.writeOffDamage(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-ledgers"] });
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      queryClient.invalidateQueries({ queryKey: ["fifo-ledgers"] });
      toast({ title: "Success", description: "Damaged stock written off successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    ledgers: ledgersQuery.data,
    isLoadingLedgers: ledgersQuery.isLoading,
    fifoLayers: fifoQuery.data,
    isLoadingFifo: fifoQuery.isLoading,
    adjustStock: adjustStockMutation.mutateAsync,
    isAdjusting: adjustStockMutation.isPending,
    writeOffDamage: writeOffDamageMutation.mutateAsync,
    isWritingOff: writeOffDamageMutation.isPending,
  };
};
