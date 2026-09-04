import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CustomerService } from "../../application/services/customer.service";
import { CreateCustomerDTO, UpdateCustomerDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useCustomers = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["customers"],
    queryFn: CustomerService.getAllCustomers,
    staleTime: 1000 * 60 * 5,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCustomerDTO) => CustomerService.createCustomer(data),
    onSuccess: async (newCustomer) => {
      // Optimistically update the cache to show the customer immediately
      queryClient.setQueryData(["customers"], (old: any) => {
        if (!old) return [newCustomer];
        return [...old, newCustomer].sort((a, b) => a.name.localeCompare(b.name));
      });
      toast({ title: "Success", description: "Customer created successfully." });
      // Ensure background refetch finishes
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCustomerDTO }) =>
      CustomerService.updateCustomer(id, data),
    onSuccess: async (updatedCustomer) => {
      queryClient.setQueryData(["customers"], (old: any) => {
        if (!old) return [updatedCustomer];
        return old.map((c: any) => c.id === updatedCustomer.id ? { ...c, ...updatedCustomer } : c);
      });
      toast({ title: "Success", description: "Customer updated successfully." });
      await queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });

  return {
    customers: query.data,
    isLoading: query.isLoading,
    createCustomer: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    updateCustomer: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
};

export const useCustomerHistory = (customerId: string) => {
  const historyQuery = useQuery({
    queryKey: ["customer-history", customerId],
    queryFn: () => CustomerService.getCustomerHistory(customerId),
    enabled: !!customerId,
  });

  const statsQuery = useQuery({
    queryKey: ["customer-stats", customerId],
    queryFn: () => CustomerService.getCustomerDueStats(customerId),
    enabled: !!customerId,
  });

  return {
    history: historyQuery.data,
    isLoadingHistory: historyQuery.isLoading,
    stats: statsQuery.data,
    isLoadingStats: statsQuery.isLoading,
  };
};

export const useCustomerDues = () => {
  return useQuery({
    queryKey: ["customer-dues"],
    queryFn: () => CustomerService.getAllCustomersDueMap(),
    staleTime: 1000 * 30,
  });
};
