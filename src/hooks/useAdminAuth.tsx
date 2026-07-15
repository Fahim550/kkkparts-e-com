import {
  useState,
  useEffect,
  createContext,
  useContext,
  useCallback,
} from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

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
    const [usersRes, rolesRes] = await Promise.all([
      supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .eq("role", "admin")
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle(),
    ]);
    return !!usersRes.data || !!rolesRes.data;
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
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "admin");
      if (count === 0) {
        await supabase
          .from("user_roles")
          .insert({ user_id: data.user.id, role: "admin" } as any);
        setIsAdmin(true);
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
