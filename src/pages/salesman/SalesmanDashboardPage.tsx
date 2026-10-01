import React from "react";
import { SalesmanLayout } from "./SalesmanLayout";
import { SalesmanDashboard } from "@/components/salesman/SalesmanDashboard";

const SalesmanDashboardPage: React.FC = () => {
  return (
    <SalesmanLayout>
      <SalesmanDashboard />
    </SalesmanLayout>
  );
};

export default SalesmanDashboardPage;
