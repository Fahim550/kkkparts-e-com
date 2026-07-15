import { supabase } from "@/integrations/supabase/client";
import {
  Category,
  CreateCategoryDTO,
  UpdateCategoryDTO,
  CategoryWithChildren,
} from "../../domain/types";

export class CategoryRepository {
  static async getAll(): Promise<Category[]> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  }

  static async getTree(): Promise<CategoryWithChildren[]> {
    // Supabase doesn't natively return recursive trees easily in one query without a custom RPC function.
    // For now, we fetch all and build the tree in memory, which is standard practice for adjaceny lists in frontend.
    const allCategories = await this.getAll();

    const categoryMap = new Map<string, CategoryWithChildren>();
    const roots: CategoryWithChildren[] = [];

    // Initialize map
    allCategories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Build tree
    allCategories.forEach((cat) => {
      const node = categoryMap.get(cat.id)!;
      if (cat.parent_id) {
        const parent = categoryMap.get(cat.parent_id);
        if (parent) {
          parent.children!.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  }

  static async getById(id: string): Promise<Category | null> {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  }

  static async create(payload: CreateCategoryDTO): Promise<Category> {
    const { data, error } = await supabase
      .from("categories")
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async update(payload: UpdateCategoryDTO): Promise<Category> {
    const { id, ...updateData } = payload;
    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;
  }
}
