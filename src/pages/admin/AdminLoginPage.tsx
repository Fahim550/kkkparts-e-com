import { Input } from "@/components/ui/input";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useSettings } from "@/hooks/useDatabase";
import { supabase } from "@/lib/supabase";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const AdminLoginPage = () => {
  const {
    signIn,
    signUp,
    user,
    loading: authLoading,
    rolesLoading,
    isAdmin,
    isStaff,
    userRoles,
  } = useAdminAuth();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: settings } = useSettings();
  const s = Array.isArray(settings) ? settings[0] || {} : settings || {};
  const logoUrl = s?.logo_url || "/logo.png";

  useEffect(() => {
    // Only check once both auth and roles have finished loading
    if (authLoading || rolesLoading) return;
    if (user) {
      if (isAdmin || isStaff) {
        navigate("/admin", { replace: true });
      } else if (!isSignUp && userRoles.length === 0) {
        toast.error("You do not have staff or admin privileges.");
        supabase.auth.signOut();
      }
    }
  }, [user, authLoading, rolesLoading, isAdmin, isStaff, userRoles, navigate, isSignUp]);

  useEffect(() => {
    if (s?.favicon_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = s.favicon_url;
    }
    if (s?.site_name) {
      document.title = `${s.site_name} - Admin Login`;
    }
  }, [s?.favicon_url, s?.site_name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        let authEmail = email.trim();
        if (!authEmail.includes("@")) {
          authEmail = `${authEmail.replace(/\s+/g, "").replace(/-/g, "")}@staff.local`;
        }
        const { error } = await signUp(authEmail, password);
        if (error) {
          toast.error(error);
        } else {
          toast.success("Account created! Please wait for admin approval.");
        }
      } else {
        let authEmail = email.trim();
        let res: { error: string | null; roles?: string[] };

        if (!authEmail.includes("@")) {
          // Input is a mobile number or phone ID
          const cleanPhone = authEmail.replace(/\s+/g, "").replace(/-/g, "");
          res = await signIn(`${cleanPhone}@staff.local`, password);
          if (res.error) {
            // Try dealer format fallback
            res = await signIn(`${cleanPhone}@dealer.local`, password);
          }
        } else {
          res = await signIn(authEmail, password);
        }

        if (res.error) {
          toast.error(res.error);
          return;
        }

        const userRolesList = res.roles || [];
        const hasStaffRole = userRolesList.some((r) =>
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

        if (hasStaffRole) {
          toast.success("Welcome back!");
          navigate("/admin", { replace: true });
        } else {
          toast.error("You do not have staff or admin privileges.");
          await supabase.auth.signOut();
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logoUrl}
            alt="Store Logo"
            className="h-16 mx-auto mb-4 object-contain"
          />
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground">
            {s?.site_name || "Store"} Admin
          </h1>
          <p className="font-body text-sm text-muted-foreground mt-1">
            {isSignUp
              ? "Create your admin account"
              : "Sign in with your Mobile Number or Email"}
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Mobile Number or Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. 017xxxxxxxx or admin@kkkparts.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-body text-xs uppercase tracking-wider text-muted-foreground mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading
                ? "Please wait..."
                : isSignUp
                  ? "Create Admin Account"
                  : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="font-body text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isSignUp
                ? "Already have an account? Sign in"
                : "First time? Create admin account"}
            </button>
          </div>
        </div>

        <p className="text-center font-body text-xs text-muted-foreground mt-6">
          Protected area — authorized access only
        </p>
      </div>
    </div>
  );
};

export default AdminLoginPage;
