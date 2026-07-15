import { BrandSchema } from "../../domain/schemas";
import { Brand, CreateBrandDTO, UpdateBrandDTO } from "../../domain/types";
import { BrandRepository } from "../../infrastructure/repositories/brand.repository";

export class BrandService {
  static async getAllBrands(): Promise<Brand[]> {
    return await BrandRepository.getAll();
  }

  static async getBrandById(id: string): Promise<Brand | null> {
    return await BrandRepository.getById(id);
  }

  static async createBrand(payload: CreateBrandDTO): Promise<Brand> {
    // Validate business rules
    const validated = BrandSchema.parse(payload);
    return await BrandRepository.create(validated as CreateBrandDTO);
  }

  static async updateBrand(payload: UpdateBrandDTO): Promise<Brand> {
    // Partial validation for updates
    const validated = BrandSchema.partial().parse(payload);
    return await BrandRepository.update({
      ...validated,
      id: payload.id,
    } as UpdateBrandDTO);
  }

  static async deleteBrand(id: string): Promise<void> {
    // Could add business checks here (e.g., check if brand is used by products)
    // For now, Postgres foreign keys will handle the hard enforcement.
    return await BrandRepository.delete(id);
  }
}
