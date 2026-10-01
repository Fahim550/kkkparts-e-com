import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProtectedSalesmanRouteProps {
  children: React.ReactNode;
}

export const ProtectedSalesmanRoute: React.FC<ProtectedSalesmanRouteProps> = ({
  children,
}) => {
  const { user, loading, rolesLoading, isSalesman, isAdmin, isStaff } =
    useAdminAuth();

  if (loading || rolesLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-3" />
          <p className="font-body text-xs text-slate-300">
            Verifying sales portal credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Salesmen and Admins have access to the Salesman Field Portal
  const hasAccess = isSalesman || isAdmin || isStaff;

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-slate-800 p-8 rounded-2xl border border-slate-700 shadow-xl text-white">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="font-heading text-xl font-bold uppercase tracking-wider mb-2">
            Field Portal Restricted
          </h1>
          <p className="font-body text-xs text-slate-400 mb-6">
            Your account is not registered as a field sales representative.
            Please reach out to your administrator to assign the Sales role.
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-500 text-white">
            <Link to="/">Go to Storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedSalesmanRoute;
