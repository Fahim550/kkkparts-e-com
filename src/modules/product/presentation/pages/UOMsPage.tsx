import React, { useState } from "react";
import {
  useUOMs,
  useCreateUOM,
  useUpdateUOM,
  useDeleteUOM,
} from "../hooks/useUOMs";
import { UOM } from "../../domain/types";
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
import { UOMSchema } from "../../domain/schemas";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2 } from "lucide-react";
import { Label } from "@/components/ui/label";

type UOMFormData = z.infer<typeof UOMSchema>;

export default function UOMsPage() {
  const { data: uoms, isLoading } = useUOMs();
  const createUOM = useCreateUOM();
  const updateUOM = useUpdateUOM();
  const deleteUOM = useDeleteUOM();

  const [isOpen, setIsOpen] = useState(false);
  const [editingUOM, setEditingUOM] = useState<UOM | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<UOMFormData>({
    resolver: zodResolver(UOMSchema),
  });

  const onSubmit = async (data: UOMFormData) => {
    if (editingUOM) {
      await updateUOM.mutateAsync({ id: editingUOM.id, ...data });
    } else {
      await createUOM.mutateAsync(data);
    }
    setIsOpen(false);
    reset();
    setEditingUOM(null);
  };

  const handleEdit = (uom: UOM) => {
    setEditingUOM(uom);
    setValue("name", uom.name);
    setValue("abbreviation", uom.abbreviation);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this UOM?")) {
      await deleteUOM.mutateAsync(id);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setEditingUOM(null);
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
        <h1 className="text-2xl font-bold tracking-tight">
          Units of Measure (UOM)
        </h1>
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add UOM
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingUOM ? "Edit UOM" : "Create New UOM"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...register("name")} placeholder="e.g. Kilogram" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Abbreviation</Label>
                <Input {...register("abbreviation")} placeholder="e.g. KG" />
                {errors.abbreviation && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.abbreviation.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createUOM.isPending || updateUOM.isPending}
              >
                {(createUOM.isPending || updateUOM.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingUOM ? "Update" : "Create"}
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
              <TableHead>Abbreviation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uoms?.map((uom) => (
              <TableRow key={uom.id}>
                <TableCell className="font-medium">{uom.name}</TableCell>
                <TableCell>{uom.abbreviation}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(uom)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(uom.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!uoms || uoms.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  No Units of Measure found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
