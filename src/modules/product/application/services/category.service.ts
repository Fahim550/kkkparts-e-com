import { CategoryRepository } from "../../infrastructure/repositories/category.repository";
import { CategorySchema } from "../../domain/schemas";
import {
  Category,
  CategoryWithChildren,
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../../domain/types";

export class CategoryService {
  static async getAllCategories(): Promise<Category[]> {
    return await CategoryRepository.getAll();
  }

  static async getCategoryTree(): Promise<CategoryWithChildren[]> {
    return await CategoryRepository.getTree();
  }

  static async getCategoryById(id: string): Promise<Category | null> {
    return await CategoryRepository.getById(id);
  }

  static async createCategory(payload: CreateCategoryDTO): Promise<Category> {
    const validated = CategorySchema.parse(payload);
    return await CategoryRepository.create(validated as CreateCategoryDTO);
  }

  static async updateCategory(payload: UpdateCategoryDTO): Promise<Category> {
    const validated = CategorySchema.partial().parse(payload);
    return await CategoryRepository.update({
      ...validated,
      id: payload.id,
    } as UpdateCategoryDTO);
  }

  static async deleteCategory(id: string): Promise<void> {
    return await CategoryRepository.delete(id);
  }
}
