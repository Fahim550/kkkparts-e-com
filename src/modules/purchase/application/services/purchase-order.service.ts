import { PurchaseOrderRepository } from "../../infrastructure/repositories/purchase-order.repository";
import { PurchaseOrder, CreatePurchaseOrderDTO, CreatePurchaseOrderItemDTO } from "../../domain/types";

export class PurchaseOrderService {
  static async getAllOrders(): Promise<PurchaseOrder[]> {
    return PurchaseOrderRepository.getAll();
  }

  static async getOrderById(id: string): Promise<PurchaseOrder | null> {
    return PurchaseOrderRepository.getById(id);
  }

  static async createOrder(po: CreatePurchaseOrderDTO, items: CreatePurchaseOrderItemDTO[]): Promise<PurchaseOrder> {
    if (!items || items.length === 0) {
      throw new Error("Purchase order must have at least one item.");
    }
    // Calculate total amount
    const totalAmount = items.reduce((sum, item) => sum + (item.quantity_ordered * item.unit_price), 0);
    const poPayload = { ...po, total_amount: totalAmount };
    
    // Add total_price to each item
    const itemsPayload = items.map(item => ({
      ...item,
      total_price: item.quantity_ordered * item.unit_price
    }));

    return PurchaseOrderRepository.create(poPayload, itemsPayload);
  }

  static async updateOrderStatus(id: string, status: string): Promise<void> {
    return PurchaseOrderRepository.updateStatus(id, status);
  }
}
