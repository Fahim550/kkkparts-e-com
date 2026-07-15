import React from "react";
import { useParams, Link } from "react-router-dom";
import { useCustomers, useCustomerHistory } from "../hooks/useCustomers";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ArrowLeft, FileText, ShoppingCart, Activity } from "lucide-react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { customers, isLoading: isLoadingCustomers } = useCustomers();
  const { history, isLoadingHistory, stats, isLoadingStats } = useCustomerHistory(id || "");

  const customer = customers?.find(c => c.id === id);

  if (isLoadingCustomers) return <div className="flex justify-center p-8"><Loader2 className="animate-spin w-8 h-8" /></div>;
  if (!customer) return <div className="p-8 text-center text-red-500">Customer not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link to="/admin/customers" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{customer.name}</h1>
          <p className="text-muted-foreground text-sm">
            {customer.customer_group || 'General'} | {customer.contact_email} | {customer.contact_phone}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding Due</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <div className="text-3xl font-bold text-red-600">
                ${stats?.total_due?.toFixed(2) || '0.00'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">Total unpaid invoices</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              ${Number(customer.credit_limit).toFixed(2)}
            </div>
            {stats && (
              <p className="text-xs text-muted-foreground mt-1">
                {stats.total_due > customer.credit_limit ? (
                  <span className="text-red-500 font-semibold">Exceeded by ${(stats.total_due - customer.credit_limit).toFixed(2)}</span>
                ) : (
                  <span>Available: ${(customer.credit_limit - stats.total_due).toFixed(2)}</span>
                )}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Invoiced</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingStats ? <Loader2 className="animate-spin w-5 h-5" /> : (
              <div className="text-3xl font-bold text-green-600">
                ${stats?.total_invoiced?.toFixed(2) || '0.00'}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">From {stats?.total_orders || 0} total orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Billing Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.billing_address || 'Not provided'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{customer.shipping_address || 'Not provided'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-semibold">Interaction History</h3>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Reference Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingHistory ? (
                <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
              ) : history?.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="whitespace-nowrap">
                    {format(new Date(item.date), "yyyy-MM-dd")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      {item.type === 'Sales Order' ? <ShoppingCart className="w-4 h-4 mr-2 text-blue-500" /> : <FileText className="w-4 h-4 mr-2 text-orange-500" />}
                      <span className="text-sm font-medium">{item.type}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">{item.reference_number}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${item.status === 'Paid' ? 'bg-green-100 text-green-800' : item.status === 'Unpaid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">
                    ${item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              {(!history || history.length === 0) && !isLoadingHistory && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No history found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
