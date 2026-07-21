import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchaseReceiptService, ReceiptItemPayload } from "../../application/services/receipt.service";
import { CreatePurchaseReceiptDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useGoodsReceive = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["purchase-receipts"],
    queryFn: PurchaseReceiptService.getAllReceipts,
  });

  const receiveMutation = useMutation({
    mutationFn: (data: { receipt: CreatePurchaseReceiptDTO; items: ReceiptItemPayload[] }) => 
      PurchaseReceiptService.receiveGoods(data.receipt, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-receipts"] });
      // Invalidate stock and fifo related queries as well
      queryClient.invalidateQueries({ queryKey: ["stock-balances"] });
      toast({ title: "Success", description: "Goods received and stock updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    receipts: query.data,
    isLoading: query.isLoading,
    receiveGoods: receiveMutation.mutateAsync,
    isReceiving: receiveMutation.isPending,
  };
};

export const useGoodsReceipt = (id: string) => {
  return useQuery({
    queryKey: ["purchase-receipts", id],
    queryFn: () => PurchaseReceiptService.getReceiptById(id),
    enabled: !!id,
  });
};
