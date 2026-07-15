import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CoaRepository } from "../../infrastructure/repositories/coa.repository";
import { JournalRepository } from "../../infrastructure/repositories/journal.repository";
import { ReportsRepository } from "../../infrastructure/repositories/reports.repository";
import { CreateJournalEntryPayload } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useChartOfAccounts = () => {
  return useQuery({
    queryKey: ["chart-of-accounts"],
    queryFn: CoaRepository.getAllAccounts,
  });
};

export const useJournalEntries = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useMutation({
    mutationFn: (payload: CreateJournalEntryPayload) => JournalRepository.createJournalEntry(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      toast({ title: "Success", description: "Journal Entry posted successfully." });
    },
    onError: (error: any) => {
      toast({ variant: "destructive", title: "Posting Failed", description: error.message });
    }
  });

  return {
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
