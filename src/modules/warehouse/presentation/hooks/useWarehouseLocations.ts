import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LocationService } from "../../application/services/location.service";
import {
  CreateWarehouseZoneDTO,
  UpdateWarehouseZoneDTO,
  CreateWarehouseBinDTO,
  UpdateWarehouseBinDTO,
} from "../../domain/types";
import { useToast } from "@/hooks/use-toast";

export const useWarehouseLocations = (warehouseId?: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const zonesQuery = useQuery({
    queryKey: ["warehouse-zones", warehouseId],
    queryFn: () =>
      warehouseId
        ? LocationService.getZonesByWarehouseId(warehouseId)
        : Promise.resolve([]),
    enabled: !!warehouseId,
  });

  // Zones Mutations
  const createZoneMutation = useMutation({
    mutationFn: (data: CreateWarehouseZoneDTO) =>
      LocationService.createZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Zone created successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateZoneMutation = useMutation({
    mutationFn: (data: UpdateWarehouseZoneDTO) =>
      LocationService.updateZone(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Zone updated successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteZoneMutation = useMutation({
    mutationFn: (id: string) => LocationService.deleteZone(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Zone deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  // Bins Mutations
  const createBinMutation = useMutation({
    mutationFn: (data: CreateWarehouseBinDTO) =>
      LocationService.createBin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Bin created successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateBinMutation = useMutation({
    mutationFn: (data: UpdateWarehouseBinDTO) =>
      LocationService.updateBin(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Bin updated successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const deleteBinMutation = useMutation({
    mutationFn: (id: string) => LocationService.deleteBin(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["warehouse-zones", warehouseId],
      });
      toast({ title: "Success", description: "Bin deleted successfully." });
    },
    onError: (error: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  return {
    zones: zonesQuery.data,
    isLoadingZones: zonesQuery.isLoading,
    createZone: createZoneMutation.mutateAsync,
    updateZone: updateZoneMutation.mutateAsync,
    deleteZone: deleteZoneMutation.mutateAsync,
    createBin: createBinMutation.mutateAsync,
    updateBin: updateBinMutation.mutateAsync,
    deleteBin: deleteBinMutation.mutateAsync,
  };
};
