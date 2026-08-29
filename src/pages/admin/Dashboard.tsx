import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Plus
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useOrders, useProducts } from "@/hooks/useDatabase";
import { useTrialBalance } from "@/modules/accounting/presentation/hooks/useAccounting";
import { useCustomers } from "@/modules/customer/presentation/hooks/useCustomers";
import { useInvoices } from "@/modules/purchase/presentation/hooks/useInvoices";
import { useSuppliers } from "@/modules/supplier/presentation/hooks/useSuppliers";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const { data: allOrders = [] } = useOrders();
  const { data: products = [] } = useProducts();
  const { invoices = [] } = useInvoices();
  const { data: trialBalance = [] } = useTrialBalance();
  const { customers = [] } = useCustomers();
  const { suppliers = [] } = useSuppliers();

  // 1. Total Receivable (Due from Customers/Dealers)
  const regularCustomers = customers.filter((c: any) => c.customer_group !== 'Dealer');
  const dealers = customers.filter((c: any) => c.customer_group === 'Dealer');

  const regularCustomerAccountIds = new Set(regularCustomers.map((c: any) => c.receivable_account_id));
  const dealerAccountIds = new Set(dealers.map((c: any) => c.receivable_account_id));

  const regularReceivableAccounts = trialBalance.filter((t: any) => regularCustomerAccountIds.has(t.account_id) && Number(t.balance || 0) > 0);
  const regularReceivable = regularReceivableAccounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);
  const regularReceivableCount = regularReceivableAccounts.length;

  const dealerReceivableAccounts = trialBalance.filter((t: any) => dealerAccountIds.has(t.account_id) && Number(t.balance || 0) > 0);
  const dealerReceivable = dealerReceivableAccounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);
  const dealerReceivableCount = dealerReceivableAccounts.length;

  const totalReceivable = regularReceivable + dealerReceivable;

  // 2. Total Payable (Due to Suppliers)
  const supplierAccountIds = new Set(suppliers.map((s: any) => s.payable_account_id));
  
  const payableAccounts = trialBalance.filter((t: any) => supplierAccountIds.has(t.account_id));
  const totalPayable = payableAccounts.reduce((sum: number, acc: any) => sum + Number(acc.balance || 0), 0);

  let payablePartiesCount = 0;
  if (suppliers) {
    suppliers.forEach((s: any) => {
      const tbAccount = trialBalance.find((t: any) => t.account_id === s.payable_account_id);
      if (tbAccount && Number(tbAccount.balance || 0) > 0) {
        payablePartiesCount++;
      }
    });
  }

  // 3. Sales this month & chart data
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthOrders = allOrders.filter((o: any) => {
    const d = new Date(o.created_at || new Date());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalSaleThisMonth = thisMonthOrders.reduce(
    (sum: number, o: any) => sum + Number(o.total || 0),
    0
  );

  // Group by day for chart
  const salesByDay = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days[d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })] = 0;
    }
    
    thisMonthOrders.forEach((o: any) => {
      const d = new Date(o.created_at || new Date());
      const key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (days[key] !== undefined) {
        days[key] += Number(o.total || 0);
      }
    });

    return Object.entries(days).map(([name, amount]) => ({
      name,
      amount,
    }));
  }, [thisMonthOrders]);

  // 4. Purchases this month
  const thisMonthInvoices = (invoices || []).filter((inv: any) => {
    const d = new Date(inv.invoice_date || new Date());
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const totalPurchasesThisMonth = thisMonthInvoices.reduce(
    (sum: number, inv: any) => sum + Number(inv.total_amount || 0),
    0
  );

  // 5. Expenses
  const expenseAccounts = (trialBalance || []).filter(
    (t: any) => t.account_type === "Expense"
  );
  const totalExpenses = expenseAccounts.reduce(
    (sum: number, acc: any) => sum + Number(acc.balance || 0),
    0
  );

  // 6. Cash in Hand
  const cashAccounts = (trialBalance || []).filter(
    (t: any) =>
      t.account_name?.toLowerCase().includes("cash") ||
      t.account_name?.toLowerCase().includes("bank")
  );
  const cashInHand = cashAccounts.reduce(
    (sum: number, acc: any) => sum + Number(acc.balance || 0),
    0
  );

  // 7. Stock Value and Low Stocks
  const stockValue = products.reduce((sum: number, p: any) => {
    const cost = Number(p.cost_price || 0);
    const totalStock = (p.product_variations || []).reduce((varSum: number, pv: any) => {
      const balance = (pv.stock_balances || []).reduce((balSum: number, sb: any) => balSum + Number(sb.stock_level || 0), 0);
      return varSum + balance;
    }, 0);
    return sum + (cost * totalStock);
  }, 0);

  const lowStockThreshold = 5;
  const lowStockItems = products
    .map((p: any) => {
      const level = (p.product_variations || []).reduce((varSum: number, pv: any) => {
        return varSum + (pv.stock_balances || []).reduce((balSum: number, sb: any) => balSum + Number(sb.stock_level || 0), 0);
      }, 0);
      return {
        name: p.name,
        stock_level: level,
      };
    })
    .filter((p: any) => p.stock_level <= lowStockThreshold)
    .sort((a: any, b: any) => a.stock_level - b.stock_level)
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 font-body">
      {/* Main Content Grid */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Column */}
        <div className="flex-1 flex flex-col border-r border-gray-200">
          {/* Top Row: Receivable & Payable */}
          <div className="grid grid-cols-2 bg-white border-b border-gray-200">
            <Link to="/admin/receivable-parties" className="p-6 border-r border-gray-200 relative block hover:bg-gray-50 transition-colors group">
              <h3 className="text-gray-500 text-sm font-medium mb-2 group-hover:text-gray-700">Total Receivable</h3>
              <div className="text-2xl font-bold text-gray-900 group-hover:text-blue-600">OMR {totalReceivable.toFixed(0)}</div>
              <div className="text-xs text-gray-500 mt-2 space-y-1">
                <div className="flex justify-between">
                  <span>Customers ({regularReceivableCount}):</span>
                  <span className="font-medium text-gray-700">OMR {regularReceivable.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Dealers ({dealerReceivableCount}):</span>
                  <span className="font-medium text-gray-700">OMR {dealerReceivable.toFixed(0)}</span>
                </div>
              </div>
              <div className="absolute top-6 right-6 bg-green-50 text-green-500 rounded-full p-1.5 group-hover:bg-green-100 transition-colors">
                <ArrowDown className="w-5 h-5" />
              </div>
            </Link>
            <div className="p-6 relative">
              <h3 className="text-gray-500 text-sm font-medium mb-2">Total Payable</h3>
              <div className="text-2xl font-bold text-gray-900">OMR {totalPayable.toFixed(0)}</div>
              <p className="text-gray-400 text-xs mt-1">From {payablePartiesCount} Party</p>
              <div className="absolute top-6 right-6 bg-red-50 text-red-400 rounded-full p-1.5">
                <ArrowUp className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="p-6 bg-white flex-1 border-b border-gray-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-gray-500 text-sm font-medium mb-2">Total Sale</h3>
                <div className="text-2xl font-bold text-gray-900">OMR {totalSaleThisMonth.toFixed(0)}</div>
              </div>
              <button className="flex items-center gap-1 text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                This Month <ChevronDown className="w-4 h-4" />
              </button>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesByDay} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={true} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAmount)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Most Used Reports */}
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-700 text-sm font-semibold">Most Used Reports</h3>
              <a href="#" className="text-blue-500 text-sm font-medium">View All</a>
            </div>
            <div className="flex gap-4">
              <Link to="/admin/reporting" className="flex items-center justify-between border border-gray-200 rounded-lg p-3 w-48 hover:shadow-sm transition">
                <span className="text-sm font-medium text-gray-700">Sale Report</span>
                <ChevronRight className="w-4 h-4 text-blue-500" />
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column (Side Panel) */}
        <div className="w-full lg:w-80 bg-white flex flex-col">
          <div className="p-6 border-b border-gray-100 group hover:bg-gray-50 cursor-pointer flex justify-between items-start">
            <div>
              <h4 className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-700">Purchases</h4>
              <p className="text-gray-900 font-bold">OMR {totalPurchasesThisMonth.toFixed(0)}</p>
            </div>
            <span className="text-gray-400 text-xs">This Month</span>
          </div>

          <div className="p-6 border-b border-gray-100 group hover:bg-gray-50 cursor-pointer flex justify-between items-start">
            <div>
              <h4 className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-700">Expenses</h4>
              <p className="text-gray-900 font-bold">OMR {totalExpenses.toFixed(0)}</p>
            </div>
            <span className="text-gray-400 text-xs">This Month</span>
          </div>

          <div className="p-6 border-b border-gray-100 group hover:bg-gray-50 cursor-pointer flex justify-between items-start">
            <div>
              <h4 className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-700">Stock Value</h4>
              <p className="text-gray-900 font-bold">OMR {stockValue.toFixed(0)}</p>
            </div>
            <span className="text-gray-400 text-xs">As of Now</span>
          </div>

          <div className="p-6 border-b border-gray-100 group hover:bg-gray-50 cursor-pointer flex justify-between items-start">
            <div>
              <h4 className="text-gray-500 text-sm font-medium mb-1 group-hover:text-gray-700">Cash in Hand</h4>
              <p className="text-gray-900 font-bold">OMR {cashInHand.toFixed(0)}</p>
            </div>
            <span className="text-gray-400 text-xs">As of Now</span>
          </div>

          {/* Low Stock Items */}
          <div className="p-6 border-b border-gray-100 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-gray-500 text-sm font-medium">Low Stocks Items</h4>
              <span className="text-gray-400 text-xs">As of Now</span>
            </div>
            <div className="space-y-3">
              {lowStockItems.length > 0 ? (
                lowStockItems.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 truncate mr-2 max-w-[180px]" title={item.name}>{item.name.toUpperCase()}</span>
                    <span className="text-gray-900 font-medium">{item.stock_level}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-gray-400">No low stock items</div>
              )}
            </div>
            {lowStockItems.length > 0 && (
              <button className="text-gray-500 text-xs mt-3 flex items-center font-medium">
                See More <ChevronDown className="w-3 h-3 ml-1" />
              </button>
            )}
          </div>

          <div className="p-4">
            <button className="w-full py-3 border border-dashed border-gray-300 rounded-lg text-gray-500 flex justify-center items-center text-sm font-medium hover:bg-gray-50 transition">
              <span className="mr-auto pl-4">Add Widget of Your Choice</span>
              <Plus className="w-4 h-4 mr-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
