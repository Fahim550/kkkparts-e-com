import { SupplierRepository } from "../../infrastructure/repositories/supplier.repository";
import { Supplier, CreateSupplierDTO, UpdateSupplierDTO, ChartOfAccount } from "../../domain/types";

export class SupplierService {
  static async getAllSuppliers(): Promise<Supplier[]> {
    return SupplierRepository.getAll();
  }

  static async searchSuppliers(query: string): Promise<Supplier[]> {
    if (!query) return this.getAllSuppliers();
    return SupplierRepository.searchByName(query);
  }

  static async getSupplierById(id: string): Promise<Supplier | null> {
    return SupplierRepository.getById(id);
  }

  static async createSupplier(payload: CreateSupplierDTO): Promise<Supplier> {
    // Additional validation could go here
    return SupplierRepository.create(payload);
  }

  static async updateSupplier(payload: UpdateSupplierDTO): Promise<Supplier> {
    return SupplierRepository.update(payload);
  }

  static async deleteSupplier(id: string): Promise<void> {
    return SupplierRepository.delete(id);
  }

  static async getPayableAccounts(): Promise<ChartOfAccount[]> {
    return SupplierRepository.getPayableAccounts();
  }
}
