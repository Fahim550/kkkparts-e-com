import { useAdminAuth } from "@/hooks/useAdminAuth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

const ProtectedAdminRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAdminAuth();
  const [role, setRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Check legacy users table first, then check the new ERP RPC function
      Promise.all([
        supabase.from("users").select("role").eq("id", user.id).maybeSingle(),
        supabase.rpc("has_role", { role_name: "Admin" }),
      ])
        .then(([usersRes, rpcRes]) => {
          const isLegacyAdmin = usersRes.data?.role === "admin";
          const isErpAdmin = rpcRes.data === true;

          if (isLegacyAdmin || isErpAdmin) {
            setRole("admin");
          } else {
            setRole("user");
          }
          setRoleLoading(false);
        })
        .catch((err) => {
          console.error("Error checking roles:", err);
          setRoleLoading(false);
        });
    } else {
      setRoleLoading(false);
    }
  }, [user]);

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            Verifying access...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  if (role !== "admin") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="font-heading text-3xl font-bold uppercase tracking-wider text-foreground mb-4">
            Access Denied
          </h1>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Your account does not have admin privileges. Contact the store owner
            for access.
          </p>
          <button
            onClick={() => (window.location.href = "/")}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-md font-body text-sm font-bold tracking-wider uppercase hover:bg-primary/90 transition-all"
          >
            Go to Store
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
