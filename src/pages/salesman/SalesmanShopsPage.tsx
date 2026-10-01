import React from "react";
import SalesmanLayout from "./SalesmanLayout";
import SalesmanShopsView from "@/components/salesman/SalesmanShopsView";

export const SalesmanShopsPage: React.FC = () => {
  return (
    <SalesmanLayout>
      <SalesmanShopsView />
    </SalesmanLayout>
  );
};

export default SalesmanShopsPage;
