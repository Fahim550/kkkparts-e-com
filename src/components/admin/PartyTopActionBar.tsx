import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { CustomerService } from "@/modules/customer/application/services/customer.service";
import { SupplierService } from "@/modules/supplier/application/services/supplier.service";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Loader2,
  Truck,
  UserCog,
  UserPlus
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface PartyTopActionBarProps {
  onCustomerCreated?: (customer: any) => void;
  onDealerCreated?: (dealer: any) => void;
  onSupplierCreated?: (supplier: any) => void;
  onUserCreated?: (user: any) => void;
  allowedModes?: ("customer" | "dealer" | "supplier" | "user")[];
  className?: string;
}

export const PartyTopActionBar = ({
  onCustomerCreated,
  onDealerCreated,
  onSupplierCreated,
  onUserCreated,
  allowedModes,
  className = "",
}: PartyTopActionBarProps) => {
  const queryClient = useQueryClient();

  // Modal open states
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [dealerModalOpen, setDealerModalOpen] = useState(false);
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [userModalOpen, setUserModalOpen] = useState(false);

  // Loading states
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [savingDealer, setSavingDealer] = useState(false);
  const [savingSupplier, setSavingSupplier] = useState(false);
  const [savingUser, setSavingUser] = useState(false);

  // Form states
  const [customerForm, setCustomerForm] = useState({
    name: "",
    customer_group: "Retail",
    contact_phone: "",
    contact_email: "",
    tax_id: "",
    credit_limit: "0",
    billing_address: "",
    shipping_address: "",
  });

  const [dealerForm, setDealerForm] = useState({
    name: "",
    contact_person: "",
    contact_phone: "",
    contact_email: "",
    area: "",
    license_number: "",
    credit_limit: "0",
    billing_address: "",
    password: "",
  });

  const [supplierForm, setSupplierForm] = useState({
    name: "",
    contact_phone: "",
    contact_email: "",
    address: "",
    tax_id: "",
  });

  const [userForm, setUserForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "staff",
  });

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

  // 1. Handle Add Customer
  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }

    setSavingCustomer(true);
    try {
      const newCustomer = await CustomerService.createCustomer({
        name: customerForm.name.trim(),
        customer_group: customerForm.customer_group || "Retail",
        contact_phone: customerForm.contact_phone.trim() || null,
        contact_email: customerForm.contact_email.trim() || null,
        tax_id: customerForm.tax_id.trim() || null,
        credit_limit: Number(customerForm.credit_limit) || 0,
        billing_address: customerForm.billing_address.trim() || null,
        shipping_address: customerForm.shipping_address.trim() || null,
        is_active: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["customers"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });

      toast.success(`Customer "${newCustomer.name}" created successfully!`);
      setCustomerModalOpen(false);
      setCustomerForm({
        name: "",
        customer_group: "Retail",
        contact_phone: "",
        contact_email: "",
        tax_id: "",
        credit_limit: "0",
        billing_address: "",
        shipping_address: "",
      });

      if (onCustomerCreated) onCustomerCreated(newCustomer);
    } catch (err: any) {
      console.error("Error creating customer:", err);
      toast.error(err.message || "Failed to create customer");
    } finally {
      setSavingCustomer(false);
    }
  };

  // 2. Handle Add Dealer
  const handleCreateDealer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealerForm.name.trim()) {
      toast.error("Dealer / Company name is required");
      return;
    }

    setSavingDealer(true);
    try {
      // Create customer entry with customer_group: 'Dealer' so it appears under Receivable Parties Dealers tab
      const newCustomer = await CustomerService.createCustomer({
        name: dealerForm.name.trim(),
        customer_group: "Dealer",
        contact_phone: dealerForm.contact_phone.trim() || null,
        contact_email: dealerForm.contact_email.trim() || null,
        tax_id: dealerForm.license_number.trim() || null,
        credit_limit: Number(dealerForm.credit_limit) || 0,
        billing_address: (dealerForm.area ? `${dealerForm.area}, ` : "") + (dealerForm.billing_address.trim() || ""),
        is_active: true,
      });

      // If phone or email provided, also register portal dealer in dealers table
      if (dealerForm.password.trim() || dealerForm.contact_email.trim() || dealerForm.contact_phone.trim()) {
        try {
          const tempClient = getTempAuthClient();
          let authEmail = dealerForm.contact_email.trim();
          if (!authEmail) {
            if (dealerForm.contact_phone.trim()) {
              authEmail = `${dealerForm.contact_phone.trim()}@dealer.local`;
            } else {
              authEmail = `${dealerForm.name.replace(/\s+/g, "").toLowerCase()}_${Date.now()}@dealer.local`;
            }
          } else if (!authEmail.includes("@")) {
            authEmail = `${authEmail}@dealer.local`;
          }

          const defaultPassword = dealerForm.password.trim() || "dealer123456";

          const { data: authData } = await tempClient.auth.signUp({
            email: authEmail,
            password: defaultPassword,
            options: {
              data: {
                full_name: dealerForm.name.trim(),
                phone: dealerForm.contact_phone.trim(),
                role: "dealer",
                area: dealerForm.area.trim(),
                license_number: dealerForm.license_number.trim(),
                is_approved: true,
                plain_password: defaultPassword,
              },
            },
          });

          if (authData?.user) {
            await supabase.from("dealers").upsert({
              id: authData.user.id,
              full_name: dealerForm.name.trim(),
              email: authEmail,
              phone: dealerForm.contact_phone.trim(),
              area: dealerForm.area.trim(),
              license_number: dealerForm.license_number.trim(),
              is_approved: true,
              plain_password: defaultPassword,
            });

            // Also explicitly record dealer role in users table
            try {
              await supabase.from("users").upsert({
                id: authData.user.id,
                role: "dealer",
              });
            } catch (uErr) {
              console.warn("Could not upsert into users table:", uErr);
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

      toast.success(`Dealer "${dealerForm.name}" created successfully!`);
      setDealerModalOpen(false);
      setDealerForm({
        name: "",
        contact_person: "",
        contact_phone: "",
        contact_email: "",
        area: "",
        license_number: "",
        credit_limit: "0",
        billing_address: "",
        password: "",
      });

      if (onDealerCreated) onDealerCreated(newCustomer);
    } catch (err: any) {
      console.error("Error creating dealer:", err);
      toast.error(err.message || "Failed to create dealer");
    } finally {
      setSavingDealer(false);
    }
  };

  // 3. Handle Add Supplier
  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSavingSupplier(true);
    try {
      const newSupplier = await SupplierService.createSupplier({
        name: supplierForm.name.trim(),
        contact_phone: supplierForm.contact_phone.trim() || null,
        contact_email: supplierForm.contact_email.trim() || null,
        address: supplierForm.address.trim() || null,
        tax_id: supplierForm.tax_id.trim() || null,
        is_active: true,
      });

      await queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      await queryClient.invalidateQueries({ queryKey: ["payable-accounts"] });
      await queryClient.invalidateQueries({ queryKey: ["trial-balance"] });
      await queryClient.invalidateQueries({ queryKey: ["supplier-dues"] });

      toast.success(`Supplier "${newSupplier.name}" created successfully!`);
      setSupplierModalOpen(false);
      setSupplierForm({
        name: "",
        contact_phone: "",
        contact_email: "",
        address: "",
        tax_id: "",
      });

      if (onSupplierCreated) onSupplierCreated(newSupplier);
    } catch (err: any) {
      console.error("Error creating supplier:", err);
      toast.error(err.message || "Failed to create supplier");
    } finally {
      setSavingSupplier(false);
    }
  };

  // 4. Handle Create User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }
    if (!userForm.password.trim() || userForm.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSavingUser(true);
    try {
      const tempClient = getTempAuthClient();
      let authEmail = userForm.email.trim();
      if (!authEmail) {
        if (userForm.phone.trim()) {
          authEmail = `${userForm.phone.trim()}@kkkparts.local`;
        } else {
          authEmail = `${userForm.full_name.replace(/\s+/g, "").toLowerCase()}_${Date.now()}@kkkparts.local`;
        }
      } else if (!authEmail.includes("@")) {
        authEmail = `${authEmail}@kkkparts.local`;
      }

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: authEmail,
        password: userForm.password,
        options: {
          data: {
            full_name: userForm.full_name.trim(),
            phone: userForm.phone.trim(),
            role: userForm.role,
            is_approved: true,
            plain_password: userForm.password,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Upsert into users table
        try {
          await supabase.from("users").upsert({
            id: authData.user.id,
            role: userForm.role,
          });
        } catch (uErr) {
          console.warn("Could not insert to users table:", uErr);
        }

        // If role is dealer, also add to dealers table and create dealer customer record
        if (userForm.role === "dealer") {
          try {
            await supabase.from("dealers").upsert({
              id: authData.user.id,
              full_name: userForm.full_name.trim(),
              email: authEmail,
              phone: userForm.phone.trim(),
              is_approved: true,
              plain_password: userForm.password,
            });
          } catch (dErr) {
            console.warn("Could not insert to dealers table:", dErr);
          }

          try {
            await CustomerService.createCustomer({
              name: userForm.full_name.trim(),
              customer_group: "Dealer",
              contact_phone: userForm.phone.trim() || null,
              contact_email: authEmail || null,
              credit_limit: 0,
              is_active: true,
            });
            await queryClient.invalidateQueries({ queryKey: ["customers"] });
          } catch (cErr) {
            console.warn("Could not create customer record for dealer:", cErr);
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["dealers_list"] });
      await queryClient.invalidateQueries({ queryKey: ["users_list"] });

      toast.success(`User "${userForm.full_name}" (${userForm.role.toUpperCase()}) created successfully!`);
      setUserModalOpen(false);
      setUserForm({
        full_name: "",
        email: "",
        phone: "",
        password: "",
        role: "staff",
      });

      if (onUserCreated) onUserCreated(authData.user);
    } catch (err: any) {
      console.error("Error creating user:", err);
      toast.error(err.message || "Failed to create user");
    } finally {
      setSavingUser(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      {/* Button 1: Add Customer */}
      {(!allowedModes || allowedModes.includes("customer")) && (
        <Button
          type="button"
          onClick={() => setCustomerModalOpen(true)}
          className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-full h-9 px-3.5 text-xs font-semibold shadow-none transition-all flex items-center gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5 text-emerald-600" />
          Add Customer
        </Button>
      )}

      {/* Button 2: Add Dealer */}
      {(!allowedModes || allowedModes.includes("dealer")) && (
        <Button
          type="button"
          onClick={() => setDealerModalOpen(true)}
          className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 rounded-full h-9 px-3.5 text-xs font-semibold shadow-none transition-all flex items-center gap-1.5"
        >
          <Building2 className="w-3.5 h-3.5 text-blue-600" />
          Add Dealer
        </Button>
      )}

      {/* Button 3: Add Supplier */}
      {(!allowedModes || allowedModes.includes("supplier")) && (
        <Button
          type="button"
          onClick={() => setSupplierModalOpen(true)}
          className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 rounded-full h-9 px-3.5 text-xs font-semibold shadow-none transition-all flex items-center gap-1.5"
        >
          <Truck className="w-3.5 h-3.5 text-amber-600" />
          Add Supplier
        </Button>
      )}

      {/* Button 4: Create User */}
      {(!allowedModes || allowedModes.includes("user")) && (
        <Button
          type="button"
          onClick={() => setUserModalOpen(true)}
          className="bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-full h-9 px-3.5 text-xs font-semibold shadow-none transition-all flex items-center gap-1.5"
        >
          <UserCog className="w-3.5 h-3.5 text-purple-600" />
          Create User
        </Button>
      )}

      {/* -------------------- MODAL 1: ADD CUSTOMER -------------------- */}
      <Dialog open={customerModalOpen} onOpenChange={setCustomerModalOpen}>
        <DialogContent className="sm:max-w-[540px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <UserPlus className="w-5 h-5 text-emerald-600" />
              Add New Customer
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Register a new client with Accounts Receivable tracking.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Customer Name <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Ahmed Al-Balushi or Auto Express LLC"
                value={customerForm.name}
                onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Customer Group</Label>
                <Select
                  value={customerForm.customer_group}
                  onValueChange={(val) => setCustomerForm({ ...customerForm, customer_group: val })}
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
                <Label className="text-xs font-semibold text-gray-700">Credit Limit (OMR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={customerForm.credit_limit}
                  onChange={(e) => setCustomerForm({ ...customerForm, credit_limit: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Contact Phone</Label>
                <Input
                  placeholder="e.g. 96891234567"
                  value={customerForm.contact_phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, contact_phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
                <Input
                  type="email"
                  placeholder="e.g. customer@example.com"
                  value={customerForm.contact_email}
                  onChange={(e) => setCustomerForm({ ...customerForm, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Tax ID / VAT No (Optional)</Label>
              <Input
                placeholder="e.g. OM12345678"
                value={customerForm.tax_id}
                onChange={(e) => setCustomerForm({ ...customerForm, tax_id: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Address / City</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Al Khuwair, Muscat, Sultanate of Oman"
                value={customerForm.billing_address}
                onChange={(e) => setCustomerForm({ ...customerForm, billing_address: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCustomerModalOpen(false)}
                disabled={savingCustomer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingCustomer}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {savingCustomer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Customer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------- MODAL 2: ADD DEALER -------------------- */}
      <Dialog open={dealerModalOpen} onOpenChange={setDealerModalOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <Building2 className="w-5 h-5 text-blue-600" />
              Add New Dealer
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Register a wholesale dealer with dedicated receivable account & portal login.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateDealer} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Dealer / Workshop / Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Al-Futtaim Workshop or Apex Auto Dealers"
                value={dealerForm.name}
                onChange={(e) => setDealerForm({ ...dealerForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Contact Phone</Label>
                <Input
                  placeholder="e.g. 96898765432"
                  value={dealerForm.contact_phone}
                  onChange={(e) => setDealerForm({ ...dealerForm, contact_phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
                <Input
                  type="email"
                  placeholder="e.g. dealer@company.com"
                  value={dealerForm.contact_email}
                  onChange={(e) => setDealerForm({ ...dealerForm, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Area / City</Label>
                <Input
                  placeholder="e.g. Ghala Industrial, Muscat"
                  value={dealerForm.area}
                  onChange={(e) => setDealerForm({ ...dealerForm, area: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Commercial / License No</Label>
                <Input
                  placeholder="e.g. CR-9876543"
                  value={dealerForm.license_number}
                  onChange={(e) => setDealerForm({ ...dealerForm, license_number: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Credit Limit (OMR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  placeholder="0.000"
                  value={dealerForm.credit_limit}
                  onChange={(e) => setDealerForm({ ...dealerForm, credit_limit: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Portal Password (Optional)
                </Label>
                <Input
                  type="password"
                  placeholder="Leave empty for auto: dealer123456"
                  value={dealerForm.password}
                  onChange={(e) => setDealerForm({ ...dealerForm, password: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Detailed Address</Label>
              <Textarea
                rows={2}
                placeholder="Street address, building, or landmark"
                value={dealerForm.billing_address}
                onChange={(e) => setDealerForm({ ...dealerForm, billing_address: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDealerModalOpen(false)}
                disabled={savingDealer}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingDealer}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {savingDealer && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Dealer
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------- MODAL 3: ADD SUPPLIER -------------------- */}
      <Dialog open={supplierModalOpen} onOpenChange={setSupplierModalOpen}>
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
          <form onSubmit={handleCreateSupplier} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Supplier / Company Name <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Al-Maha Auto Parts Suppliers"
                value={supplierForm.name}
                onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Phone Number</Label>
                <Input
                  placeholder="e.g. 96893456789"
                  value={supplierForm.contact_phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_phone: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
                <Input
                  type="email"
                  placeholder="e.g. sales@vendor.com"
                  value={supplierForm.contact_email}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contact_email: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Tax ID / VAT Registration No</Label>
              <Input
                placeholder="e.g. OM-VAT-12345"
                value={supplierForm.tax_id}
                onChange={(e) => setSupplierForm({ ...supplierForm, tax_id: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">Address / Location</Label>
              <Textarea
                rows={2}
                placeholder="Warehouse address, industrial zone, city"
                value={supplierForm.address}
                onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSupplierModalOpen(false)}
                disabled={savingSupplier}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingSupplier}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {savingSupplier && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Supplier
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* -------------------- MODAL 4: CREATE USER -------------------- */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
              <UserCog className="w-5 h-5 text-purple-600" />
              Create System User
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Create an administrative, staff, or dealer account with role permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-gray-700">
                Full Name <span className="text-red-500">*</span>
              </Label>
              <Input
                required
                placeholder="e.g. Salim Al-Harthy"
                value={userForm.full_name}
                onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Email / Username <span className="text-red-500">*</span>
                </Label>
                <Input
                  required
                  placeholder="e.g. salim@store.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Phone</Label>
                <Input
                  placeholder="e.g. 96895551234"
                  value={userForm.phone}
                  onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-gray-700">Role</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(val) => setUserForm({ ...userForm, role: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff / Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                    <SelectItem value="cashier">Cashier / POS</SelectItem>
                    <SelectItem value="dealer">Dealer</SelectItem>
                    <SelectItem value="user">Regular User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setUserModalOpen(false)}
                disabled={savingUser}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingUser}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {savingUser && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create User
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PartyTopActionBar;
