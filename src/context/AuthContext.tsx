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

  const fetchProfile = async (userId: string, userObj?: User | null) => {
    // If user is a staff/admin, they are not a dealer - skip unnecessary query
    const email = userObj?.email || "";
    if (email.endsWith("@staff.local") || email.endsWith("@kkkparts.com") || userObj?.user_metadata?.role === "Admin") {
      setProfile(null);
      return;
    }

    try {
      // Check cache first
      const cached = sessionStorage.getItem(`dealer_profile_${userId}`);
      if (cached) {
        setProfile(JSON.parse(cached));
      }

      const { data, error } = await supabase
        .from("dealers")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (!error && data) {
        const fullProfile = { ...data, role: "dealer" };
        setProfile(fullProfile);
        try {
          sessionStorage.setItem(`dealer_profile_${userId}`, JSON.stringify(fullProfile));
        } catch {}
      } else {
        setProfile(null);
      }
    } catch (e) {
      console.error("Error fetching profile", e);
      setProfile(null);
    }
  };

  useEffect(() => {
    let isMounted = true;

    try {
      if (!supabase || !supabase.auth) {
        console.error("Supabase client is not initialized.");
        setLoading(false);
        return;
      }

      const handleAuthSession = async (session: Session | null) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id, session.user);
          if (isMounted) setLoading(false);
        } else {
          if (isMounted) {
            setProfile(null);
            setLoading(false);
          }
        }
      };

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        handleAuthSession(session);
      });

      supabase.auth.getSession().then(({ data: { session } }) => {
        handleAuthSession(session);
      }).catch(() => {
        if (isMounted) setLoading(false);
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
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
