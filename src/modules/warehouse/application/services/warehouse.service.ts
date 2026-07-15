import { WarehouseRepository } from "../../infrastructure/repositories/warehouse.repository";
import {
  CreateWarehouseDTO,
  UpdateWarehouseDTO,
  Warehouse,
} from "../../domain/types";

export class WarehouseService {
  static async getAllWarehouses(): Promise<Warehouse[]> {
    return WarehouseRepository.getAll();
  }

  static async getWarehouseById(id: string): Promise<Warehouse | null> {
    return WarehouseRepository.getById(id);
  }

  static async createWarehouse(
    payload: CreateWarehouseDTO,
  ): Promise<Warehouse> {
    // Additional business logic/validation can be added here
    return WarehouseRepository.create(payload);
  }

  static async updateWarehouse(
    payload: UpdateWarehouseDTO,
  ): Promise<Warehouse> {
    return WarehouseRepository.update(payload);
  }

  static async deleteWarehouse(id: string): Promise<void> {
    // Business logic: check if warehouse has stock or zones before deleting
    return WarehouseRepository.delete(id);
  }
}
