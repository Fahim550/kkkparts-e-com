import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { UomService } from "../../application/services/uom.service";
import { CreateUOMDTO, UpdateUOMDTO } from "../../domain/types";

export const UOM_KEYS = {
  all: ["uoms"] as const,
  detail: (id: string) => ["uoms", id] as const,
};

export function useUOMs() {
  return useQuery({
    queryKey: UOM_KEYS.all,
    queryFn: () => UomService.getAllUOMs(),
  });
}

export function useUOM(id: string) {
  return useQuery({
    queryKey: UOM_KEYS.detail(id),
    queryFn: () => UomService.getUOMById(id),
    enabled: !!id,
  });
}

export function useCreateUOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUOMDTO) => UomService.createUOM(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UOM_KEYS.all });
    },
  });
}

export function useUpdateUOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateUOMDTO) => UomService.updateUOM(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: UOM_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: UOM_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteUOM() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => UomService.deleteUOM(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UOM_KEYS.all });
    },
  });
}
