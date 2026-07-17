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
  loading: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ error: string | null }>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminRole = useCallback(async (userId: string) => {
    try {
      const { data: adminRole } = await supabase
        .from("erp_roles")
        .select("id")
        .eq("name", "admin")
        .maybeSingle();

      if (!adminRole) return false;

      const { data: userRole } = await supabase
        .from("erp_user_roles")
        .select("role_id")
        .eq("user_id", userId)
        .eq("role_id", adminRole.id)
        .maybeSingle();

      return !!userRole;
    } catch (e) {
      console.error("Error checking admin role:", e);
      return false;
    }
  }, []);

  useEffect(() => {
    // Safety timeout - never stay loading forever
    const timeout = setTimeout(() => {
      setLoading(false);
    }, 5000);

    // Set up auth listener FIRST
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setTimeout(async () => {
          const admin = await checkAdminRole(session.user.id);
          setIsAdmin(admin);
          setLoading(false);
        }, 0);
      } else {
        setIsAdmin(false);
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
          const admin = await checkAdminRole(session.user.id);
          setIsAdmin(admin);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [checkAdminRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    // Auto-assign admin role to first user
    if (data.user) {
      // Check if any admin exists
      const { data: adminRole } = await supabase
        .from("erp_roles")
        .select("id")
        .eq("name", "admin")
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
          setIsAdmin(true);
        }
      }
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{ user, session, isAdmin, loading, signIn, signUp, signOut }}
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
