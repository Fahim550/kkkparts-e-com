import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CategoryService } from "../../application/services/category.service";
import { CreateCategoryDTO, UpdateCategoryDTO } from "../../domain/types";

export const CATEGORY_KEYS = {
  all: ["categories"] as const,
  tree: ["categories", "tree"] as const,
  detail: (id: string) => ["categories", id] as const,
};

export function useCategories() {
  return useQuery({
    queryKey: CATEGORY_KEYS.all,
    queryFn: () => CategoryService.getAllCategories(),
  });
}

export function useCategoryTree() {
  return useQuery({
    queryKey: CATEGORY_KEYS.tree,
    queryFn: () => CategoryService.getCategoryTree(),
  });
}

export function useCategory(id: string) {
  return useQuery({
    queryKey: CATEGORY_KEYS.detail(id),
    queryFn: () => CategoryService.getCategoryById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryDTO) =>
      CategoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateCategoryDTO) =>
      CategoryService.updateCategory(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree });
      queryClient.invalidateQueries({
        queryKey: CATEGORY_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CategoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.all });
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.tree });
    },
  });
}
