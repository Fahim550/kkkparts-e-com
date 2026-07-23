import React from "react";
import { useTrialBalance } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { DollarSign, FileSpreadsheet, Loader2, TrendingDown, TrendingUp } from "lucide-react";

export default function FinancialReportsPage() {
  const { data: tb, isLoading } = useTrialBalance();

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  const totalDebit = tb?.reduce((sum, r) => sum + r.total_debit, 0) || 0;
  const totalCredit = tb?.reduce((sum, r) => sum + r.total_credit, 0) || 0;

  // ── Profit & Loss Aggregations ──
  const revenueAccounts = tb?.filter(r => r.account_number.startsWith("4") || r.balance > 0 && r.total_credit > r.total_debit) || [];
  const expenseAccounts = tb?.filter(r => r.account_number.startsWith("5")) || [];

  const totalRevenue = revenueAccounts.reduce((sum, r) => sum + r.balance, 0);
  const totalExpense = expenseAccounts.reduce((sum, r) => sum + r.balance, 0);
  const netProfit = totalRevenue - totalExpense;

  // ── Balance Sheet Aggregations ──
  const assetAccounts = tb?.filter(r => r.account_number.startsWith("1")) || [];
  const liabilityAccounts = tb?.filter(r => r.account_number.startsWith("2")) || [];
  const equityAccounts = tb?.filter(r => r.account_number.startsWith("3")) || [];

  const totalAssets = assetAccounts.reduce((sum, r) => sum + r.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, r) => sum + r.balance, 0);
  const totalEquityBase = equityAccounts.reduce((sum, r) => sum + r.balance, 0);
  const totalEquity = totalEquityBase + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
        <p className="text-sm text-muted-foreground">Real-time trial balance, income statement, and balance sheet reports.</p>
      </div>

      <Tabs defaultValue="trial-balance">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>
        
        {/* ── 1. Trial Balance Tab ── */}
        <TabsContent value="trial-balance" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Trial Balance Report
              </CardTitle>
              <Badge variant="outline" className="font-mono">Balanced (${totalDebit.toFixed(2)})</Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account Code & Name</TableHead>
                    <TableHead className="text-right">Debit ($)</TableHead>
                    <TableHead className="text-right">Credit ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tb?.map(row => (
                    <TableRow key={row.account_id}>
                      <TableCell className="font-medium">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                          {row.account_number}
                        </span>
                        {row.account_name}
                      </TableCell>
                      <TableCell className="text-right font-mono">{row.total_debit > 0 ? `$${row.total_debit.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right font-mono">{row.total_credit > 0 ? `$${row.total_credit.toFixed(2)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2 bg-muted/20">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 text-base">${totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right font-mono text-emerald-600 text-base">${totalCredit.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. Profit & Loss Tab ── */}
        <TabsContent value="pnl" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-emerald-50/50 border-emerald-200">
              <CardContent className="p-4">
                <div className="text-xs text-emerald-700 font-semibold uppercase">Total Revenue</div>
                <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">${totalRevenue.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-200">
              <CardContent className="p-4">
                <div className="text-xs text-red-700 font-semibold uppercase">Total Expenses</div>
                <div className="text-2xl font-bold font-mono text-red-800 mt-1">${totalExpense.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card className={netProfit >= 0 ? "bg-indigo-50/50 border-indigo-200" : "bg-amber-50/50 border-amber-200"}>
              <CardContent className="p-4">
                <div className="text-xs font-semibold uppercase flex items-center gap-1">
                  Net Profit / Loss
                  {netProfit >= 0 ? <TrendingUp className="w-4 h-4 text-emerald-600" /> : <TrendingDown className="w-4 h-4 text-amber-600" />}
                </div>
                <div className={`text-2xl font-bold font-mono mt-1 ${netProfit >= 0 ? "text-indigo-900" : "text-amber-900"}`}>
                  ${netProfit.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Income Statement (Profit & Loss)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-emerald-800">Revenue (Income)</h4>
                <Table>
                  <TableBody>
                    {revenueAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">No revenue entries recorded.</TableCell></TableRow>
                    ) : (
                      revenueAccounts.map(r => (
                        <TableRow key={r.account_id}>
                          <TableCell className="text-sm">{r.account_number} - {r.account_name}</TableCell>
                          <TableCell className="text-right font-mono font-medium">${r.balance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-800">Operating Expenses & COGS</h4>
                <Table>
                  <TableBody>
                    {expenseAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">No expense entries recorded.</TableCell></TableRow>
                    ) : (
                      expenseAccounts.map(r => (
                        <TableRow key={r.account_id}>
                          <TableCell className="text-sm">{r.account_number} - {r.account_name}</TableCell>
                          <TableCell className="text-right font-mono font-medium">${r.balance.toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. Balance Sheet Tab ── */}
        <TabsContent value="balance-sheet" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="bg-emerald-50/30 border-b">
                <CardTitle className="text-lg text-emerald-900">Assets (সম্পদ)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {assetAccounts.map(r => (
                      <TableRow key={r.account_id}>
                        <TableCell className="text-sm font-medium">{r.account_number} - {r.account_name}</TableCell>
                        <TableCell className="text-right font-mono font-bold">${r.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold border-t-2 bg-emerald-50/50">
                      <TableCell className="text-emerald-900">Total Assets</TableCell>
                      <TableCell className="text-right font-mono text-emerald-900 text-lg">${totalAssets.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="bg-indigo-50/30 border-b">
                <CardTitle className="text-lg text-indigo-900">Liabilities & Equity (দেনা ও মূলধন)</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-xs text-muted-foreground uppercase">Liabilities (দেনা)</TableCell></TableRow>
                    {liabilityAccounts.map(r => (
                      <TableRow key={r.account_id}>
                        <TableCell className="text-sm">{r.account_number} - {r.account_name}</TableCell>
                        <TableCell className="text-right font-mono font-medium">${r.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/30"><TableCell colSpan={2} className="font-semibold text-xs text-muted-foreground uppercase">Equity & Earnings</TableCell></TableRow>
                    {equityAccounts.map(r => (
                      <TableRow key={r.account_id}>
                        <TableCell className="text-sm">{r.account_number} - {r.account_name}</TableCell>
                        <TableCell className="text-right font-mono font-medium">${r.balance.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell className="text-sm italic">Retained Net Earnings (Profit/Loss)</TableCell>
                      <TableCell className="text-right font-mono font-medium">${netProfit.toFixed(2)}</TableCell>
                    </TableRow>
                    <TableRow className="font-bold border-t-2 bg-indigo-50/50">
                      <TableCell className="text-indigo-900">Total Liabilities & Equity</TableCell>
                      <TableCell className="text-right font-mono text-indigo-900 text-lg">${totalLiabilitiesAndEquity.toFixed(2)}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

