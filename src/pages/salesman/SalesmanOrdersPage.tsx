import React from "react";
import SalesmanLayout from "./SalesmanLayout";
import SalesmanOrdersView from "@/components/salesman/SalesmanOrdersView";

export const SalesmanOrdersPage: React.FC = () => {
  return (
    <SalesmanLayout>
      <SalesmanOrdersView />
    </SalesmanLayout>
  );
};

export default SalesmanOrdersPage;
