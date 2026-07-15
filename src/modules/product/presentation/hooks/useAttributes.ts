import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttributeService } from "../../application/services/attribute.service";
import {
  CreateAttributeDTO,
  UpdateAttributeDTO,
  CreateAttributeValueDTO,
  UpdateAttributeValueDTO,
} from "../../domain/types";

export const ATTRIBUTE_KEYS = {
  all: ["attributes"] as const,
  withValues: ["attributes", "with-values"] as const,
  detail: (id: string) => ["attributes", id] as const,
};

export function useAttributes() {
  return useQuery({
    queryKey: ATTRIBUTE_KEYS.all,
    queryFn: () => AttributeService.getAllAttributes(),
  });
}

export function useAttributesWithValues() {
  return useQuery({
    queryKey: ATTRIBUTE_KEYS.withValues,
    queryFn: () => AttributeService.getAllAttributesWithValues(),
  });
}

export function useAttribute(id: string) {
  return useQuery({
    queryKey: ATTRIBUTE_KEYS.detail(id),
    queryFn: () => AttributeService.getAttributeById(id),
    enabled: !!id,
  });
}

export function useCreateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAttributeDTO) =>
      AttributeService.createAttribute(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
    },
  });
}

export function useUpdateAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAttributeDTO) =>
      AttributeService.updateAttribute(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
      queryClient.invalidateQueries({
        queryKey: ATTRIBUTE_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteAttribute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttributeService.deleteAttribute(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.all });
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
    },
  });
}

// --- Values ---

export function useCreateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAttributeValueDTO) =>
      AttributeService.createAttributeValue(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
      queryClient.invalidateQueries({
        queryKey: ATTRIBUTE_KEYS.detail(variables.attribute_id),
      });
    },
  });
}

export function useUpdateAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateAttributeValueDTO) =>
      AttributeService.updateAttributeValue(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
      // In a real app we might pass the parent ID to invalidate the specific attribute detail too
    },
  });
}

export function useDeleteAttributeValue() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AttributeService.deleteAttributeValue(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ATTRIBUTE_KEYS.withValues });
    },
  });
}
