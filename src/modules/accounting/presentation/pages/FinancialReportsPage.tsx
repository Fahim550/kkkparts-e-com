import React from "react";
import { useTrialBalance } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

export default function FinancialReportsPage() {
  const { data: tb, isLoading } = useTrialBalance();

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  const totalDebit = tb?.reduce((sum, r) => sum + r.total_debit, 0) || 0;
  const totalCredit = tb?.reduce((sum, r) => sum + r.total_credit, 0) || 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Financial Reports</h1>

      <Tabs defaultValue="trial-balance">
        <TabsList>
          <TabsTrigger value="trial-balance">Trial Balance</TabsTrigger>
          <TabsTrigger value="pnl">Profit & Loss</TabsTrigger>
          <TabsTrigger value="balance-sheet">Balance Sheet</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trial-balance">
          <Card>
            <CardHeader>
              <CardTitle>Trial Balance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tb?.map(row => (
                    <TableRow key={row.account_id}>
                      <TableCell>{row.account_number} - {row.account_name}</TableCell>
                      <TableCell className="text-right">{row.total_debit > 0 ? `$${row.total_debit.toFixed(2)}` : '-'}</TableCell>
                      <TableCell className="text-right">{row.total_credit > 0 ? `$${row.total_credit.toFixed(2)}` : '-'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold border-t-2">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right text-green-600">${totalDebit.toFixed(2)}</TableCell>
                    <TableCell className="text-right text-green-600">${totalCredit.toFixed(2)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pnl">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>Profit & Loss statement logic to be aggregated from Revenue & Expense accounts.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="balance-sheet">
          <Card>
            <CardContent className="p-12 text-center text-muted-foreground">
              <p>Balance Sheet statement logic to be aggregated from Asset, Liability & Equity accounts.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
