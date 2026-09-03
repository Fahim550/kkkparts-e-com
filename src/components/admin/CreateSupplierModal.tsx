import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { SupplierService } from "@/modules/supplier/application/services/supplier.service";
import { Supplier } from "@/modules/supplier/domain/types";

interface CreateSupplierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess?: (supplier: Supplier) => void;
}

export function CreateSupplierModal({
  open,
  onOpenChange,
  initialName = "",
  onSuccess,
}: CreateSupplierModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    tax_id: "",
    address: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initialName || "",
        contact_phone: "",
        contact_email: "",
        tax_id: "",
        address: "",
      });
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSaving(true);
    try {
      const newSupplier = await SupplierService.createSupplier({
        name: form.name.trim(),
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        tax_id: form.tax_id.trim() || null,
        address: form.address.trim() || null,
        is_active: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      await queryClient.invalidateQueries({ queryKey: ["payable-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["supplier-dues"] });

      toast.success(`Supplier "${newSupplier.name}" created successfully!`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newSupplier);
      }
    } catch (err: any) {
      console.error("Error creating supplier:", err);
      toast.error(err.message || "Failed to create supplier");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Truck className="w-5 h-5 text-amber-600" />
            Add New Supplier
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Register a vendor with automatic Accounts Payable ledger tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Supplier / Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              autoFocus
              placeholder="e.g. Al-Maha Auto Parts Suppliers"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Phone Number</Label>
              <Input
                placeholder="e.g. 96893456789"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. sales@vendor.com"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Tax ID / VAT Registration No</Label>
            <Input
              placeholder="e.g. OM-VAT-12345"
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Address / Location</Label>
            <Textarea
              rows={2}
              placeholder="Warehouse address, industrial zone, city"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Supplier
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
