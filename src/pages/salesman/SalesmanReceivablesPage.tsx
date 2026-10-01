import React from "react";
import SalesmanLayout from "./SalesmanLayout";
import ReceivablePartiesView from "@/components/parties/ReceivablePartiesView";

export const SalesmanReceivablesPage: React.FC = () => {
  return (
    <SalesmanLayout>
      <ReceivablePartiesView portalType="salesman" />
    </SalesmanLayout>
  );
};

export default SalesmanReceivablesPage;
