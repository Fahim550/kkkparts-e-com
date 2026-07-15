import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  role: string;
  is_approved: boolean;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
      if (!error && data) {
        setProfile({ ...data, role: "dealer" });
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Error fetching profile", e);
    }
  };

  useEffect(() => {
    try {
      if (!supabase || !supabase.auth) {
        console.error("Supabase client is not initialized.");
        setLoading(false);
        return;
      }
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setProfile(null);
          setLoading(false);
        }
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("AuthContext Error:", error);
      setLoading(false);
    }
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
