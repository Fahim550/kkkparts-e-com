import { CustomerRepository } from "../../infrastructure/repositories/customer.repository";
import { CustomerHistoryRepository } from "../../infrastructure/repositories/customer-history.repository";
import { Customer, CreateCustomerDTO, UpdateCustomerDTO, CustomerHistoryItem, CustomerDueStats } from "../../domain/types";

export class CustomerService {
  static async getAllCustomers(): Promise<Customer[]> {
    return CustomerRepository.getAll();
  }

  static async getCustomerById(id: string): Promise<Customer> {
    return CustomerRepository.getById(id);
  }

  static async createCustomer(payload: CreateCustomerDTO): Promise<Customer> {
    return CustomerRepository.create(payload);
  }

  static async updateCustomer(id: string, payload: UpdateCustomerDTO): Promise<Customer> {
    return CustomerRepository.update(id, payload);
  }

  static async deleteCustomer(id: string): Promise<void> {
    // Note: This will fail if the customer has associated sales orders or invoices due to RESTRICT constraints
    return CustomerRepository.delete(id);
  }

  static async getCustomerHistory(id: string): Promise<CustomerHistoryItem[]> {
    return CustomerHistoryRepository.getHistory(id);
  }

  static async getCustomerDueStats(id: string): Promise<CustomerDueStats> {
    return CustomerHistoryRepository.getDueStats(id);
  }
}
