import React, { useState } from "react";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "../hooks/useBrands";
import { Brand } from "../../domain/types";
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
import { BrandSchema } from "../../domain/schemas";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type BrandFormData = z.infer<typeof BrandSchema>;

export default function BrandsPage() {
  const { data: brands, isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [isOpen, setIsOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<BrandFormData>({
    resolver: zodResolver(BrandSchema),
    defaultValues: { is_active: true },
  });

  const onSubmit = async (data: BrandFormData) => {
    if (editingBrand) {
      await updateBrand.mutateAsync({ id: editingBrand.id, ...data });
    } else {
      await createBrand.mutateAsync(data);
    }
    setIsOpen(false);
    reset();
    setEditingBrand(null);
  };

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setValue("name", brand.name);
    setValue("description", brand.description || "");
    setValue("is_active", brand.is_active ?? true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this brand?")) {
      await deleteBrand.mutateAsync(id);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setEditingBrand(null);
    }
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
        <h1 className="text-2xl font-bold tracking-tight">Brand Management</h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Brand
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingBrand ? "Edit Brand" : "Create New Brand"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...register("name")} placeholder="e.g. Toyota" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Description</Label>
                <Input
                  {...register("description")}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watch("is_active")}
                  onCheckedChange={(val) => setValue("is_active", val)}
                />
                <Label>Active</Label>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createBrand.isPending || updateBrand.isPending}
              >
                {(createBrand.isPending || updateBrand.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingBrand ? "Update" : "Create"}
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
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {brands?.map((brand) => (
              <TableRow key={brand.id}>
                <TableCell className="font-medium">{brand.name}</TableCell>
                <TableCell>{brand.description}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${brand.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {brand.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(brand)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(brand.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!brands || brands.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No brands found. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
