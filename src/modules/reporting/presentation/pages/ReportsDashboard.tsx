import React from "react";
import { Link } from "react-router-dom";
import { useDashboardMetrics, useSalesChartData } from "../hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingCart, Activity, AlertTriangle, Users, TrendingUp, ChevronRight, Layers, FileText } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export default function ReportsDashboard() {
  const { data: metrics, isLoading: isLoadingMetrics } = useDashboardMetrics();
  const { data: chartData, isLoading: isLoadingChart } = useSalesChartData();

  if (isLoadingMetrics || isLoadingChart) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const totalSales = metrics?.total_sales ?? 0;
  const totalProfit = metrics?.total_profit ?? 0;
  const grossMargin = totalSales > 0 ? ((totalProfit / totalSales) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">High-level KPIs, revenue performance, and inventory valuation metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/reports/sales" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
            Sales Report <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/admin/reports/inventory" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
            Inventory Report <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/admin/accounting/financials" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
            Financial Statements <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/reports/sales" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Total Sales (MTD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">OMR {totalSales.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders, POS receipts & Invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Card className={`shadow-sm transition-all ${totalProfit < 0 ? "border-red-200 bg-red-50/20" : ""}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${totalProfit < 0 ? "text-red-700" : ""}`}>
              {totalProfit < 0 ? "Net Loss (MTD)" : "Gross Profit (MTD)"}
            </CardTitle>
            <TrendingUp className={`h-4 w-4 ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600 rotate-180"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {totalProfit < 0 ? `-OMR ${Math.abs(totalProfit).toFixed(3)}` : `OMR ${totalProfit.toFixed(3)}`}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Margin: {grossMargin}% ({totalProfit >= 0 ? "Profit" : "Loss: Buying cost exceeds sales"})
            </p>
          </CardContent>
        </Card>

        <Link to="/admin/fifo-layers" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Inventory Valuation</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">OMR {(metrics?.inventory_value ?? 0).toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Active FIFO cost valuation</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/reports/inventory" className="block group">
          <Card className="hover:border-red-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-600">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{metrics?.low_stock_items ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Items with balance ≤ 5 units</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/purchase-history" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Total Purchases (MTD)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">OMR {(metrics?.total_purchases ?? 0).toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Purchase bills & received receipts</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/customers" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Active Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{metrics?.active_customers ?? 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Active customer records</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/fifo-layers" className="block group">
          <Card className="hover:border-indigo-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-indigo-600">FIFO Cost Layers</CardTitle>
              <Layers className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold text-gray-800">Inspect Active Batches</div>
              <p className="text-xs text-muted-foreground mt-1">Detailed inventory cost lots</p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/admin/accounting/financials" className="block group">
          <Card className="hover:border-emerald-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-emerald-600">Trial Balance & P&L</CardTitle>
              <FileText className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-base font-semibold text-gray-800">Accounting Financials</div>
              <p className="text-xs text-muted-foreground mt-1">Real-time financial statements</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Revenue & Gross Profit (Last 7 Days)</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Daily comparison of net revenue and gross profit (revenue minus COGS)</p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} />
                <YAxis tickFormatter={(val) => `${val}`} tick={{ fill: "#64748b", fontSize: 12 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    `OMR ${Number(value || 0).toFixed(3)}`,
                    name === "sales" ? "Sales Revenue" : Number(value) >= 0 ? "Gross Profit" : "Net Loss",
                  ]}
                  contentStyle={{
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "1px solid #e2e8f0",
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: "12px" }} />
                <Bar dataKey="sales" name="Sales Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" name="Gross Profit" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
