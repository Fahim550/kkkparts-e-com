import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BrandService } from "../../application/services/brand.service";
import { CreateBrandDTO, UpdateBrandDTO } from "../../domain/types";

export const BRAND_KEYS = {
  all: ["brands"] as const,
  detail: (id: string) => ["brands", id] as const,
};

export function useBrands() {
  return useQuery({
    queryKey: BRAND_KEYS.all,
    queryFn: () => BrandService.getAllBrands(),
  });
}

export function useBrand(id: string) {
  return useQuery({
    queryKey: BRAND_KEYS.detail(id),
    queryFn: () => BrandService.getBrandById(id),
    enabled: !!id,
  });
}

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBrandDTO) => BrandService.createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}

export function useUpdateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateBrandDTO) => BrandService.updateBrand(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: BRAND_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BrandService.deleteBrand(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BRAND_KEYS.all });
    },
  });
}
