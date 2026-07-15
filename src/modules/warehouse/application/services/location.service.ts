import { WarehouseZoneRepository } from "../../infrastructure/repositories/warehouse-zone.repository";
import { WarehouseBinRepository } from "../../infrastructure/repositories/warehouse-bin.repository";
import {
  CreateWarehouseZoneDTO,
  UpdateWarehouseZoneDTO,
  WarehouseZoneWithBins,
  CreateWarehouseBinDTO,
  UpdateWarehouseBinDTO,
  WarehouseBin,
  WarehouseZone,
} from "../../domain/types";

export class LocationService {
  // Zones
  static async getZonesByWarehouseId(
    warehouseId: string,
  ): Promise<WarehouseZoneWithBins[]> {
    return WarehouseZoneRepository.getByWarehouseId(warehouseId);
  }

  static async getZoneById(id: string): Promise<WarehouseZone | null> {
    return WarehouseZoneRepository.getById(id);
  }

  static async createZone(
    payload: CreateWarehouseZoneDTO,
  ): Promise<WarehouseZone> {
    return WarehouseZoneRepository.create(payload);
  }

  static async updateZone(
    payload: UpdateWarehouseZoneDTO,
  ): Promise<WarehouseZone> {
    return WarehouseZoneRepository.update(payload);
  }

  static async deleteZone(id: string): Promise<void> {
    // Check if zone has bins
    const bins = await WarehouseBinRepository.getByZoneId(id);
    if (bins && bins.length > 0) {
      throw new Error(
        "Cannot delete zone with existing bins. Remove bins first.",
      );
    }
    return WarehouseZoneRepository.delete(id);
  }

  // Bins
  static async getBinsByZoneId(zoneId: string): Promise<WarehouseBin[]> {
    return WarehouseBinRepository.getByZoneId(zoneId);
  }

  static async getBinById(id: string): Promise<WarehouseBin | null> {
    return WarehouseBinRepository.getById(id);
  }

  static async createBin(
    payload: CreateWarehouseBinDTO,
  ): Promise<WarehouseBin> {
    return WarehouseBinRepository.create(payload);
  }

  static async updateBin(
    payload: UpdateWarehouseBinDTO,
  ): Promise<WarehouseBin> {
    return WarehouseBinRepository.update(payload);
  }

  static async deleteBin(id: string): Promise<void> {
    return WarehouseBinRepository.delete(id);
  }
}
