import { useAdminAuth } from "@/hooks/useAdminAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import React from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ProtectedAdminRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, loading, isStaff, isAdmin, hasAnyRole } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
          <p className="font-body text-sm text-muted-foreground">
            Verifying permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // If specific roles are required on top level
  if (allowedRoles && allowedRoles.length > 0) {
    const hasPermission = isAdmin || hasAnyRole(allowedRoles);
    if (!hasPermission) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center max-w-md bg-card p-8 rounded-xl border shadow-sm">
            <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground mb-2">
              Access Restricted
            </h1>
            <p className="font-body text-sm text-muted-foreground mb-6">
              This section requires elevated privileges. Required role: {allowedRoles.join(", ")}.
            </p>
            <div className="flex gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to="/admin">Go to Dashboard</Link>
              </Button>
              <Button asChild>
                <Link to="/">Go to Store</Link>
              </Button>
            </div>
          </div>
        </div>
      );
    }
  }

  // If entering /admin without specific allowedRoles, user must at least be ERP staff or admin
  if (!isAdmin && !isStaff) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md bg-card p-8 rounded-xl border shadow-sm">
          <ShieldAlert className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold uppercase tracking-wider text-foreground mb-2">
            Access Denied
          </h1>
          <p className="font-body text-sm text-muted-foreground mb-6">
            Your account does not have staff or admin privileges for the ERP system.
            Please contact the administrator for an assigned role.
          </p>
          <Button asChild>
            <Link to="/">Return to Storefront</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

/**
 * Route wrapper to restrict specific sub-pages to designated roles (e.g. Accounting for Admin/Accountant only)
 */
export const RequireRole: React.FC<{
  allowedRoles: string[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { isAdmin, hasAnyRole, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
        <span className="text-sm text-muted-foreground">Checking access...</span>
      </div>
    );
  }

  if (!isAdmin && !hasAnyRole(allowedRoles)) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center bg-card border rounded-2xl shadow-sm">
        <div className="w-12 h-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold tracking-tight mb-2">Restricted Access</h2>
        <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
          You do not have the required permissions to view this module. This section is restricted to <strong>{allowedRoles.join(" or ")}</strong>.
        </p>
        <div className="flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/admin">Back to Dashboard</Link>
          </Button>
          <Button asChild>
            <Link to="/admin/pos">Open POS Terminal</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedAdminRoute;
