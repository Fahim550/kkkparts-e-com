import { z } from "zod";

export const BrandSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const CategorySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    ),
  image_url: z.string().nullable().optional(),
  parent_id: z.string().uuid().nullable().optional(),
  is_active: z.boolean().default(true),
});

export const UOMSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  abbreviation: z.string().min(1, "Abbreviation must be at least 1 character"),
});

export const AttributeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  display_type: z.string().min(2, "Display type must be specified"),
});

export const AttributeValueSchema = z.object({
  attribute_id: z.string().uuid("Invalid attribute ID"),
  value: z.string().min(1, "Value must not be empty"),
});

export const ProductSchema = z.object({
  item_code: z.string().trim().min(2, "Item code must be at least 2 characters"),
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  description: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  image_url: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: "Price is required", invalid_type_error: "Price must be a valid number" })
      .min(0, "Price must be non-negative")
  ),
  original_price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: "Original price is required", invalid_type_error: "Original price must be a valid number" })
      .min(0, "Original price must be non-negative")
  ),
  dealer_price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: "Dealer price is required", invalid_type_error: "Dealer price must be a valid number" })
      .min(0, "Dealer price must be non-negative")
  ),
  dealer_original_price: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? undefined : Number(val)),
    z.number({ required_error: "Dealer original price is required", invalid_type_error: "Dealer original price must be a valid number" })
      .min(0, "Dealer original price must be non-negative")
  ),
  category_id: z.string().uuid("Category is required"),
  brand_id: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : val),
    z.string().uuid("Invalid brand ID").nullable().optional()
  ),
  base_uom_id: z.string().uuid("Base UOM is required"),
  has_variants: z.boolean().default(false),
  is_active: z.boolean().default(true),
  is_offer: z.boolean().default(false),
  is_trending: z.boolean().default(false),
  is_new: z.boolean().default(false),
});

export const ProductVariationSchema = z.object({
  product_id: z.string().uuid("Product ID is required"),
  sku: z.string().trim().min(2, "SKU must be at least 2 characters"),
  barcode: z.preprocess(
    (val) => (val === "" || val === undefined ? null : val),
    z.string().nullable().optional()
  ),
  weight: z.preprocess(
    (val) => (val === "" || val === null || val === undefined || Number.isNaN(Number(val)) ? null : Number(val)),
    z.number().nonnegative("Weight cannot be negative").nullable().optional()
  ),
  is_active: z.boolean().default(true),
});
