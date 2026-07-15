import React from "react";
import { useSalesReport } from "../hooks/useReporting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, FileText, Monitor, ArrowDownToLine } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SalesReport() {
  const { data: sales, isLoading } = useSalesReport();

  const handleExport = () => {
    // Simple CSV export
    if (!sales) return;
    const headers = "Date,Reference,Customer,Source,Status,Amount\n";
    const rows = sales.map(s => `${new Date(s.date).toLocaleDateString()},${s.reference},"${s.customer}",${s.source},${s.status},${s.amount}`).join("\n");
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Sales & Revenue Report</h1>
        <Button variant="outline" onClick={handleExport} disabled={!sales || sales.length === 0}>
          <ArrowDownToLine className="w-4 h-4 mr-2" /> Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions (Last 100)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales?.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="whitespace-nowrap">
                      {new Date(item.date).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        {item.source === 'POS' ? (
                          <><Monitor className="w-4 h-4 mr-2 text-indigo-500" /> POS</>
                        ) : (
                          <><FileText className="w-4 h-4 mr-2 text-blue-500" /> Invoice</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{item.reference}</TableCell>
                    <TableCell>{item.customer}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'Paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {item.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      ${item.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {(!sales || sales.length === 0) && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No sales data found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
