import React from "react";
import SalesmanLayout from "./SalesmanLayout";
import PosTerminal from "@/modules/pos/presentation/pages/PosTerminal";

export const SalesmanPosPage: React.FC = () => {
  return (
    <SalesmanLayout>
      <div className="flex-1 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
        <PosTerminal />
      </div>
    </SalesmanLayout>
  );
};

export default SalesmanPosPage;
