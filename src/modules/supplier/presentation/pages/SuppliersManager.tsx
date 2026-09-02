import React, { useState } from "react";
import { useSuppliers } from "../hooks/useSuppliers";
import { Supplier } from "../../domain/types";
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
import { SupplierSchema } from "../../domain/validations";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2, Search, Mail, Phone, MapPin } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type SupplierFormData = z.infer<typeof SupplierSchema>;

export default function SuppliersManager() {
  const { 
    suppliers, 
    isLoading, 
    searchQuery, 
    setSearchQuery,
    payableAccounts,
    createSupplier, 
    updateSupplier, 
    deleteSupplier, 
    isCreating, 
    isUpdating 
  } = useSuppliers();

  const [isOpen, setIsOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: { is_active: true },
  });

  const payableAccountId = watch("payable_account_id");

  React.useEffect(() => {
    if (isOpen && !editingSupplier && payableAccounts && payableAccounts.length > 0 && !payableAccountId) {
      setValue("payable_account_id", payableAccounts[0].id);
    }
  }, [isOpen, editingSupplier, payableAccounts, payableAccountId, setValue]);

  const onSubmit = async (data: SupplierFormData) => {
    // Convert empty strings to null for optional fields to avoid DB constraint issues
    const payload = {
      ...data,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      address: data.address || null,
      tax_id: data.tax_id || null,
    };

    if (editingSupplier) {
      await updateSupplier({ id: editingSupplier.id, ...payload });
    } else {
      await createSupplier(payload);
    }
    setIsOpen(false);
    reset();
    setEditingSupplier(null);
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setValue("name", supplier.name);
    setValue("contact_email", supplier.contact_email || "");
    setValue("contact_phone", supplier.contact_phone || "");
    setValue("address", supplier.address || "");
    setValue("tax_id", supplier.tax_id || "");
    setValue("payable_account_id", supplier.payable_account_id);
    setValue("is_active", supplier.is_active ?? true);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      await deleteSupplier(id);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      reset();
      setEditingSupplier(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Supplier Management</h1>
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button className="shrink-0">
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? "Edit Supplier" : "Create New Supplier"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Supplier Name <span className="text-red-500">*</span></Label>
                    <Input {...register("name")} placeholder="e.g. Acme Corp" />
                    {errors.name && (
                      <p className="text-sm text-red-500">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tax ID</Label>
                    <Input {...register("tax_id")} placeholder="Optional" />
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Email</Label>
                    <Input {...register("contact_email")} type="email" placeholder="email@example.com" />
                    {errors.contact_email && (
                      <p className="text-sm text-red-500">{errors.contact_email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Contact Phone</Label>
                    <Input {...register("contact_phone")} placeholder="Phone number" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input {...register("address")} placeholder="Full address" />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label>Payable Account <span className="text-red-500">*</span></Label>
                    <Select value={payableAccountId} onValueChange={(val) => setValue("payable_account_id", val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an account..." />
                      </SelectTrigger>
                      <SelectContent>
                        {payableAccounts?.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.account_number})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.payable_account_id && (
                      <p className="text-sm text-red-500">{errors.payable_account_id.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 border-t">
                  <Switch
                    checked={watch("is_active")}
                    onCheckedChange={(val) => setValue("is_active", val)}
                  />
                  <Label>Active Supplier</Label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isCreating || isUpdating}
                >
                  {(isCreating || isUpdating) && (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  )}
                  {editingSupplier ? "Update Supplier" : "Create Supplier"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier</TableHead>
              <TableHead>Contact Info</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="text-center py-8">
                   <Loader2 className="animate-spin w-6 h-6 mx-auto text-muted-foreground" />
                 </TableCell>
               </TableRow>
            ) : suppliers?.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>
                  <div className="font-medium">{supplier.name}</div>
                  {supplier.tax_id && <div className="text-xs text-muted-foreground mt-1">Tax ID: {supplier.tax_id}</div>}
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    {supplier.contact_email && (
                      <div className="flex items-center text-muted-foreground">
                        <Mail className="w-3 h-3 mr-2" /> {supplier.contact_email}
                      </div>
                    )}
                    {supplier.contact_phone && (
                      <div className="flex items-center text-muted-foreground">
                        <Phone className="w-3 h-3 mr-2" /> {supplier.contact_phone}
                      </div>
                    )}
                    {!supplier.contact_email && !supplier.contact_phone && (
                      <span className="text-muted-foreground text-xs italic">No contacts</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {supplier.address ? (
                    <div className="flex items-start text-sm text-muted-foreground">
                      <MapPin className="w-3 h-3 mr-2 mt-0.5 shrink-0" /> 
                      <span className="line-clamp-2">{supplier.address}</span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs italic">N/A</span>
                  )}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${supplier.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {supplier.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier.id)}>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!isLoading && (!suppliers || suppliers.length === 0)) && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No suppliers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
