import React, { useState } from "react";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "../hooks/useCategories";
import { Category } from "../../domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CategorySchema } from "../../domain/schemas";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type CategoryFormData = z.infer<typeof CategorySchema>;

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CategoryFormData>({
    resolver: zodResolver(CategorySchema),
    defaultValues: { is_active: true },
  });

  const onSubmit = async (data: CategoryFormData) => {
    if (editingCategory) {
      await updateCategory.mutateAsync({ id: editingCategory.id, ...data });
    } else {
      await createCategory.mutateAsync(data);
    }
    setIsOpen(false);
    reset();
    setEditingCategory(null);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setValue("name", category.name);
    setValue("slug", category.slug);
    setValue("parent_id", category.parent_id || undefined);
    setValue("is_active", category.is_active ?? true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this category?")) {
      await deleteCategory.mutateAsync(id);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setEditingCategory(null);
    }
  };

  const generateSlug = (name: string) => {
    const generated = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    setValue("slug", generated);
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Category Management</h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Category
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Edit Category" : "Create New Category"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input
                  {...register("name")}
                  onChange={(e) => {
                    register("name").onChange(e);
                    if (!editingCategory) generateSlug(e.target.value);
                  }}
                  placeholder="e.g. Electronics"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Slug</Label>
                <Input {...register("slug")} placeholder="e.g. electronics" />
                {errors.slug && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.slug.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Parent Category</Label>
                <select
                  {...register("parent_id")}
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">None (Top Level)</option>
                  {categories?.filter((c) => c.id !== editingCategory?.id).map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(val) => setValue("is_active", val)}
                />
                <Label>Active</Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {(createCategory.isPending || updateCategory.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingCategory ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Parent Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>
                  {category.parent_id
                    ? categories.find((c) => c.id === category.parent_id)?.name
                    : "—"}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${category.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {category.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(category)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(category.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!categories || categories.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No categories found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
