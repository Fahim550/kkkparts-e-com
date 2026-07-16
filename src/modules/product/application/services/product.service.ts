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

  static generateSKU(productItemCode: string, variationId: string): string {
    // Generate a simple SKU if none provided
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `${productItemCode.toUpperCase()}-${randomSuffix}`;
  }

  static generateBarcode(): string {
    // EAN-13 like barcode (13 digits)
    return Math.floor(1000000000000 + Math.random() * 9000000000000).toString();
  }

  static async createProductVariation(
    payload: CreateProductVariationDTO,
  ): Promise<ProductVariation> {
    // Default values if not provided
    if (!payload.sku) {
       // Ideally we'd pass the item code here, but we don't have it directly in payload.
       // We'll generate a random string for SKU as a fallback, or fetch the product.
       const product = await ProductRepository.getTemplateById(payload.product_id);
       if (product) {
         payload.sku = this.generateSKU(product.item_code, payload.product_id);
       } else {
         payload.sku = `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
       }
    }
    
    if (!payload.barcode) {
       payload.barcode = this.generateBarcode();
    }

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
