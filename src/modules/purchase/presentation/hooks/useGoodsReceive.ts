import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchaseReceiptService, ReceiptItemPayload } from "../../application/services/receipt.service";
import { PurchaseReceiptFilters } from "../../infrastructure/repositories/purchase-receipt.repository";
import { CreatePurchaseReceiptDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";
import { AccountingEngine } from "../../../accounting/application/services/accounting.engine";
import { JournalRepository } from "../../../accounting/infrastructure/repositories/journal.repository";

export const useGoodsReceive = (filters?: PurchaseReceiptFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["purchase-receipts", filters ?? {}],
    queryFn: () => PurchaseReceiptService.getAllReceipts(filters),
  });

  const receiveMutation = useMutation({
    mutationFn: (data: { receipt: CreatePurchaseReceiptDTO; items: ReceiptItemPayload[] }) =>
      PurchaseReceiptService.receiveGoods(data.receipt, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-receipts"] });
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

export const usePostReceiptToJournal = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: { receiptId: string; totalAmount: number; receiptNumber: string; customPayableAccountId?: string }) => {
      return AccountingEngine.postPurchaseReceipt(
        data.receiptId,
        data.totalAmount,
        data.receiptNumber,
        data.customPayableAccountId
      );
    },
    onSuccess: (je) => {
      queryClient.invalidateQueries({ queryKey: ["purchase-receipts"] });
      queryClient.invalidateQueries({ queryKey: ["receipt-journal"] });
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({
        title: "Journal Entry Posted",
        description: `Journal Entry ${je.entry_number} was created successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Journal Posting Error",
        description: error.message || "Failed to post Journal Entry.",
      });
    },
  });
};

export const useReceiptJournalStatus = (receiptId: string) => {
  return useQuery({
    queryKey: ["receipt-journal", receiptId],
    queryFn: () => JournalRepository.getJournalEntryByReference("purchase_receipt", receiptId),
    enabled: !!receiptId,
  });
};

export const useReceiptsJournalMap = (receiptIds: string[]) => {
  return useQuery({
    queryKey: ["receipts-journals", receiptIds],
    queryFn: async () => {
      if (!receiptIds || receiptIds.length === 0) return {};
      const entries = await JournalRepository.getJournalEntriesByReferences("purchase_receipt", receiptIds);
      const map: Record<string, any> = {};
      entries.forEach((e) => {
        if (e.reference_id) {
          map[e.reference_id] = e;
        }
      });
      return map;
    },
    enabled: !!receiptIds && receiptIds.length > 0,
  });
};


