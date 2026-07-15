import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ProductService } from "../../application/services/product.service";
import {
  CreateProductDTO,
  UpdateProductDTO,
  CreateProductVariationDTO,
  UpdateProductVariationDTO,
} from "../../domain/types";

export const PRODUCT_KEYS = {
  templates: ["products", "templates"] as const,
  templateDetail: (id: string) => ["products", "templates", id] as const,
};

export function useProductTemplates() {
  return useQuery({
    queryKey: PRODUCT_KEYS.templates,
    queryFn: () => ProductService.getAllProductTemplates(),
  });
}

export function useProductTemplate(id: string) {
  return useQuery({
    queryKey: PRODUCT_KEYS.templateDetail(id),
    queryFn: () => ProductService.getProductTemplateById(id),
    enabled: !!id,
  });
}

export function useCreateProductTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductDTO) =>
      ProductService.createProductTemplate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
    },
  });
}

export function useUpdateProductTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductDTO) =>
      ProductService.updateProductTemplate(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.templateDetail(variables.id),
      });
    },
  });
}

export function useDeleteProductTemplate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProductService.deleteProductTemplate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
    },
  });
}

// --- Variations ---

export function useCreateProductVariation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductVariationDTO) =>
      ProductService.createProductVariation(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
      queryClient.invalidateQueries({
        queryKey: PRODUCT_KEYS.templateDetail(variables.product_id),
      });
    },
  });
}

export function useUpdateProductVariation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProductVariationDTO) =>
      ProductService.updateProductVariation(data),
    onSuccess: () => {
      // In a real scenario we'd pass the product_id to precisely invalidate the detail view.
      // For now we invalidate all templates to refresh variations
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
    },
  });
}

export function useDeleteProductVariation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ProductService.deleteProductVariation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.templates });
    },
  });
}
