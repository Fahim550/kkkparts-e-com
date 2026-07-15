import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PurchaseInvoiceService } from "../../application/services/invoice.service";
import { CreatePurchaseInvoiceDTO, CreatePurchaseInvoiceItemDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useInvoices = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["purchase-invoices"],
    queryFn: PurchaseInvoiceService.getAllInvoices,
  });

  const createMutation = useMutation({
    mutationFn: (data: { invoice: CreatePurchaseInvoiceDTO; items: CreatePurchaseInvoiceItemDTO[] }) => 
      PurchaseInvoiceService.createInvoice(data.invoice, data.items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchase-invoices"] });
      toast({ title: "Success", description: "Invoice created successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    invoices: query.data,
    isLoading: query.isLoading,
    createInvoice: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
  };
};
