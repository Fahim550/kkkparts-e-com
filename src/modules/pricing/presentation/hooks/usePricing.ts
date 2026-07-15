import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PriceListRepository } from "../../infrastructure/repositories/price-list.repository";
import { DiscountRepository } from "../../infrastructure/repositories/discount.repository";
import { CreatePriceListDTO, CreatePriceListItemDTO, CreateDiscountRuleDTO, CreateDiscountRuleConditionDTO } from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const usePriceLists = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["price-lists"],
    queryFn: PriceListRepository.getAll,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePriceListDTO) => PriceListRepository.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-lists"] });
      toast({ title: "Success", description: "Price list created successfully." });
    },
  });

  return {
    priceLists: query.data,
    isLoading: query.isLoading,
    createPriceList: createMutation.mutateAsync,
  };
};

export const usePriceListItems = (priceListId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["price-list-items", priceListId],
    queryFn: () => PriceListRepository.getItems(priceListId),
    enabled: !!priceListId,
  });

  const setItemPriceMutation = useMutation({
    mutationFn: (data: CreatePriceListItemDTO) => PriceListRepository.setItemPrice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["price-list-items", priceListId] });
      toast({ title: "Success", description: "Price set successfully." });
    },
  });

  return {
    items: query.data,
    isLoading: query.isLoading,
    setItemPrice: setItemPriceMutation.mutateAsync,
  };
};

export const useDiscountRules = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: ["discount-rules"],
    queryFn: DiscountRepository.getAllRules,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { rule: CreateDiscountRuleDTO, conditions: CreateDiscountRuleConditionDTO[] }) => 
      DiscountRepository.createRule(payload.rule, payload.conditions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["discount-rules"] });
      toast({ title: "Success", description: "Discount rule created successfully." });
    },
  });

  return {
    rules: query.data,
    isLoading: query.isLoading,
    createRule: createMutation.mutateAsync,
  };
};
