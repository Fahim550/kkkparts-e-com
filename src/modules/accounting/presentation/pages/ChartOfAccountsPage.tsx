import React from "react";
import { useChartOfAccounts } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";

export default function ChartOfAccountsPage() {
  const { data: accounts, isLoading } = useChartOfAccounts();

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>All Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts?.map((acc) => (
                <TableRow key={acc.id} className={acc.is_group ? "bg-muted/50 font-semibold" : ""}>
                  <TableCell className="font-mono">{acc.account_number}</TableCell>
                  <TableCell>{acc.name}</TableCell>
                  <TableCell>{acc.account_type}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${acc.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
