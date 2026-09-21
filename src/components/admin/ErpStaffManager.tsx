import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  Shield,
  Plus,
  Search,
  Phone,
  Mail,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ErpStaffUser {
  id: string;
  email: string | null;
  full_name: string | null;
  phone?: string | null;
  is_active: boolean | null;
  created_at: string | null;
  roles: { id: string; name: string }[];
}

interface ErpRole {
  id: string;
  name: string;
}

export const ErpStaffManager = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"new" | "existing">("new");

  const [newStaffData, setNewStaffData] = useState({
    full_name: "",
    phone: "",
    email: "",
    password: "",
    role_name: "Salesman",
  });

  const [existingUserSelection, setExistingUserSelection] = useState({
    userId: "",
    role_name: "Salesman",
  });

  // 1. Fetch available ERP roles
  const { data: roles = [] } = useQuery<ErpRole[]>({
    queryKey: ["erp_roles_list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("erp_roles")
        .select("id, name")
        .order("name", { ascending: true });

      if (error || !data || data.length === 0) {
        return [
          { id: "1", name: "Admin" },
          { id: "2", name: "Salesman" },
          { id: "3", name: "Accountant" },
          { id: "4", name: "WarehouseManager" },
          { id: "5", name: "Cashier" },
        ];
      }
      return data as ErpRole[];
    },
  });

  // 2. Fetch existing registered dealers / users for assignment
  const { data: existingAccounts = [] } = useQuery({
    queryKey: ["all_existing_accounts_for_roles"],
    queryFn: async () => {
      try {
        const { data: dealersData } = await supabase
          .from("dealers")
          .select("id, email, full_name, phone");

        return (dealersData || []).map((d) => ({
          id: d.id,
          name: d.full_name || "Unnamed",
          identifier: d.phone || d.email || d.id,
        }));
      } catch {
        return [];
      }
    },
  });

  // 3. Fetch ERP Staff users with their roles
  const {
    data: staffList = [],
    isLoading,
    refetch,
  } = useQuery<ErpStaffUser[]>({
    queryKey: ["erp_staff_users"],
    queryFn: async () => {
      try {
        const { data: erpUsersData } = await supabase
          .from("erp_users")
          .select("*")
          .order("created_at", { ascending: false });

        const { data: userRolesData } = await supabase
          .from("erp_user_roles")
          .select("user_id, role_id, erp_roles(id, name)");

        const rolesByUserId = new Map<string, { id: string; name: string }[]>();
        if (userRolesData) {
          for (const item of userRolesData as any[]) {
            const current = rolesByUserId.get(item.user_id) || [];
            if (item.erp_roles) {
              current.push({
                id: item.erp_roles.id,
                name: item.erp_roles.name,
              });
            }
            rolesByUserId.set(item.user_id, current);
          }
        }

        if (erpUsersData && erpUsersData.length > 0) {
          return erpUsersData.map((u) => {
            const rawEmail = u.email || "";
            const isPhoneAuth = rawEmail.endsWith("@staff.local") || rawEmail.endsWith("@dealer.local");
            const phone = isPhoneAuth ? rawEmail.split("@")[0] : null;

            return {
              id: u.id,
              email: isPhoneAuth ? null : u.email,
              phone: phone,
              full_name: u.full_name,
              is_active: u.is_active ?? true,
              created_at: u.created_at,
              roles: rolesByUserId.get(u.id) || [],
            };
          });
        }

        return [];
      } catch (err) {
        console.error("Error fetching staff list:", err);
        return [];
      }
    },
  });

  // 4. Mutation to assign or change role
  const updateRoleMutation = useMutation({
    mutationFn: async ({
      userId,
      roleId,
    }: {
      userId: string;
      roleId: string;
    }) => {
      await supabase.from("erp_user_roles").delete().eq("user_id", userId);
      const { error } = await supabase
        .from("erp_user_roles")
        .insert({ user_id: userId, role_id: roleId });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff role updated successfully");
      queryClient.invalidateQueries({ queryKey: ["erp_staff_users"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to update role");
    },
  });

  // 5. Assign role to existing user
  const assignExistingUserMutation = useMutation({
    mutationFn: async ({
      userId,
      roleName,
    }: {
      userId: string;
      roleName: string;
    }) => {
      const selectedAccount = existingAccounts.find((a) => a.id === userId);
      if (!selectedAccount) throw new Error("Please select an existing account");

      await supabase.from("erp_users").upsert({
        id: selectedAccount.id,
        email: selectedAccount.identifier.includes("@")
          ? selectedAccount.identifier
          : `${selectedAccount.identifier}@dealer.local`,
        full_name: selectedAccount.name,
        is_active: true,
      });

      const targetRole = roles.find(
        (r) =>
          r.name.toLowerCase() === roleName.toLowerCase() ||
          (roleName.toLowerCase() === "salesman" &&
            r.name.toLowerCase() === "sales"),
      );

      if (!targetRole) throw new Error("Selected role not found");

      await supabase.from("erp_user_roles").delete().eq("user_id", userId);
      const { error } = await supabase.from("erp_user_roles").insert({
        user_id: userId,
        role_id: targetRole.id,
      });

      if (error) throw error;
      return selectedAccount;
    },
    onSuccess: (acc) => {
      toast.success(`Assigned role to ${acc.name}!`);
      setIsCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ["erp_staff_users"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to assign role");
    },
  });

  // 6. Create new staff member with Mobile Number
  const createStaffMutation = useMutation({
    mutationFn: async (formData: typeof newStaffData) => {
      const cleanPhone = formData.phone.trim().replace(/\s+/g, "").replace(/-/g, "");
      if (!cleanPhone && !formData.email.trim()) {
        throw new Error("Please provide a mobile number or email address");
      }

      // If mobile number is provided, use cleanPhone@staff.local as the login email
      const authEmail = cleanPhone
        ? `${cleanPhone}@staff.local`
        : formData.email.trim().toLowerCase();

      const fullName = formData.full_name.trim();
      const password = formData.password.trim();
      const roleName = formData.role_name;

      // Check if user is already in erp_users
      const { data: existingUser } = await supabase
        .from("erp_users")
        .select("id")
        .eq("email", authEmail)
        .maybeSingle();

      if (existingUser) {
        const targetRole = roles.find(
          (r) =>
            r.name.toLowerCase() === roleName.toLowerCase() ||
            (roleName.toLowerCase() === "salesman" &&
              r.name.toLowerCase() === "sales"),
        );
        if (targetRole) {
          await supabase.from("erp_user_roles").delete().eq("user_id", existingUser.id);
          await supabase.from("erp_user_roles").insert({
            user_id: existingUser.id,
            role_id: targetRole.id,
          });
        }
        return { success: true };
      }

      // 1. Try direct Postgres RPC function first (bypasses Supabase SMTP & rate limits)
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "admin_create_staff_user",
          {
            p_email: authEmail,
            p_password: password,
            p_full_name: fullName,
            p_role_name: roleName,
          }
        );

        if (!rpcError && rpcData?.success) {
          return rpcData;
        }
      } catch {
        // Fall back to client-side auth.signUp if RPC function is not installed yet
      }

      // 2. Fallback: Create user using client-side auth.signUp
      const supabaseUrl =
        import.meta.env.VITE_SUPABASE_URL || "https://placeholder.supabase.co";
      const supabaseKey =
        import.meta.env.VITE_SUPABASE_ANON_KEY ||
        import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        "placeholder-key";

      const tempClient = createClient(supabaseUrl, supabaseKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      });

      const { data: authData, error: authError } = await tempClient.auth.signUp({
        email: authEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            phone: cleanPhone,
            role: roleName.toLowerCase(),
          },
        },
      });

      if (authError) {
        if (
          authError.message?.toLowerCase().includes("rate limit") ||
          authError.status === 429
        ) {
          throw new Error(
            "Supabase email rate limit reached. To allow instant staff accounts without emails, please turn OFF 'Confirm email' in Supabase Dashboard (Auth -> Providers -> Email) or run the SQL migration."
          );
        }
        throw new Error(authError.message);
      }

      if (!authData?.user) {
        throw new Error(
          "Could not create account. Please ensure 'Confirm email' is turned OFF in Supabase Auth settings.",
        );
      }

      const newUserId = authData.user.id;

      // Upsert into erp_users
      await supabase.from("erp_users").upsert({
        id: newUserId,
        email: authEmail,
        full_name: fullName,
        is_active: true,
      });

      // Assign role in erp_user_roles
      const targetRole = roles.find(
        (r) =>
          r.name.toLowerCase() === roleName.toLowerCase() ||
          (roleName.toLowerCase() === "salesman" &&
            r.name.toLowerCase() === "sales"),
      );

      if (targetRole) {
        await supabase.from("erp_user_roles").upsert({
          user_id: newUserId,
          role_id: targetRole.id,
        });
      }

      return authData;
    },
    onSuccess: () => {
      toast.success("Staff account created successfully!");
      setIsCreateOpen(false);
      setNewStaffData({
        full_name: "",
        phone: "",
        email: "",
        password: "",
        role_name: "Salesman",
      });
      queryClient.invalidateQueries({ queryKey: ["erp_staff_users"] });
      refetch();
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create staff member");
    },
  });

  const filteredStaff = staffList.filter((s) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      s.full_name?.toLowerCase().includes(term) ||
      (s.phone && s.phone.includes(term)) ||
      (s.email && s.email.toLowerCase().includes(term)) ||
      s.roles.some((r) => r.name.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-xs">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            ERP Staff & Role Permissions
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Create staff with mobile number and password, and assign roles (Salesman, Admin, etc.).
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Staff Member
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Add ERP Staff Member</DialogTitle>
            </DialogHeader>

            <Tabs
              value={modalTab}
              onValueChange={(val) => setModalTab(val as "new" | "existing")}
              className="mt-2"
            >
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="new">Create New Account</TabsTrigger>
                <TabsTrigger value="existing">Assign Existing User</TabsTrigger>
              </TabsList>

              <TabsContent value="new">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    createStaffMutation.mutate(newStaffData);
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="full_name">Full Name *</Label>
                    <Input
                      id="full_name"
                      required
                      value={newStaffData.full_name}
                      onChange={(e) =>
                        setNewStaffData({ ...newStaffData, full_name: e.target.value })
                      }
                      placeholder="e.g. Md. Rahim"
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff_phone">Mobile Number (Login ID) *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="staff_phone"
                        type="tel"
                        required
                        value={newStaffData.phone}
                        onChange={(e) =>
                          setNewStaffData({ ...newStaffData, phone: e.target.value })
                        }
                        placeholder="e.g. 01712345678"
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Staff will use this mobile number to log into the ERP.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="staff_password">Login Password *</Label>
                    <Input
                      id="staff_password"
                      type="password"
                      required
                      minLength={6}
                      value={newStaffData.password}
                      onChange={(e) =>
                        setNewStaffData({ ...newStaffData, password: e.target.value })
                      }
                      placeholder="Min 6 characters (e.g. 123456)"
                    />
                  </div>

                  <div>
                    <Label htmlFor="staff_role">Assign Role *</Label>
                    <Select
                      value={newStaffData.role_name}
                      onValueChange={(val) =>
                        setNewStaffData({ ...newStaffData, role_name: val })
                      }
                    >
                      <SelectTrigger id="staff_role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salesman">Salesman (POS & Sales Orders)</SelectItem>
                        <SelectItem value="Admin">Administrator (Full Access)</SelectItem>
                        <SelectItem value="Accountant">Accountant (Financials & Reports)</SelectItem>
                        <SelectItem value="WarehouseManager">Warehouse Manager (Stock & Logistics)</SelectItem>
                        <SelectItem value="Cashier">Cashier (POS Counter Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={createStaffMutation.isPending}
                    >
                      {createStaffMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Create Staff Account
                    </Button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="existing">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!existingUserSelection.userId) {
                      toast.error("Please choose a user first");
                      return;
                    }
                    assignExistingUserMutation.mutate({
                      userId: existingUserSelection.userId,
                      roleName: existingUserSelection.role_name,
                    });
                  }}
                  className="space-y-4"
                >
                  <div>
                    <Label htmlFor="existing_user">Select User / Dealer *</Label>
                    <Select
                      value={existingUserSelection.userId}
                      onValueChange={(val) =>
                        setExistingUserSelection({
                          ...existingUserSelection,
                          userId: val,
                        })
                      }
                    >
                      <SelectTrigger id="existing_user">
                        <SelectValue placeholder="Choose an existing account" />
                      </SelectTrigger>
                      <SelectContent>
                        {existingAccounts.map((acc) => (
                          <SelectItem key={acc.id} value={acc.id}>
                            {acc.name} ({acc.identifier})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      Promote any registered dealer or user to staff with an assigned role.
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="existing_role">Assign Role *</Label>
                    <Select
                      value={existingUserSelection.role_name}
                      onValueChange={(val) =>
                        setExistingUserSelection({
                          ...existingUserSelection,
                          role_name: val,
                        })
                      }
                    >
                      <SelectTrigger id="existing_role">
                        <SelectValue placeholder="Select Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Salesman">Salesman (POS & Sales Orders)</SelectItem>
                        <SelectItem value="Admin">Administrator (Full Access)</SelectItem>
                        <SelectItem value="Accountant">Accountant (Financials & Reports)</SelectItem>
                        <SelectItem value="WarehouseManager">Warehouse Manager (Stock & Logistics)</SelectItem>
                        <SelectItem value="Cashier">Cashier (POS Counter Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={assignExistingUserMutation.isPending}
                    >
                      {assignExistingUserMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      Assign Role to User
                    </Button>
                  </div>
                </form>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-card border rounded-xl px-3 py-2 max-w-md">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, mobile, or role..."
          className="w-full bg-transparent border-none text-sm outline-hidden"
        />
      </div>

      {/* Staff Table */}
      {isLoading ? (
        <div className="py-12 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
          <span className="text-sm text-muted-foreground">Loading staff members...</span>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-12 bg-card border rounded-2xl p-8">
          <UserIcon className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
          <h3 className="font-semibold text-foreground text-base">No staff members found</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
            Click "Add Staff Member" above to create an account with a mobile number and assign the Salesman role.
          </p>
        </div>
      ) : (
        <div className="bg-card border rounded-2xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/40 border-b text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Staff Member</th>
                  <th className="py-3.5 px-4">Mobile / Login ID</th>
                  <th className="py-3.5 px-4">Current Role</th>
                  <th className="py-3.5 px-4">Change Role</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStaff.map((staff) => {
                  const currentRoleName = staff.roles[0]?.name || "None";
                  const isSales =
                    currentRoleName.toLowerCase() === "sales" ||
                    currentRoleName.toLowerCase() === "salesman";
                  const isAdminRole = currentRoleName.toLowerCase() === "admin";

                  return (
                    <tr key={staff.id} className="hover:bg-secondary/20 transition-colors">
                      <td className="py-4 px-4 font-medium text-foreground">
                        {staff.full_name || "Unnamed Staff"}
                      </td>

                      <td className="py-4 px-4">
                        {staff.phone ? (
                          <div className="flex items-center gap-1.5 text-xs font-mono font-medium text-foreground">
                            <Phone className="w-3.5 h-3.5 text-primary" />
                            {staff.phone}
                          </div>
                        ) : staff.email ? (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Mail className="w-3.5 h-3.5" />
                            {staff.email}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <Badge
                          variant="outline"
                          className={
                            isAdminRole
                              ? "bg-blue-50 text-blue-700 border-blue-200 font-semibold"
                              : isSales
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold"
                              : "bg-purple-50 text-purple-700 border-purple-200 font-semibold"
                          }
                        >
                          {isSales ? "Salesman" : currentRoleName}
                        </Badge>
                      </td>

                      <td className="py-4 px-4">
                        <div className="max-w-[200px]">
                          <Select
                            defaultValue={
                              staff.roles[0]?.id ||
                              roles.find(
                                (r) => r.name.toLowerCase() === currentRoleName.toLowerCase(),
                              )?.id
                            }
                            onValueChange={(newRoleId) =>
                              updateRoleMutation.mutate({
                                userId: staff.id,
                                roleId: newRoleId,
                              })
                            }
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select Role" />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name === "Sales" ? "Salesman" : r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        {staff.is_active !== false ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-red-500 font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ErpStaffManager;
