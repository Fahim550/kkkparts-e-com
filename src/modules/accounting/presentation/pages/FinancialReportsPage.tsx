import React from "react";
import { useTrialBalance } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, FileSpreadsheet, Loader2, TrendingDown, TrendingUp } from "lucide-react";

export default function FinancialReportsPage() {
  const { data: tb = [], isLoading } = useTrialBalance();

  if (isLoading) {
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin w-8 h-8 mx-auto text-blue-600" />
      </div>
    );
  }

  const totalDebit = tb.reduce((sum, r) => sum + (r.total_debit || 0), 0);
  const totalCredit = tb.reduce((sum, r) => sum + (r.total_credit || 0), 0);

  // ── Robust Account Classification by standard account_type ──
  const isType = (r: any, target: string) => {
    const t = (r.account_type || "").toLowerCase();
    if (t === target.toLowerCase()) return true;
    // Fallback standard numbering prefixes if account_type is unset
    if (target === "Asset" && r.account_number.startsWith("1")) return true;
    if (target === "Liability" && r.account_number.startsWith("2")) return true;
    if (target === "Equity" && r.account_number.startsWith("3")) return true;
    if (target === "Revenue" && r.account_number.startsWith("4")) return true;
    if (target === "Expense" && r.account_number.startsWith("5")) return true;
    return false;
  };

  const revenueAccounts = tb.filter((r) => isType(r, "Revenue"));
  const expenseAccounts = tb.filter((r) => isType(r, "Expense"));
  const assetAccounts = tb.filter((r) => isType(r, "Asset"));
  const liabilityAccounts = tb.filter((r) => isType(r, "Liability"));
  const equityAccounts = tb.filter((r) => isType(r, "Equity"));

  const totalRevenue = revenueAccounts.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalExpense = expenseAccounts.reduce((sum, r) => sum + (r.balance || 0), 0);
  const netProfit = totalRevenue - totalExpense;

  const totalAssets = assetAccounts.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalLiabilities = liabilityAccounts.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalEquityBase = equityAccounts.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalEquity = totalEquityBase + netProfit;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const handleExportTrialBalance = () => {
    const headers = "Account Code,Account Name,Account Type,Debit (OMR),Credit (OMR),Net Balance (OMR)\n";
    const rows = tb
      .map(
        (r) =>
          `"${r.account_number}","${r.account_name.replace(/"/g, '""')}","${r.account_type}",${r.total_debit.toFixed(3)},${r.total_credit.toFixed(3)},${r.balance.toFixed(3)}`
      )
      .join("\n");
    const totalRow = `\n"TOTAL","All Accounts","",${totalDebit.toFixed(3)},${totalCredit.toFixed(3)},""`;
    const blob = new Blob([headers + rows + totalRow], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trial_balance_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-sm text-muted-foreground">
            Real-time trial balance, profit & loss (income statement), and balance sheet reports.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportTrialBalance} disabled={tb.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-1.5" /> Export Trial Balance CSV
        </Button>
      </div>

      <Tabs defaultValue="trial-balance">
        <TabsList className="grid w-full grid-cols-3 max-w-md">
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>

        {/* ── 1. Trial Balance Tab ── */}
        <TabsContent value="trial-balance" className="mt-4">
          <Card className="shadow-sm border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
                Trial Balance Report
              </CardTitle>
              <Badge
                variant="outline"
                className={`font-mono text-xs px-2.5 py-1 ${
                  Math.abs(totalDebit - totalCredit) < 0.001
                    ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-red-50 text-red-700 border-red-300"
                }`}
              >
                {Math.abs(totalDebit - totalCredit) < 0.001
                  ? `Balanced: OMR ${totalDebit.toFixed(3)}`
                  : `Out of balance: Diff OMR ${Math.abs(totalDebit - totalCredit).toFixed(3)}`}
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Account Code & Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Debit (OMR)</TableHead>
                    <TableHead className="text-right">Credit (OMR)</TableHead>
                    <TableHead className="text-right">Net Balance (OMR)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tb.map((row) => (
                    <TableRow key={row.account_id} className="hover:bg-slate-50/80">
                      <TableCell className="font-medium text-sm">
                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2 font-bold">
                          {row.account_number}
                        </span>
                        {row.account_name}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{row.account_type}</TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.total_debit > 0 ? `OMR ${row.total_debit.toFixed(3)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">
                        {row.total_credit > 0 ? `OMR ${row.total_credit.toFixed(3)}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-gray-900">
                        OMR {row.balance.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2 bg-slate-100">
                    <TableCell colSpan={2}>Total</TableCell>
                    <TableCell className="text-right font-mono text-emerald-700 text-sm">
                      OMR {totalDebit.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-emerald-700 text-sm">
                      OMR {totalCredit.toFixed(3)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-gray-500">-</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 2. Profit & Loss Tab ── */}
        <TabsContent value="pnl" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-emerald-50/50 border-emerald-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-emerald-700 font-semibold uppercase tracking-wider">
                  Total Revenue
                </div>
                <div className="text-2xl font-bold font-mono text-emerald-800 mt-1">
                  OMR {totalRevenue.toFixed(3)}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-red-50/50 border-red-200 shadow-sm">
              <CardContent className="p-4">
                <div className="text-xs text-red-700 font-semibold uppercase tracking-wider">
                  Total Expenses & COGS
                </div>
                <div className="text-2xl font-bold font-mono text-red-800 mt-1">
                  OMR {totalExpense.toFixed(3)}
                </div>
              </CardContent>
            </Card>
            <Card
              className={`shadow-sm ${
                netProfit >= 0 ? "bg-indigo-50/50 border-indigo-200" : "bg-amber-50/50 border-amber-200"
              }`}
            >
              <CardContent className="p-4">
                <div className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1">
                  Net Profit / Loss
                  {netProfit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-amber-600" />
                  )}
                </div>
                <div
                  className={`text-2xl font-bold font-mono mt-1 ${
                    netProfit >= 0 ? "text-indigo-900" : "text-amber-900"
                  }`}
                >
                  OMR {netProfit.toFixed(3)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-sm border">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base font-semibold">Income Statement (Profit & Loss)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-4">
              <div>
                <h4 className="font-semibold text-sm mb-2 text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Operating Revenue (Income)
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableBody>
                      {revenueAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">
                            No revenue entries recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        revenueAccounts.map((r) => (
                          <TableRow key={r.account_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm font-medium">
                              <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">
                                {r.account_number}
                              </span>
                              {r.account_name}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-sm">
                              OMR {r.balance.toFixed(3)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-emerald-50/40 font-bold border-t">
                        <TableCell>Total Operating Revenue</TableCell>
                        <TableCell className="text-right font-mono text-emerald-800 text-sm">
                          OMR {totalRevenue.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-2 text-red-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500"></span> Operating Expenses & COGS
                </h4>
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableBody>
                      {expenseAccounts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">
                            No expense entries recorded.
                          </TableCell>
                        </TableRow>
                      ) : (
                        expenseAccounts.map((r) => (
                          <TableRow key={r.account_id} className="hover:bg-slate-50">
                            <TableCell className="text-sm font-medium">
                              <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">
                                {r.account_number}
                              </span>
                              {r.account_name}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-sm">
                              OMR {r.balance.toFixed(3)}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                      <TableRow className="bg-red-50/40 font-bold border-t">
                        <TableCell>Total Operating Expenses</TableCell>
                        <TableCell className="text-right font-mono text-red-800 text-sm">
                          OMR {totalExpense.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── 3. Balance Sheet Tab ── */}
        <TabsContent value="balance-sheet" className="mt-4 space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="shadow-sm border">
              <CardHeader className="bg-emerald-50/40 border-b pb-3">
                <CardTitle className="text-base font-semibold text-emerald-900">Assets</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    {assetAccounts.map((r) => (
                      <TableRow key={r.account_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm font-medium">
                          <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">
                            {r.account_number}
                          </span>
                          {r.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold text-sm">
                          OMR {r.balance.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}
                    {assetAccounts.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground py-4 text-xs">
                          No asset accounts recorded.
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="font-bold border-t-2 bg-emerald-100/50">
                      <TableCell className="text-emerald-950">Total Assets</TableCell>
                      <TableCell className="text-right font-mono text-emerald-950 text-base">
                        OMR {totalAssets.toFixed(3)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="shadow-sm border">
              <CardHeader className="bg-indigo-50/40 border-b pb-3">
                <CardTitle className="text-base font-semibold text-indigo-900">
                  Liabilities & Equity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableBody>
                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={2} className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Liabilities
                      </TableCell>
                    </TableRow>
                    {liabilityAccounts.map((r) => (
                      <TableRow key={r.account_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm">
                          <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">
                            {r.account_number}
                          </span>
                          {r.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-sm">
                          OMR {r.balance.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow className="bg-slate-50">
                      <TableCell colSpan={2} className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                        Equity & Earnings
                      </TableCell>
                    </TableRow>
                    {equityAccounts.map((r) => (
                      <TableRow key={r.account_id} className="hover:bg-slate-50">
                        <TableCell className="text-sm">
                          <span className="font-mono text-xs text-muted-foreground mr-2 font-bold">
                            {r.account_number}
                          </span>
                          {r.account_name}
                        </TableCell>
                        <TableCell className="text-right font-mono font-medium text-sm">
                          OMR {r.balance.toFixed(3)}
                        </TableCell>
                      </TableRow>
                    ))}

                    <TableRow className="hover:bg-slate-50">
                      <TableCell className="text-sm italic text-gray-700">
                        Retained Net Earnings (Profit/Loss)
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-sm">
                        OMR {netProfit.toFixed(3)}
                      </TableCell>
                    </TableRow>

                    <TableRow className="font-bold border-t-2 bg-indigo-100/50">
                      <TableCell className="text-indigo-950">Total Liabilities & Equity</TableCell>
                      <TableCell className="text-right font-mono text-indigo-950 text-base">
                        OMR {totalLiabilitiesAndEquity.toFixed(3)}
                      </TableCell>
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
