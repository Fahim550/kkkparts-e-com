import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoaRepository } from "../../infrastructure/repositories/coa.repository";
import { JournalRepository, JournalEntryFilters } from "../../infrastructure/repositories/journal.repository";
import { ReportsRepository } from "../../infrastructure/repositories/reports.repository";
import { CreateJournalEntryPayload } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useChartOfAccounts = () => {
  return useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: CoaRepository.getAllAccounts,
  });
};

export const useCreateAccount = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: CoaRepository.createAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["payable-accounts"] });
      toast({ title: "Success", description: "Account created successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Error", description: error.message });
    },
  });
};

export const useJournalEntries = (filters?: JournalEntryFilters) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const entriesQuery = useQuery({
    queryKey: ["journal-entries", filters ?? {}],
    queryFn: () => JournalRepository.getAllJournalEntries(filters),
  });


  const createMutation = useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => JournalRepository.createJournalEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["journal-entries"] });
      queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      queryClient.invalidateQueries({ queryKey: ["chart-of-accounts"] });
      toast({ title: "Success", description: "Journal Entry posted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Posting Failed", description: error.message });
    }
  });

  return {
    journalEntries: entriesQuery.data,
    isLoading: entriesQuery.isLoading,
    postJournal: createMutation.mutateAsync,
    isPosting: createMutation.isPending
  };
};

export const useTrialBalance = () => {
  return useQuery({
    queryKey: ["trial-balance"],
    queryFn: ReportsRepository.getTrialBalance,
  });
};
