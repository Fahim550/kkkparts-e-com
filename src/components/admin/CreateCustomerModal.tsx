import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerService } from "@/modules/customer/application/services/customer.service";
import { Customer } from "@/modules/customer/domain/types";

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  onSuccess?: (customer: Customer) => void;
}

export function CreateCustomerModal({
  open,
  onOpenChange,
  initialName = "",
  onSuccess,
}: CreateCustomerModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    customer_group: "Retail",
    contact_phone: "",
    contact_email: "",
    tax_id: "",
    credit_limit: "0",
    billing_address: "",
    shipping_address: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: initialName || "",
        customer_group: "Retail",
        contact_phone: "",
        contact_email: "",
        tax_id: "",
        credit_limit: "0",
        billing_address: "",
        shipping_address: "",
      });
    }
  }, [open, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSaving(true);
    try {
      const newCustomer = await CustomerService.createCustomer({
        name: form.name.trim(),
        customer_group: form.customer_group || "Retail",
        contact_phone: form.contact_phone.trim() || null,
        contact_email: form.contact_email.trim() || null,
        tax_id: form.tax_id.trim() || null,
        credit_limit: Number(form.credit_limit) || 0,
        billing_address: form.billing_address.trim() || null,
        shipping_address: form.shipping_address.trim() || null,
        is_active: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });

      toast.success(`Customer "${newCustomer.name}" created successfully!`);
      onOpenChange(false);
      if (onSuccess) {
        onSuccess(newCustomer);
      }
    } catch (err: any) {
      console.error("Error creating customer:", err);
      toast.error(err.message || "Failed to create customer");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <UserPlus className="w-5 h-5 text-emerald-600" />
            Add New Customer
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            Register a new client with automatic Accounts Receivable ledger tracking.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              Customer Name <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              autoFocus
              placeholder="e.g. Ahmed Al-Balushi or Auto Express LLC"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Customer Group</Label>
              <Select
                value={form.customer_group}
                onValueChange={(val) => setForm({ ...form, customer_group: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Wholesale">Wholesale</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Credit Limit</Label>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={form.credit_limit}
                onChange={(e) => setForm({ ...form, credit_limit: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Contact Phone</Label>
              <Input
                placeholder="e.g. 96891234567"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
              <Input
                type="email"
                placeholder="e.g. customer@example.com"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Tax ID / VAT No (Optional)</Label>
            <Input
              placeholder="e.g. OM12345678"
              value={form.tax_id}
              onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">Address / City</Label>
            <Textarea
              rows={2}
              placeholder="e.g. Al Khuwair, Muscat, Sultanate of Oman"
              value={form.billing_address}
              onChange={(e) => setForm({ ...form, billing_address: e.target.value })}
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
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Customer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
