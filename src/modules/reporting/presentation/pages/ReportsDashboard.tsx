import React from "react";
import { Link } from "react-router-dom";
import { useDashboardMetrics, useSalesChartData } from "../hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, DollarSign, ShoppingCart, Activity, AlertTriangle, Users, TrendingUp, ChevronRight } from "lucide-react";
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics & Reports</h1>
          <p className="text-sm text-muted-foreground">High-level KPIs, revenue performance, and inventory metrics.</p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/reports/sales" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
            Sales Report <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
          <span className="text-gray-300">|</span>
          <Link to="/admin/reports/inventory" className="text-sm font-medium text-blue-600 hover:underline flex items-center">
            Inventory Report <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/reports/sales" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Total Sales (MTD)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">OMR {metrics?.total_sales.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Orders, POS & Invoices</p>
            </CardContent>
          </Card>
        </Link>

        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gross Profit (MTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">OMR {metrics?.total_profit.toFixed(3)}</div>
            <p className="text-xs text-muted-foreground mt-1">Sales minus COGS</p>
          </CardContent>
        </Card>

        <Link to="/admin/inventory/ledger" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Inventory Value</CardTitle>
              <Activity className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">OMR {metrics?.inventory_value.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Active inventory on hand</p>
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
              <div className="text-2xl font-bold text-red-600">{metrics?.low_stock_items}</div>
              <p className="text-xs text-muted-foreground mt-1">Items below threshold</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/purchase-orders" className="block group">
          <Card className="hover:border-blue-400 transition-colors shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium group-hover:text-blue-600">Total Purchases (MTD)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">OMR {metrics?.total_purchases.toFixed(3)}</div>
              <p className="text-xs text-muted-foreground mt-1">Purchase orders & bills</p>
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
              <div className="text-2xl font-bold text-gray-900">{metrics?.active_customers}</div>
              <p className="text-xs text-muted-foreground mt-1">Registered in database</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Charts */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Revenue & Profit (Last 7 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis tickFormatter={(val) => `OMR ${val}`} />
                <Tooltip formatter={(value: any) => [`OMR ${Number(value || 0).toFixed(3)}`]} />
                <Legend />
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
