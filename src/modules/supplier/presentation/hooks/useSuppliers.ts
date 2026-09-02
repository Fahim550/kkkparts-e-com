import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SupplierService } from "../../application/services/supplier.service";
import { CreateSupplierDTO, UpdateSupplierDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useDebounce } from "@/hooks/use-debounce"; // Assuming this exists, I will use a simple state if not. Wait, I will just use standard react query without debounce if use-debounce isn't there, or I can provide it. Let's just use query param directly.

export const useSuppliers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const query = useQuery({
    queryKey: ["suppliers", searchQuery],
    queryFn: () => SupplierService.searchSuppliers(searchQuery),
    staleTime: 1000 * 60 * 5,
  });

  const accountsQuery = useQuery({
    queryKey: ["payable-accounts"],
    queryFn: SupplierService.getPayableAccounts,
    staleTime: 1000 * 60 * 10,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateSupplierDTO) => SupplierService.createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Success", description: "Supplier created successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateSupplierDTO) => SupplierService.updateSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Success", description: "Supplier updated successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => SupplierService.deleteSupplier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      toast({ title: "Success", description: "Supplier deleted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    suppliers: query.data,
    isLoading: query.isLoading,
    searchQuery,
    setSearchQuery,
    payableAccounts: accountsQuery.data,
    isLoadingAccounts: accountsQuery.isLoading,
    createSupplier: createMutation.mutateAsync,
    updateSupplier: updateMutation.mutateAsync,
    deleteSupplier: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
};

export const useSupplierHistory = (supplierId: string) => {
  const historyQuery = useQuery({
    queryKey: ["supplier-history", supplierId],
    queryFn: () => SupplierService.getSupplierHistory(supplierId),
    enabled: !!supplierId,
  });

  return {
    history: historyQuery.data,
    isLoadingHistory: historyQuery.isLoading,
  };
};

export const useSupplierDues = () => {
  return useQuery({
    queryKey: ["supplier-dues"],
    queryFn: () => SupplierService.getAllSuppliersDueMap(),
    staleTime: 1000 * 30,
  });
};


