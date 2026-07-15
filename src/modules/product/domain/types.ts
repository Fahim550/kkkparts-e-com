import { Database } from "@/integrations/supabase/types";

type PublicSchema = Database["public"]["Tables"];

// Base Entities mapped exactly to Database schemas
export type Brand = PublicSchema["brands"]["Row"];
export type Category = PublicSchema["categories"]["Row"];
export type UOM = PublicSchema["units_of_measure"]["Row"];
export type Attribute = PublicSchema["attributes"]["Row"];
export type AttributeValue = PublicSchema["attribute_values"]["Row"];
export type Product = PublicSchema["products"]["Row"];
export type ProductVariation = PublicSchema["product_variations"]["Row"];
export type ProductAttribute = PublicSchema["product_attributes"]["Row"];
export type VariationAttribute = PublicSchema["variation_attributes"]["Row"];

// Extended entities for nested UI displays
export type CategoryWithChildren = Category & {
  children?: CategoryWithChildren[];
};

export type AttributeWithValues = Attribute & {
  values: AttributeValue[];
};

export type ProductVariationWithDetails = ProductVariation & {
  attributes: (VariationAttribute & {
    attribute_value: AttributeValue & { attribute: Attribute };
  })[];
};

export type ProductTemplateWithDetails = Product & {
  brand: Brand | null;
  category: Category;
  base_uom: UOM;
  variations: ProductVariationWithDetails[];
  product_attributes: (ProductAttribute & { attribute: Attribute })[];
};

// DTOs (Data Transfer Objects) for Create/Update operations
export type CreateBrandDTO = Omit<Brand, "id" | "created_at" | "updated_at">;
export type UpdateBrandDTO = Partial<CreateBrandDTO> & { id: string };

export type CreateCategoryDTO = Omit<
  Category,
  "id" | "created_at" | "updated_at"
>;
export type UpdateCategoryDTO = Partial<CreateCategoryDTO> & { id: string };

export type CreateUOMDTO = Omit<UOM, "id" | "created_at" | "updated_at">;
export type UpdateUOMDTO = Partial<CreateUOMDTO> & { id: string };

export type CreateAttributeDTO = Omit<
  Attribute,
  "id" | "created_at" | "updated_at"
>;
export type UpdateAttributeDTO = Partial<CreateAttributeDTO> & { id: string };

export type CreateAttributeValueDTO = Omit<
  AttributeValue,
  "id" | "created_at" | "updated_at"
>;
export type UpdateAttributeValueDTO = Partial<CreateAttributeValueDTO> & {
  id: string;
};

export type CreateProductDTO = Omit<
  Product,
  "id" | "created_at" | "updated_at"
>;
export type UpdateProductDTO = Partial<CreateProductDTO> & { id: string };

export type CreateProductVariationDTO = Omit<
  ProductVariation,
  "id" | "created_at" | "updated_at"
>;
export type UpdateProductVariationDTO = Partial<CreateProductVariationDTO> & {
  id: string;
};
