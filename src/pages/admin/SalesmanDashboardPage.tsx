import React from "react";
import { Navigate } from "react-router-dom";
import { SalesmanDashboard } from "@/components/salesman/SalesmanDashboard";
import { useAdminAuth } from "@/hooks/useAdminAuth";

const SalesmanDashboardPage: React.FC = () => {
  const { isAdmin } = useAdminAuth();

  // Admin should NEVER see salesman dashboard: redirect directly to Admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <SalesmanDashboard />;
};

export default SalesmanDashboardPage;
