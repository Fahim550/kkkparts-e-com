import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

interface AdminAuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isSalesman: boolean;
  isStaff: boolean;
  userRoles: string[];
  primaryRole: string | null;
  loading: boolean;
  rolesLoading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  refreshRoles: () => Promise<void>;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null; roles?: string[] }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [rolesLoading, setRolesLoading] = useState(false);

  const fetchUserRoles = useCallback(async (userId: string, userObj?: User | null): Promise<string[]> => {
    try {
      const rolesFound = new Set<string>();

      // 0. Check auth metadata if available
      const metaRole =
        userObj?.user_metadata?.role ||
        userObj?.app_metadata?.role ||
        userObj?.user_metadata?.role_name;
      if (metaRole) {
        const lower = String(metaRole).toLowerCase();
        if (lower === "admin") rolesFound.add("Admin");
        else if (lower === "sales" || lower === "salesman") rolesFound.add("Salesman");
        else if (lower === "cashier") rolesFound.add("Cashier");
        else if (lower === "accountant") rolesFound.add("Accountant");
        else if (lower === "warehousemanager") rolesFound.add("WarehouseManager");
        else rolesFound.add(String(metaRole));
      }

      // 1. Fetch from erp_user_roles and erp_roles
      try {
        const { data: erpRolesData } = await supabase
          .from("erp_user_roles")
          .select("role_id, erp_roles(name)")
          .eq("user_id", userId);

        if (erpRolesData && erpRolesData.length > 0) {
          for (const item of erpRolesData as any[]) {
            const roleName = item.erp_roles?.name;
            if (roleName) {
              rolesFound.add(roleName);
            }
          }
        }
      } catch (err) {
        console.warn("Could not query erp_user_roles directly, trying RPC:", err);
      }

      // 2. Check RPC has_role for Admin and Sales if not found yet
      if (!rolesFound.has("Admin") && !rolesFound.has("admin")) {
        try {
          const { data: isAdminRpc } = await supabase.rpc("has_role", { role_name: "Admin" });
          if (isAdminRpc) rolesFound.add("Admin");
        } catch {
          // ignore
        }
      }

      if (!rolesFound.has("Sales") && !rolesFound.has("Salesman")) {
        try {
          const { data: isSalesRpc } = await supabase.rpc("has_role", { role_name: "Sales" });
          if (isSalesRpc) rolesFound.add("Salesman");
        } catch {}
        try {
          const { data: isSalesmanRpc } = await supabase.rpc("has_role", { role_name: "Salesman" });
          if (isSalesmanRpc) rolesFound.add("Salesman");
        } catch {}
      }

      // 3. Check erp_users table (if user exists here, ensure they have at least staff access)
      try {
        const { data: erpUser } = await supabase
          .from("erp_users")
          .select("id, is_active")
          .eq("id", userId)
          .maybeSingle();

        if (erpUser && erpUser.is_active !== false && rolesFound.size === 0) {
          // User is registered in ERP staff table, default to Salesman / Staff
          rolesFound.add("Salesman");
        }
      } catch {
        // ignore
      }

      // 4. Fallback: check legacy users table
      try {
        const { data: legacyUser } = await supabase
          .from("users")
          .select("role")
          .eq("id", userId)
          .maybeSingle();

        if (legacyUser?.role) {
          const lower = legacyUser.role.toLowerCase();
          if (lower === "admin") rolesFound.add("Admin");
          else if (lower === "sales" || lower === "salesman") rolesFound.add("Salesman");
          else rolesFound.add(legacyUser.role);
        }
      } catch {
        // ignore
      }

      // Normalize synonymous roles (Sales and Salesman)
      if (rolesFound.has("Sales") || rolesFound.has("sales")) {
        rolesFound.add("Salesman");
      }
      if (rolesFound.has("admin")) {
        rolesFound.add("Admin");
      }

      return Array.from(rolesFound);
    } catch (e) {
      console.error("Error fetching user roles:", e);
      return [];
    }
  }, []);

  const refreshRoles = useCallback(async () => {
    if (user?.id) {
      setRolesLoading(true);
      const roles = await fetchUserRoles(user.id, user);
      setUserRoles(roles);
      setRolesLoading(false);
    } else {
      setUserRoles([]);
      setRolesLoading(false);
    }
  }, [user, fetchUserRoles]);

  useEffect(() => {
    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      setLoading(false);
      setRolesLoading(false);
    }, 5000);

    // Set up auth listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setRolesLoading(true);
        const roles = await fetchUserRoles(session.user.id, session.user);
        setUserRoles(roles);
        setRolesLoading(false);
        setLoading(false);
      } else {
        setUserRoles([]);
        setRolesLoading(false);
        setLoading(false);
      }
    });

    // Then check existing session
    supabase.auth
      .getSession()
      .then(async ({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setRolesLoading(true);
          const roles = await fetchUserRoles(session.user.id, session.user);
          setUserRoles(roles);
          setRolesLoading(false);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setRolesLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [fetchUserRoles]);

  const hasRole = useCallback(
    (roleName: string): boolean => {
      const lowerTarget = roleName.toLowerCase();
      // Admin has override capability for all roles
      if (userRoles.some((r) => r.toLowerCase() === "admin")) return true;

      // Handle Sales / Salesman synonym
      if (lowerTarget === "sales" || lowerTarget === "salesman") {
        return userRoles.some(
          (r) => r.toLowerCase() === "sales" || r.toLowerCase() === "salesman",
        );
      }

      return userRoles.some((r) => r.toLowerCase() === lowerTarget);
    },
    [userRoles],
  );

  const hasAnyRole = useCallback(
    (roles: string[]): boolean => {
      return roles.some((role) => hasRole(role));
    },
    [hasRole],
  );

  const isAdmin = userRoles.some((r) => r.toLowerCase() === "admin");
  const isSalesman =
    isAdmin ||
    userRoles.some(
      (r) => r.toLowerCase() === "sales" || r.toLowerCase() === "salesman",
    );
  const isStaff =
    userRoles.length > 0 &&
    userRoles.some((r) =>
      [
        "admin",
        "sales",
        "salesman",
        "cashier",
        "warehousemanager",
        "accountant",
        "purchasing",
        "staff",
      ].includes(r.toLowerCase()),
    );

  const primaryRole = (() => {
    if (isAdmin) return "Admin";
    if (userRoles.some((r) => r.toLowerCase() === "sales" || r.toLowerCase() === "salesman")) return "Salesman";
    if (userRoles.some((r) => r.toLowerCase() === "accountant")) return "Accountant";
    if (userRoles.some((r) => r.toLowerCase() === "warehousemanager")) return "Warehouse Manager";
    if (userRoles.some((r) => r.toLowerCase() === "purchasing")) return "Purchasing";
    if (userRoles.some((r) => r.toLowerCase() === "cashier")) return "Cashier";
    return userRoles[0] || null;
  })();

  const signIn = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      setRolesLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setLoading(false);
        setRolesLoading(false);
        return { error: error.message, roles: [] };
      }
      if (data?.user) {
        const roles = await fetchUserRoles(data.user.id, data.user);
        setUserRoles(roles);
        setUser(data.user);
        setSession(data.session);
        setLoading(false);
        setRolesLoading(false);
        return { error: null, roles };
      }
      setLoading(false);
      setRolesLoading(false);
      return { error: null, roles: [] };
    },
    [fetchUserRoles],
  );

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Auto-assign admin role to first user
    if (data.user) {
      const { data: adminRole } = await supabase
        .from("erp_roles")
        .select("id")
        .ilike("name", "admin")
        .maybeSingle();

      if (adminRole) {
        const { count } = await supabase
          .from("erp_user_roles")
          .select("*", { count: "exact", head: true })
          .eq("role_id", adminRole.id);

        if (count === 0) {
          await supabase
            .from("erp_user_roles")
            .insert({ user_id: data.user.id, role_id: adminRole.id } as any);
          setUserRoles(["Admin"]);
        }
      }
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRoles([]);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isSalesman,
        isStaff,
        userRoles,
        primaryRole,
        loading,
        rolesLoading,
        hasRole,
        hasAnyRole,
        refreshRoles,
        signIn,
        signUp,
        signOut,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx)
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
};
