import { useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search, Plus, Filter, FileSpreadsheet, Printer, Edit, MoreVertical, Phone } from "lucide-react";
import { useCustomers, useCustomerHistory } from "@/modules/customer/presentation/hooks/useCustomers";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ReceivablePartiesPage = () => {
  const [searchParams] = useSearchParams();
  const defaultType = searchParams.get("type") || "all";
  
  const { customers = [], isLoading: loadingCustomers } = useCustomers();
  const { data: trialBalance = [], isLoading: loadingTb } = useTrialBalance();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartyId, setSelectedPartyId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"customer" | "dealer">(
    defaultType === "dealer" ? "dealer" : "customer"
  );

  const partiesWithBalance = useMemo(() => {
    if (!customers || !trialBalance) return [];
    
    let filtered = customers;

    if (activeTab === "customer") {
      filtered = customers.filter((c: any) => c.customer_group !== 'Dealer');
    } else if (activeTab === "dealer") {
      filtered = customers.filter((c: any) => c.customer_group === 'Dealer');
    }

    const parties = filtered.map((c: any) => {
      const tbAccount = trialBalance.find((t: any) => t.account_id === c.receivable_account_id);
      return {
        ...c,
        balance: Number(tbAccount?.balance || 0),
      };
    }).filter((c: any) => c.balance > 0);

    if (searchTerm) {
      return parties.filter((p: any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    return parties;
  }, [customers, trialBalance, searchTerm, activeTab]);

  const selectedParty = useMemo(() => {
    return partiesWithBalance.find((p: any) => p.id === selectedPartyId) || partiesWithBalance[0];
  }, [partiesWithBalance, selectedPartyId]);

  const { history = [], isLoadingHistory } = useCustomerHistory(selectedParty?.id || "");

  if (loadingCustomers || loadingTb) {
    return <div className="p-8 flex justify-center">Loading parties...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-slate-50 font-body overflow-hidden">
      {/* Top Navigation / Action Bar */}
      <div className="flex justify-between items-center bg-white px-6 py-4 border-b border-gray-200">
        <div className="flex items-center text-gray-800 font-semibold text-lg gap-2">
          Customers & Dealers <Search className="w-4 h-4 text-gray-400" />
        </div>
        <div className="flex items-center gap-3">
          <Link to="/admin/sales/new">
            <Button className="bg-red-50 text-red-500 hover:bg-red-100 rounded-full" variant="ghost">
              <Plus className="w-4 h-4 mr-1" /> Add Sale
            </Button>
          </Link>
          <Link to="/admin/purchase/new">
            <Button className="bg-blue-50 text-blue-500 hover:bg-blue-100 rounded-full" variant="ghost">
              <Plus className="w-4 h-4 mr-1" /> Add Purchase
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
                placeholder="Search Customer or Dealer"
                className="pl-9 bg-gray-50 border-gray-200 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Tabs */}
            <div className="flex mt-4 border-b border-gray-200">
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "customer"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("customer");
                  setSelectedPartyId(null);
                }}
              >
                Customers
              </button>
              <button
                className={`flex-1 py-2 text-sm font-medium text-center border-b-2 transition-colors ${
                  activeTab === "dealer"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                onClick={() => {
                  setActiveTab("dealer");
                  setSelectedPartyId(null);
                }}
              >
                Dealers
              </button>
            </div>

            <div className="flex justify-between items-center mt-4 text-xs font-semibold text-gray-500 px-2">
              <div className="flex items-center gap-1">Name <Filter className="w-3 h-3 text-red-400" /></div>
              <div>Amount</div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {partiesWithBalance.map((party: any) => (
              <div
                key={party.id}
                onClick={() => setSelectedPartyId(party.id)}
                className={`flex justify-between items-center p-4 cursor-pointer text-sm transition-colors border-l-4 ${
                  (selectedParty?.id === party.id)
                    ? "bg-blue-50 border-blue-400"
                    : "border-transparent hover:bg-gray-50"
                }`}
              >
                <div className="font-medium text-gray-800">{party.name}</div>
                <div className="text-green-500 font-semibold">{party.balance.toFixed(3)}</div>
              </div>
            ))}
            {partiesWithBalance.length === 0 && (
              <div className="p-8 text-center text-gray-500 text-sm">No customers or dealers with due balance found.</div>
            )}
          </div>
        </div>

        {/* Right Main Area */}
        <div className="flex-1 bg-white flex flex-col overflow-hidden">
          {selectedParty ? (
            <>
              {/* Selected Party Header */}
              <div className="p-6 border-b border-gray-200 flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-gray-800 uppercase">{selectedParty.name}</h2>
                    <Edit className="w-4 h-4 text-blue-500 cursor-pointer" />
                  </div>
                  <div className="text-sm text-gray-500">Phone Number</div>
                  <div className="text-sm text-gray-800 font-medium flex items-center gap-2">
                    {selectedParty.contact_phone || "N/A"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
                    <span className="font-bold text-xs">i</span>
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
                        <th className="px-6 py-3 font-semibold flex items-center gap-1">Type <Filter className="w-3 h-3 text-gray-300" /></th>
                        <th className="px-6 py-3 font-semibold">Number <Filter className="w-3 h-3 text-gray-300" /></th>
                        <th className="px-6 py-3 font-semibold">Date <Filter className="w-3 h-3 text-gray-300" /></th>
                        <th className="px-6 py-3 font-semibold text-right">Total <Filter className="w-3 h-3 text-gray-300" /></th>
                        <th className="px-6 py-3 font-semibold text-right">Balance <Filter className="w-3 h-3 text-gray-300" /></th>
                        <th className="px-6 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingHistory ? (
                        <tr><td colSpan={6} className="text-center py-8">Loading history...</td></tr>
                      ) : history.length === 0 ? (
                        <tr><td colSpan={6} className="text-center py-8 text-gray-500">No transactions found.</td></tr>
                      ) : (
                        history.map((item: any) => {
                          const isPaid = item.status?.toLowerCase() === 'paid';
                          const balance = isPaid ? 0 : Number(item.amount || 0);
                          const dateObj = new Date(item.date);
                          const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth()+1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
                          
                          return (
                            <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-6 py-4 text-gray-700">{item.type}</td>
                              <td className="px-6 py-4 text-gray-700">{item.reference_number || '-'}</td>
                              <td className="px-6 py-4 text-gray-700">{formattedDate}</td>
                              <td className="px-6 py-4 text-right text-gray-700 font-medium">OMR {Number(item.amount || 0).toFixed(3)}</td>
                              <td className="px-6 py-4 text-right text-gray-700 font-medium">OMR {balance.toFixed(3)}</td>
                              <td className="px-6 py-4 text-gray-400 text-right"><MoreVertical className="w-4 h-4 inline-block cursor-pointer" /></td>
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
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select a customer or dealer from the list to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReceivablePartiesPage;
