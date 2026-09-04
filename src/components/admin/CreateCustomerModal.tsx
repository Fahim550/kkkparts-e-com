import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CustomerService } from "@/modules/customer/application/services/customer.service";
import { Customer } from "@/modules/customer/domain/types";
import { supabase } from "@/integrations/supabase/client";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";

interface CreateCustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName?: string;
  initialGroup?: string;
  onSuccess?: (customer: Customer) => void;
}

export function CreateCustomerModal({
  open,
  onOpenChange,
  initialName = "",
  initialGroup = "Retail",
  onSuccess,
}: CreateCustomerModalProps) {
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [partyType, setPartyType] = useState<"customer" | "dealer">(
    initialGroup === "Dealer" ? "dealer" : "customer"
  );

  const [form, setForm] = useState({
    name: "",
    customer_group: "Retail",
    contact_phone: "",
    contact_email: "",
    area: "",
    tax_id: "",
    credit_limit: "0",
    password: "",
    billing_address: "",
    shipping_address: "",
  });

  useEffect(() => {
    if (open) {
      const isDealerInit = initialGroup === "Dealer";
      setPartyType(isDealerInit ? "dealer" : "customer");
      setForm({
        name: initialName || "",
        customer_group: isDealerInit ? "Dealer" : (initialGroup || "Retail"),
        contact_phone: "",
        contact_email: "",
        area: "",
        tax_id: "",
        credit_limit: "0",
        password: "",
        billing_address: "",
        shipping_address: "",
      });
    }
  }, [open, initialName, initialGroup]);

  // Helper to create safe temporary Supabase client to avoid logging out current admin
  const getTempAuthClient = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
    const supabaseKey =
      import.meta.env.VITE_SUPABASE_ANON_KEY ||
      import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
      "placeholder-key";
    return createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error(partyType === "dealer" ? "Dealer / Company name is required" : "Customer name is required");
      return;
    }

    setSaving(true);
    try {
      const isDealer = partyType === "dealer" || form.customer_group === "Dealer";

      if (isDealer) {
        // 1. Create customer ledger with customer_group: 'Dealer'
        const fullAddress = (form.area.trim() ? `${form.area.trim()}, ` : "") + (form.billing_address.trim() || "");
        const newCustomer = await CustomerService.createCustomer({
          name: form.name.trim(),
          customer_group: "Dealer",
          contact_phone: form.contact_phone.trim() || null,
          contact_email: form.contact_email.trim() || null,
          tax_id: form.tax_id.trim() || null,
          credit_limit: Number(form.credit_limit) || 0,
          billing_address: fullAddress.trim() || null,
          shipping_address: form.shipping_address.trim() || null,
          is_active: true,
        });

        // 2. Register dealer portal account if phone or email or password provided
        if (form.password.trim() || form.contact_email.trim() || form.contact_phone.trim()) {
          try {
            const tempClient = getTempAuthClient();
            let authEmail = form.contact_email.trim();
            if (!authEmail) {
              if (form.contact_phone.trim()) {
                authEmail = `${form.contact_phone.trim()}@dealer.local`;
              } else {
                authEmail = `${form.name.replace(/\s+/g, "").toLowerCase()}_${Date.now()}@dealer.local`;
              }
            } else if (!authEmail.includes("@")) {
              authEmail = `${authEmail}@dealer.local`;
            }

            const defaultPassword = form.password.trim() || "dealer123456";

            const { data: authData } = await tempClient.auth.signUp({
              email: authEmail,
              password: defaultPassword,
              options: {
                data: {
                  full_name: form.name.trim(),
                  phone: form.contact_phone.trim(),
                  role: "dealer",
                  area: form.area.trim(),
                  license_number: form.tax_id.trim(),
                  is_approved: true,
                  plain_password: defaultPassword,
                },
              },
            });

            if (authData?.user) {
              await supabase.from("dealers").upsert({
                id: authData.user.id,
                full_name: form.name.trim(),
                email: authEmail,
                phone: form.contact_phone.trim(),
                area: form.area.trim(),
                license_number: form.tax_id.trim(),
                is_approved: true,
                plain_password: defaultPassword,
              });

              try {
                await supabase.from("users").upsert({
                  id: authData.user.id,
                  role: "dealer",
                });
              } catch (uErr) {
                console.warn("Could not record dealer role in users table:", uErr);
              }
            }
          } catch (dealerErr) {
            console.warn("Could not register dealer portal login:", dealerErr);
          }
        }

        await queryClient.invalidateQueries({ queryKey: ["customers"] });
        await queryClient.invalidateQueries({ queryKey: ["dealers_list"] });
        await queryClient.invalidateQueries({ queryKey: ["users_list"] });
        await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });

        toast.success(`Dealer "${newCustomer.name}" created successfully!`);
        onOpenChange(false);
        if (onSuccess) {
          onSuccess(newCustomer);
        }
      } else {
        // Standard Customer
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
      }
    } catch (err: any) {
      console.error("Error creating party:", err);
      toast.error(err.message || "Failed to create party");
    } finally {
      setSaving(false);
    }
  };

  const isDealer = partyType === "dealer";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            {isDealer ? (
              <>
                <Building2 className="w-5 h-5 text-blue-600" />
                Add New Dealer (Wholesale)
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5 text-emerald-600" />
                Add New Customer
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-gray-500">
            {isDealer
              ? "Register a wholesale dealer with dedicated receivable account & optional portal login."
              : "Register a retail/individual client with automatic Accounts Receivable ledger tracking."}
          </DialogDescription>
        </DialogHeader>

        {/* PARTY TYPE TOGGLE TABS */}
        <div className="grid grid-cols-2 p-1 bg-muted/70 rounded-lg text-xs font-medium border">
          <button
            type="button"
            onClick={() => {
              setPartyType("customer");
              setForm((f) => ({ ...f, customer_group: f.customer_group === "Dealer" ? "Retail" : f.customer_group }));
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-1.5 rounded-md transition-all",
              !isDealer
                ? "bg-background text-emerald-700 shadow-sm font-semibold border border-emerald-200"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Regular Customer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setPartyType("dealer");
              setForm((f) => ({ ...f, customer_group: "Dealer" }));
            }}
            className={cn(
              "flex items-center justify-center gap-2 py-1.5 rounded-md transition-all",
              isDealer
                ? "bg-background text-blue-700 shadow-sm font-semibold border border-blue-200"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Dealer / Workshop</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              {isDealer ? "Dealer / Workshop / Company Name" : "Customer Name"} <span className="text-red-500">*</span>
            </Label>
            <Input
              required
              autoFocus
              placeholder={isDealer ? "e.g. Al-Futtaim Workshop or Apex Auto Dealers" : "e.g. Ahmed Al-Balushi or Auto Express LLC"}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                {isDealer ? "Classification" : "Customer Group"}
              </Label>
              {isDealer ? (
                <div className="h-9 px-3 border rounded-md bg-blue-50/60 border-blue-200 flex items-center text-xs font-semibold text-blue-700">
                  Dealer (Wholesale / B2B)
                </div>
              ) : (
                <Select
                  value={form.customer_group}
                  onValueChange={(val) => {
                    if (val === "Dealer") {
                      setPartyType("dealer");
                      setForm({ ...form, customer_group: "Dealer" });
                    } else {
                      setForm({ ...form, customer_group: val });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                    <SelectItem value="Dealer">Dealer (Switch to Dealer)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Credit Limit (OMR)</Label>
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
                placeholder={isDealer ? "e.g. dealer@company.com" : "e.g. customer@example.com"}
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
              />
            </div>
          </div>

          {isDealer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Area / City</Label>
                <Input
                  placeholder="e.g. Ghala Industrial, Muscat"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Commercial / License No</Label>
                <Input
                  placeholder="e.g. CR-9876543"
                  value={form.tax_id}
                  onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
                />
              </div>
            </div>
          )}

          {!isDealer && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Tax ID / VAT No (Optional)</Label>
              <Input
                placeholder="e.g. OM12345678"
                value={form.tax_id}
                onChange={(e) => setForm({ ...form, tax_id: e.target.value })}
              />
            </div>
          )}

          {isDealer && (
            <div className="space-y-1.5 bg-blue-50/40 p-2.5 rounded-md border border-blue-100">
              <Label className="text-xs font-semibold text-blue-900">
                Dealer Portal Password (Optional)
              </Label>
              <Input
                type="password"
                placeholder="Default: dealer123456 (Leave blank for default)"
                className="bg-white"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-[11px] text-blue-600 mt-1">
                Allows the dealer to log in at /dealer/login to view wholesale pricing and track orders.
              </p>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-gray-700">
              {isDealer ? "Detailed Address / Location" : "Address / City"}
            </Label>
            <Textarea
              rows={2}
              placeholder={isDealer ? "Street address, building, or landmark" : "e.g. Al Khuwair, Muscat, Sultanate of Oman"}
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
              className={cn(
                "text-white",
                isDealer ? "bg-blue-600 hover:bg-blue-700" : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isDealer ? "Save Dealer" : "Save Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
