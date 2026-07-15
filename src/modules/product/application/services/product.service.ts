import { ProductSchema, ProductVariationSchema } from "../../domain/schemas";
import {
  CreateProductDTO,
  CreateProductVariationDTO,
  Product,
  ProductTemplateWithDetails,
  ProductVariation,
  UpdateProductDTO,
  UpdateProductVariationDTO,
} from "../../domain/types";
import { ProductRepository } from "../../infrastructure/repositories/product.repository";

export class ProductService {
  static async getAllProductTemplates(): Promise<ProductTemplateWithDetails[]> {
    return await ProductRepository.getAllTemplates();
  }

  static async getProductTemplateById(
    id: string,
  ): Promise<ProductTemplateWithDetails | null> {
    return await ProductRepository.getTemplateById(id);
  }

  static async createProductTemplate(
    payload: CreateProductDTO,
  ): Promise<Product> {
    const validated = ProductSchema.parse(payload);
    return await ProductRepository.createTemplate(
      validated as CreateProductDTO,
    );
  }

  static async updateProductTemplate(
    payload: UpdateProductDTO,
  ): Promise<Product> {
    const validated = ProductSchema.partial().parse(payload);
    return await ProductRepository.updateTemplate({
      ...validated,
      id: payload.id,
    } as UpdateProductDTO);
  }

  static async deleteProductTemplate(id: string): Promise<void> {
    return await ProductRepository.deleteTemplate(id);
  }

  // --- Variations ---

  static async createProductVariation(
    payload: CreateProductVariationDTO,
  ): Promise<ProductVariation> {
    const validated = ProductVariationSchema.parse(payload);
    return await ProductRepository.createVariation(
      validated as CreateProductVariationDTO,
    );
  }

  static async updateProductVariation(
    payload: UpdateProductVariationDTO,
  ): Promise<ProductVariation> {
    const validated = ProductVariationSchema.partial().parse(payload);
    return await ProductRepository.updateVariation({
      ...validated,
      id: payload.id,
    } as UpdateProductVariationDTO);
  }

  static async deleteProductVariation(id: string): Promise<void> {
    return await ProductRepository.deleteVariation(id);
  }
}
