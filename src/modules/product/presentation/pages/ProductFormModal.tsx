import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { uploadProductImage } from "@/lib/image-upload";
import { zodResolver } from "@hookform/resolvers/zod";
import { ImageIcon, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ProductSchema } from "../../domain/schemas";
import { ProductTemplateWithDetails } from "../../domain/types";
import { useCreateBrand, useBrands } from "../hooks/useBrands";
import { useCreateCategory, useCategories } from "../hooks/useCategories";
import {
  useCreateProductTemplate,
  useCreateProductVariation,
  useDeleteProductVariation,
  useUpdateProductTemplate,
} from "../hooks/useProducts";
import { useCreateUOM, useUOMs } from "../hooks/useUOMs";
import { useQueryClient } from "@tanstack/react-query";

type ProductFormData = z.infer<typeof ProductSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  product: ProductTemplateWithDetails | null;
  onSuccess?: (product: any, variation?: any) => void;
}

// ── Reusable Quick-Create Popover ────────────────────────────────────────────
interface QuickCreatePopoverProps {
  label: string;
  fields: { name: string; placeholder: string; required?: boolean }[];
  isLoading: boolean;
  onSave: (values: Record<string, string>) => Promise<void>;
}

function QuickCreatePopover({ label, fields, isLoading, onSave }: QuickCreatePopoverProps) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const isValid = fields
    .filter((f) => f.required !== false)
    .every((f) => (values[f.name] || "").trim() !== "");

  const handleSave = async () => {
    if (!isValid) return;
    await onSave(values);
    setValues({});
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-10 w-10 shrink-0"
          title={`Quick create ${label}`}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 space-y-3" align="start" side="bottom">
        <p className="text-sm font-semibold">Quick Create {label}</p>
        {fields.map((field) => (
          <div key={field.name} className="space-y-1">
            <Label className="text-xs">
              {field.name.charAt(0).toUpperCase() + field.name.slice(1).replace(/_/g, " ")}
              {field.required !== false && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <Input
              placeholder={field.placeholder}
              value={values[field.name] || ""}
              onChange={(e) => setValues((v) => ({ ...v, [field.name]: e.target.value }))}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleSave(); } }}
              className="h-8 text-sm"
            />
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            className="flex-1 h-8"
            onClick={handleSave}
            disabled={isLoading || !isValid}
          >
            {isLoading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
            Create
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => { setValues({}); setOpen(false); }}
          >
            Cancel
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function ProductFormModal({ isOpen, onOpenChange, product, onSuccess }: ProductFormModalProps) {
  const queryClient = useQueryClient();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: uoms } = useUOMs();

  const createProduct = useCreateProductTemplate();
  const updateProduct = useUpdateProductTemplate();
  
  const createVariation = useCreateProductVariation();
  const deleteVariation = useDeleteProductVariation();

  const createCategory = useCreateCategory();
  const createBrand = useCreateBrand();
  const createUOM = useCreateUOM();

  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(ProductSchema),
    defaultValues: { is_active: true, has_variants: false },
  });

  const imageUrl = watch("image_url");

  useEffect(() => {
    if (product) {
      setValue("name", product.name);
      setValue("item_code", product.item_code);
      setValue("description", product.description || "");
      setValue("image_url", product.image_url || "");
      setValue("price", (product as any).price ?? 0);
      setValue("original_price", (product as any).original_price ?? undefined);
      setValue("dealer_price", (product as any).dealer_price ?? undefined);
      setValue("dealer_original_price", (product as any).dealer_original_price ?? undefined);
      setValue("category_id", product.category_id);
      setValue("brand_id", product.brand_id || undefined);
      setValue("base_uom_id", product.base_uom_id);
      setValue("has_variants", product.has_variants ?? false);
      setValue("is_active", product.is_active ?? true);
      setValue("is_offer", (product as any).is_offer ?? false);
      setValue("is_trending", (product as any).is_trending ?? false);
      setValue("is_new", (product as any).is_new ?? false);
    } else {
      reset({ is_active: true, has_variants: false, image_url: "", is_offer: false, is_trending: false, is_new: false });
    }
  }, [product, isOpen, reset, setValue]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const url = await uploadProductImage(file);
      setValue("image_url", url);
      toast.success("Product image uploaded successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to upload product image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setValue("image_url", "");
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      const payload: ProductFormData = {
        ...data,
        item_code: data.item_code.trim(),
        name: data.name.trim(),
        brand_id: data.brand_id ? data.brand_id : null,
        description: data.description?.trim() || null,
        image_url: data.image_url || null,
        price: Number(data.price),
        original_price: Number(data.original_price),
        dealer_price: Number(data.dealer_price),
        dealer_original_price: Number(data.dealer_original_price),
      };

      let savedProduct;
      if (product) {
        savedProduct = await updateProduct.mutateAsync({ id: product.id, ...payload });
        toast.success("Product updated successfully");
      } else {
        savedProduct = await createProduct.mutateAsync(payload);
        toast.success("Product created successfully");
      }
      
      let createdVariation = null;
      if (!payload.has_variants && !product) {
        try {
          createdVariation = await createVariation.mutateAsync({
            product_id: savedProduct.id,
            sku: savedProduct.item_code,
            is_active: true,
          });
        } catch (varErr: any) {
          console.warn("Variation creation with primary SKU failed, trying unique fallback:", varErr);
          const fallbackSku = `${savedProduct.item_code}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
          createdVariation = await createVariation.mutateAsync({
            product_id: savedProduct.id,
            sku: fallbackSku,
            is_active: true,
          });
        }
      }
      
      await queryClient.invalidateQueries({ queryKey: ["products"] });

      if (onSuccess) {
        onSuccess(savedProduct, createdVariation);
      }
      onOpenChange(false);
    } catch (error: any) {
      console.error("Failed to save product:", error);
      const msg =
        error?.message ||
        error?.error_description ||
        (typeof error === "string" ? error : "Failed to save product");
      toast.error(`Failed to save product: ${msg}`);
    }
  };

  const handleAddVariation = async () => {
    if (!product) return;
    try {
      await createVariation.mutateAsync({
        product_id: product.id,
        is_active: true,
      });
      toast.success("Variation added");
    } catch (error: any) {
      toast.error(error?.message || "Failed to add variation");
    }
  };

  const handleDeleteVariation = async (id: string) => {
    try {
      await deleteVariation.mutateAsync(id);
      toast.success("Variation deleted");
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete variation");
    }
  };

  const handleQuickCreateCategory = async (values: Record<string, string>) => {
    const slug = values.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const created = await createCategory.mutateAsync({
      name: values.name.trim(),
      slug,
      is_active: true,
      parent_id: null,
    });
    setValue("category_id", (created as any).id);
    toast.success(`Category "${values.name}" created`);
  };

  const handleQuickCreateBrand = async (values: Record<string, string>) => {
    const created = await createBrand.mutateAsync({
      name: values.name.trim(),
      description: values.description?.trim() || null,
      is_active: true,
    });
    setValue("brand_id", (created as any).id);
    toast.success(`Brand "${values.name}" created`);
  };

  const handleQuickCreateUOM = async (values: Record<string, string>) => {
    const created = await createUOM.mutateAsync({
      name: values.name.trim(),
      abbreviation: values.abbreviation.trim(),
    });
    setValue("base_uom_id", (created as any).id);
    toast.success(`UOM "${values.name}" created`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="pb-2">
          <DialogTitle>{product ? "Edit Product" : "Create Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2 pb-6">
          <div className="space-y-2">
            <Label>Product Image</Label>
            <div className="flex items-center gap-4">
              <div className="relative w-24 h-24 rounded-lg border border-border bg-accent/30 flex items-center justify-center overflow-hidden shrink-0">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt="Product Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-black/80 transition-colors"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label
                    htmlFor="product-image-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-md border border-input bg-background hover:bg-accent text-sm font-medium transition-colors"
                  >
                    {isUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </Label>
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG, WEBP up to 5MB.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Item Code <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input {...register("item_code")} placeholder="e.g. PRD-001" disabled={!!product} />
              {errors.item_code && (
                <p className="text-xs text-red-500 mt-1">{errors.item_code.message}</p>
              )}
            </div>
            <div>
              <Label>
                Name <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input {...register("name")} placeholder="e.g. Premium Oil Filter" />
              {errors.name && (
                <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>
                Price (OMR) <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("price", { valueAsNumber: true })}
                placeholder="e.g. 15.00"
              />
              {errors.price && (
                <p className="text-xs text-red-500 mt-1">{errors.price.message}</p>
              )}
            </div>
            <div>
              <Label>
                Original Price <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("original_price", { valueAsNumber: true })}
                placeholder="e.g. 20.00"
              />
              {errors.original_price && (
                <p className="text-xs text-red-500 mt-1">{errors.original_price.message}</p>
              )}
            </div>
            <div>
              <Label>
                Dealer Price <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("dealer_price", { valueAsNumber: true })}
                placeholder="e.g. 12.00"
              />
              {errors.dealer_price && (
                <p className="text-xs text-red-500 mt-1">{errors.dealer_price.message}</p>
              )}
            </div>
            <div>
              <Label>
                Dealer Orig. Price <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                {...register("dealer_original_price", { valueAsNumber: true })}
                placeholder="e.g. 18.00"
              />
              {errors.dealer_original_price && (
                <p className="text-xs text-red-500 mt-1">{errors.dealer_original_price.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Category <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <select
                    {...register("category_id")}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select Category</option>
                    {categories?.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {errors.category_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>
                  )}
                </div>
                <QuickCreatePopover
                  label="Category"
                  fields={[{ name: "name", placeholder: "e.g. Engine Parts", required: true }]}
                  isLoading={createCategory.isPending}
                  onSave={handleQuickCreateCategory}
                />
              </div>
            </div>
            <div>
              <Label>Brand</Label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <select
                    {...register("brand_id")}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select Brand (Optional)</option>
                    {brands?.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                  {errors.brand_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.brand_id.message}</p>
                  )}
                </div>
                <QuickCreatePopover
                  label="Brand"
                  fields={[
                    { name: "name", placeholder: "e.g. Toyota", required: true },
                    { name: "description", placeholder: "Description (optional)", required: false },
                  ]}
                  isLoading={createBrand.isPending}
                  onSave={handleQuickCreateBrand}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>
                Base Unit of Measure <span className="text-red-500 font-bold ml-0.5">*</span>
              </Label>
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <select
                    {...register("base_uom_id")}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                  >
                    <option value="">Select UOM</option>
                    {uoms?.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.abbreviation})</option>
                    ))}
                  </select>
                  {errors.base_uom_id && (
                    <p className="text-xs text-red-500 mt-1">{errors.base_uom_id.message}</p>
                  )}
                </div>
                <QuickCreatePopover
                  label="UOM"
                  fields={[
                    { name: "name", placeholder: "e.g. Piece", required: true },
                    { name: "abbreviation", placeholder: "e.g. pcs", required: true },
                  ]}
                  isLoading={createUOM.isPending}
                  onSave={handleQuickCreateUOM}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 pt-6">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("has_variants")}
                  onCheckedChange={(val) => setValue("has_variants", val)}
                  disabled={!!product}
                />
                <Label>Has Variants</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(val) => setValue("is_active", val)}
                />
                <Label>Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("is_offer")}
                  onCheckedChange={(val) => setValue("is_offer", val)}
                />
                <Label>Special Offer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("is_trending")}
                  onCheckedChange={(val) => setValue("is_trending", val)}
                />
                <Label>Trending</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("is_new")}
                  onCheckedChange={(val) => setValue("is_new", val)}
                />
                <Label>New Arrival</Label>
              </div>
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Input {...register("description")} placeholder="Optional product description" />
            {errors.description && (
              <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>
            )}
          </div>

          <div className="pt-2 pb-2">
            <Button
              type="submit"
              className="w-full h-10 font-semibold"
              disabled={createProduct.isPending || updateProduct.isPending}
            >
              {(createProduct.isPending || updateProduct.isPending) && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              {product ? "Update Product" : "Create Product"}
            </Button>
          </div>
        </form>

        {product && product.has_variants && (
          <div className="mt-8 pt-6 border-t border-border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Product Variations</h3>
              <Button size="sm" onClick={handleAddVariation} disabled={createVariation.isPending}>
                <Plus className="w-4 h-4 mr-2" /> Add Variation
              </Button>
            </div>
            
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Barcode</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.variations?.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell className="font-mono text-sm">{variant.sku}</TableCell>
                      <TableCell className="font-mono text-sm">{variant.barcode || '—'}</TableCell>
                      <TableCell>{variant.weight || '—'}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${variant.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {variant.is_active ? "Active" : "Inactive"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteVariation(variant.id)}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!product.variations || product.variations.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No variations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
