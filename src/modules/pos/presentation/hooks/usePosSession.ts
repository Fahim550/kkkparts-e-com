import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PosSessionRepository } from "../../infrastructure/repositories/pos-session.repository";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const usePosSession = () => {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const userId = session?.user?.id;
  const { toast } = useToast();

  const registersQuery = useQuery({
    queryKey: ["pos-registers"],
    queryFn: PosSessionRepository.getRegisters,
  });

  const shiftQuery = useQuery({
    queryKey: ["pos-shift", userId],
    queryFn: () => PosSessionRepository.getOpenShift(userId as string),
    enabled: !!userId,
  });

  const openShiftMutation = useMutation({
    mutationFn: ({ registerId, openingCash }: { registerId: string; openingCash: number }) => 
      PosSessionRepository.openShift(registerId, userId as string, openingCash),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-shift", userId] });
      toast({ title: "Shift Opened", description: "You can now process transactions." });
    },
  });

  const closeShiftMutation = useMutation({
    mutationFn: ({ shiftId, closingCashActual }: { shiftId: string; closingCashActual: number }) => 
      PosSessionRepository.closeShift(shiftId, closingCashActual),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-shift", userId] });
      toast({ title: "Shift Closed", description: "Your session has ended." });
    },
  });

  const createRegisterMutation = useMutation({
    mutationFn: ({ name, warehouseId }: { name: string; warehouseId: string }) =>
      PosSessionRepository.createRegister(name, warehouseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pos-registers"] });
      toast({ title: "Register Created", description: "New POS Register has been added." });
    },
  });

  return {
    registers: registersQuery.data,
    isLoadingRegisters: registersQuery.isLoading,
    currentShift: shiftQuery.data,
    isLoadingShift: shiftQuery.isLoading,
    openShift: openShiftMutation.mutateAsync,
    isOpening: openShiftMutation.isPending,
    closeShift: closeShiftMutation.mutateAsync,
    isClosing: closeShiftMutation.isPending,
    createRegister: createRegisterMutation.mutateAsync,
    isCreatingRegister: createRegisterMutation.isPending,
  };
};
