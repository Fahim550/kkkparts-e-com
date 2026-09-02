import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, Filter, FileSpreadsheet, Printer, Edit, MoreVertical, Phone, Building2 } from "lucide-react";
import { useSuppliers, useSupplierHistory, useSupplierDues } from "@/modules/supplier/presentation/hooks/useSuppliers";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PayablePartiesPage = () => {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "due";

  const { suppliers = [], isLoading: loadingSuppliers } = useSuppliers();
  const { data: trialBalance = [], isLoading: loadingTb } = useTrialBalance();
  const { data: supplierDueMap = {}, isLoading: loadingDues } = useSupplierDues();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"due" | "all">(
    defaultTab === "all" ? "all" : "due"
  );

  const partiesWithBalance = useMemo(() => {
    if (!suppliers) return [];

    const parties = suppliers.map((s: any) => {
      const tbAccount = (trialBalance || []).find((t: any) => t.account_id === s.payable_account_id);
      const tbBal = Number(tbAccount?.balance || 0);
      const txDue = Number(supplierDueMap[s.id] || 0);
      const balance = tbBal > 0 ? tbBal : txDue;
      return {
        ...s,
        balance,
      };
    });

    let filtered = parties;
    if (activeTab === "due") {
      filtered = parties.filter((s: any) => s.balance > 0);
    }

    if (searchTerm) {
      filtered = filtered.filter((p: any) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contact_phone && p.contact_phone.includes(searchTerm))
      );
    }

    return filtered;
  }, [suppliers, trialBalance, supplierDueMap, searchTerm, activeTab]);

  const selectedParty = useMemo(() => {
    return partiesWithBalance.find((p: any) => p.id === selectedPartyId) || partiesWithBalance[0];
  }, [partiesWithBalance, selectedPartyId]);

  const { history = [], isLoadingHistory } = useSupplierHistory(selectedParty?.id || "");

  if (loadingSuppliers || loadingTb || loadingDues) {
    return <div className="p-8 flex justify-center text-gray-500">Loading payable parties...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 font-body overflow-hidden">
      {/* Top Navigation / Action Bar */}
      <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center text-gray-800 font-semibold text-lg gap-2">
          Suppliers (Payable) <Search className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/purchases/new">
            <Button className="bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full" variant="ghost">
              <Plus className="w-4 h-4 mr-1" /> Add Purchase
            </Button>
          </Link>
          <Link to="/admin/sales/new">
            <Button className="bg-red-50 text-red-500 hover:bg-red-100 rounded-full" variant="ghost">
              <Plus className="w-4 h-4 mr-1" /> Add Sale
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search Supplier"
                className="pl-9 bg-gray-50 border-gray-200 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Tabs */}
            <div className="flex mt-4 border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "due"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("due");
                  setSelectedPartyId(null);
                }}
              >
                Due Suppliers
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "all"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("all");
                  setSelectedPartyId(null);
                }}
              >
                All Suppliers
              </button>
            </div>

            <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-500 px-2">
              <div className="flex items-center gap-1">
                Name <Filter className="w-3 h-3 text-red-400" />
              </div>
              <div>Due Amount</div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {partiesWithBalance.map((party: any) => (
              <div
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                className={`flex justify-between items-center p-4 cursor-pointer text-sm transition-colors border-l-4 ${
                  selectedParty?.id === party.id
                    ? "bg-blue-50 border-blue-400"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div>
                  <div className="font-medium text-gray-800">{party.name}</div>
                  {party.contact_phone && (
                    <div className="text-xs text-gray-400">{party.contact_phone}</div>
                  )}
                </div>
                <div className={`font-semibold ${party.balance > 0 ? "text-red-500" : "text-gray-400"}`}>
                  OMR {party.balance.toFixed(3)}
                </div>
              </div>
            ))}
            {partiesWithBalance.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">
                {activeTab === "due"
                  ? "No suppliers with due balance found."
                  : "No suppliers found."}
              </div>
            )}
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedParty ? (
            <>
              {/* Selected Supplier Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-800 uppercase">{selectedParty.name}</h2>
                    <Link to="/admin/suppliers">
                      <Edit className="w-4 h-4 text-blue-500 cursor-pointer" />
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                  <div className="text-sm text-gray-800 font-medium flex items-center gap-2">
                    {selectedParty.contact_phone || "N/A"}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Total Due Balance</div>
                    <div className="text-lg font-bold text-red-500">OMR {selectedParty.balance.toFixed(3)}</div>
                  </div>
                  <div className="flex gap-2">
                    {selectedParty.contact_phone && (
                      <a
                        href={`tel:${selectedParty.contact_phone}`}
                        className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600 hover:bg-green-200 transition-colors"
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                      <span className="font-bold text-xs">i</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-100 bg-gray-50">
                  <h3 className="font-semibold text-gray-700">Transactions</h3>
                  <div className="flex gap-3 text-gray-400">
                    <Search className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                    <Printer className="w-5 h-5 cursor-pointer hover:text-gray-600" />
                    <FileSpreadsheet className="w-5 h-5 cursor-pointer hover:text-gray-600 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-6 py-3 font-semibold flex items-center gap-1">
                          Type <Filter className="w-3 h-3 text-gray-300" />
                        </th>
                        <th className="px-6 py-3 font-semibold">
                          Number <Filter className="w-3 h-3 text-gray-300" />
                        </th>
                        <th className="px-6 py-3 font-semibold">
                          Date <Filter className="w-3 h-3 text-gray-300" />
                        </th>
                        <th className="px-6 py-3 font-semibold text-right">
                          Total <Filter className="w-3 h-3 text-gray-300" />
                        </th>
                        <th className="px-6 py-3 font-semibold text-right">
                          Balance Due <Filter className="w-3 h-3 text-gray-300" />
                        </th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingHistory ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            Loading transactions...
                          </td>
                        </tr>
                      ) : history.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No transactions found for this supplier.
                          </td>
                        </tr>
                      ) : (
                        history.map((item: any) => {
                          const balance = item.balance;
                          const dateObj = new Date(item.date);
                          const formattedDate = `${dateObj.getDate().toString().padStart(2, "0")}/${(
                            dateObj.getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}/${dateObj.getFullYear()}`;

                          return (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-700 font-medium">
                                <span
                                  className={`inline-block px-2 py-0.5 rounded text-xs ${
                                    item.type === "Purchase Order"
                                      ? "bg-blue-50 text-blue-700"
                                      : "bg-purple-50 text-purple-700"
                                  }`}
                                >
                                  {item.type}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-gray-700">{item.reference_number || "-"}</td>
                              <td className="px-6 py-4 text-gray-700">{formattedDate}</td>
                              <td className="px-6 py-4 text-right text-gray-700 font-medium">
                                OMR {Number(item.amount || 0).toFixed(3)}
                              </td>
                              <td
                                className={`px-6 py-4 text-right font-medium ${
                                  balance > 0 ? "text-red-500 font-semibold" : "text-emerald-600"
                                }`}
                              >
                                OMR {balance.toFixed(3)}
                              </td>
                              <td className="px-6 py-4 text-gray-400 text-right">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <button className="p-1 hover:bg-gray-100 rounded-full outline-none">
                                      <MoreVertical className="w-4 h-4 text-gray-500 cursor-pointer" />
                                    </button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48 bg-white border border-gray-200">
                                    <DropdownMenuItem asChild>
                                      <Link
                                        to={`/admin/purchases/new?edit=${item.id}&type=${encodeURIComponent(
                                          item.type
                                        )}`}
                                        className="cursor-pointer font-medium text-blue-600"
                                      >
                                        View/Edit (Pay Due)
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-gray-600">
                                      Print
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-gray-600">
                                      Open PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-red-500">
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Building2 className="w-12 h-12 text-gray-300" />
              <div>Select a supplier from the list to view details and transactions</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PayablePartiesPage;
