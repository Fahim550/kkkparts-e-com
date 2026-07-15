import React, { useState } from "react";
import {
  useAttributesWithValues,
  useCreateAttribute,
  useUpdateAttribute,
  useDeleteAttribute,
  useCreateAttributeValue,
  useDeleteAttributeValue,
} from "../hooks/useAttributes";
import {
  Attribute,
  AttributeWithValues,
  CreateAttributeValueDTO,
} from "../../domain/types";
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
import { AttributeSchema } from "../../domain/schemas";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2, Tag as TagIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AttributeFormData = z.infer<typeof AttributeSchema>;

export default function AttributesPage() {
  const { data: attributes, isLoading } = useAttributesWithValues();
  const createAttribute = useCreateAttribute();
  const updateAttribute = useUpdateAttribute();
  const deleteAttribute = useDeleteAttribute();
  const createValue = useCreateAttributeValue();
  const deleteValue = useDeleteAttributeValue();

  const [isOpen, setIsOpen] = useState(false);
  const [editingAttr, setEditingAttr] = useState<Attribute | null>(null);

  const [valueDialogOpen, setValueDialogOpen] = useState(false);
  const [activeAttrId, setActiveAttrId] = useState<string | null>(null);
  const [newValue, setNewValue] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AttributeFormData>({
    resolver: zodResolver(AttributeSchema),
    defaultValues: { display_type: "select" },
  });

  const onSubmit = async (data: AttributeFormData) => {
    if (editingAttr) {
      await updateAttribute.mutateAsync({ id: editingAttr.id, ...data });
    } else {
      await createAttribute.mutateAsync(data);
    }
    setIsOpen(false);
    reset();
    setEditingAttr(null);
  };

  const handleEdit = (attr: Attribute) => {
    setEditingAttr(attr);
    setValue("name", attr.name);
    setValue("display_type", attr.display_type);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (
      confirm(
        "Are you sure you want to delete this attribute and all its values?",
      )
    ) {
      await deleteAttribute.mutateAsync(id);
    }
  };

  const handleAddValue = async () => {
    if (!activeAttrId || !newValue.trim()) return;
    await createValue.mutateAsync({
      attribute_id: activeAttrId,
      value: newValue.trim(),
    });
    setNewValue("");
  };

  const handleDeleteValue = async (valueId: string) => {
    if (confirm("Delete this value?")) {
      await deleteValue.mutateAsync(valueId);
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
          Product Attributes
        </h1>
        <Dialog
          open={isOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              reset();
              setEditingAttr(null);
            }
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Attribute
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAttr ? "Edit Attribute" : "Create New Attribute"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input {...register("name")} placeholder="e.g. Color, Size" />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.name.message}
                  </p>
                )}
              </div>
              <div>
                <Label>Display Type</Label>
                <Select
                  onValueChange={(val) => setValue("display_type", val)}
                  defaultValue="select"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select display type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="select">Dropdown Select</SelectItem>
                    <SelectItem value="radio">Radio Buttons</SelectItem>
                    <SelectItem value="color">Color Swatch</SelectItem>
                    <SelectItem value="button">Button Select</SelectItem>
                  </SelectContent>
                </Select>
                {errors.display_type && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.display_type.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={
                  createAttribute.isPending || updateAttribute.isPending
                }
              >
                {(createAttribute.isPending || updateAttribute.isPending) && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                {editingAttr ? "Update" : "Create"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attribute Name</TableHead>
              <TableHead>Display Type</TableHead>
              <TableHead>Values</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attributes?.map((attr: AttributeWithValues) => (
              <TableRow key={attr.id}>
                <TableCell className="font-medium">{attr.name}</TableCell>
                <TableCell className="capitalize">
                  {attr.display_type}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {attr.values.map((val) => (
                      <Badge key={val.id} variant="secondary" className="pr-1">
                        {val.value}
                        <button
                          onClick={() => handleDeleteValue(val.id)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                    <Dialog
                      open={valueDialogOpen && activeAttrId === attr.id}
                      onOpenChange={(open) => {
                        setValueDialogOpen(open);
                        if (open) setActiveAttrId(attr.id);
                        else {
                          setActiveAttrId(null);
                          setNewValue("");
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Badge
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary border-dashed"
                        >
                          <Plus className="w-3 h-3 mr-1" /> Add Value
                        </Badge>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add values to "{attr.name}"</DialogTitle>
                        </DialogHeader>
                        <div className="flex items-center space-x-2">
                          <Input
                            value={newValue}
                            onChange={(e) => setNewValue(e.target.value)}
                            placeholder="e.g. Red, XL, 15-inch"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddValue();
                              }
                            }}
                          />
                          <Button
                            onClick={handleAddValue}
                            disabled={!newValue.trim() || createValue.isPending}
                          >
                            {createValue.isPending ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              "Add"
                            )}
                          </Button>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          {attr.values.map((val) => (
                            <Badge
                              key={val.id}
                              variant="secondary"
                              className="px-2 py-1"
                            >
                              {val.value}
                            </Badge>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(attr)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(attr.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!attributes || attributes.length === 0) && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  No attributes found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Just a local icon override
const X = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);
