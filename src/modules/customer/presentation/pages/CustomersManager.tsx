import React, { useState } from "react";
import { useCustomers } from "../hooks/useCustomers";
import { useAccounts } from "../../../accounting/presentation/hooks/useAccounts"; // Assuming we have accounts hook or similar to fetch chart of accounts
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, Plus, Users, Search, Edit } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";

// Mocking useAccounts since it might not be fully built yet, or we fetch accounts directly here if needed
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const useReceivableAccounts = () => {
  return useQuery({
    queryKey: ["receivable-accounts"],
    queryFn: async () => {
      const { data } = await supabase.from("chart_of_accounts").select("*").eq("account_type", "Asset"); // Ideally filter by sub_type 'Accounts Receivable'
      return data || [];
    }
  });
};

export default function CustomersManager() {
  const { customers, isLoading, createCustomer, isCreating, updateCustomer, isUpdating } = useCustomers();
  const { data: accounts } = useReceivableAccounts();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    customer_group: "Retail",
    contact_email: "",
    contact_phone: "",
    tax_id: "",
    credit_limit: 0,
    receivable_account_id: "",
    billing_address: "",
    shipping_address: "",
    is_active: true
  });

  const handleEdit = (c: any) => {
    setEditingId(c.id);
    setFormData({
      name: c.name,
      customer_group: c.customer_group || "Retail",
      contact_email: c.contact_email || "",
      contact_phone: c.contact_phone || "",
      tax_id: c.tax_id || "",
      credit_limit: Number(c.credit_limit) || 0,
      receivable_account_id: c.receivable_account_id || "",
      billing_address: c.billing_address || "",
      shipping_address: c.shipping_address || "",
      is_active: c.is_active ?? true
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingId) {
        await updateCustomer({ id: editingId, data: formData });
      } else {
        await createCustomer(formData);
      }
      setIsOpen(false);
      resetForm();
    } catch (e) {}
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "", customer_group: "Retail", contact_email: "", contact_phone: "",
      tax_id: "", credit_limit: 0, receivable_account_id: "", billing_address: "", shipping_address: "", is_active: true
    });
  };

  const filteredCustomers = customers?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || (c.contact_phone && c.contact_phone.includes(searchTerm)));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Customer</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Customer" : "New Customer"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-2 col-span-2">
                <Label>Customer Name</Label>
                <Input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. John Doe or Acme Corp" />
              </div>
              <div className="space-y-2">
                <Label>Customer Group</Label>
                <Select value={formData.customer_group} onValueChange={v => setFormData({...formData, customer_group: v})}>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Retail">Retail</SelectItem>
                    <SelectItem value="Wholesale">Wholesale</SelectItem>
                    <SelectItem value="VIP">VIP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax ID (Optional)</Label>
                <Input value={formData.tax_id} onChange={e => setFormData({...formData, tax_id: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={formData.contact_email} onChange={e => setFormData({...formData, contact_email: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={formData.contact_phone} onChange={e => setFormData({...formData, contact_phone: e.target.value})} />
              </div>
              
              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-4">Financial & Accounting</h3>
              </div>
              
              <div className="space-y-2">
                <Label>Receivable Account</Label>
                <Select value={formData.receivable_account_id} onValueChange={v => setFormData({...formData, receivable_account_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select AR account" /></SelectTrigger>
                  <SelectContent>
                    {accounts?.map(acc => (
                      <SelectItem key={acc.id} value={acc.id}>{acc.code} - {acc.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Credit Limit ($)</Label>
                <Input type="number" min="0" value={formData.credit_limit} onChange={e => setFormData({...formData, credit_limit: Number(e.target.value)})} />
              </div>

              <div className="col-span-2 border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-4">Addresses</h3>
              </div>
              
              <div className="space-y-2">
                <Label>Billing Address</Label>
                <Textarea value={formData.billing_address} onChange={e => setFormData({...formData, billing_address: e.target.value})} rows={3} />
              </div>
              <div className="space-y-2">
                <Label>Shipping Address</Label>
                <Textarea value={formData.shipping_address} onChange={e => setFormData({...formData, shipping_address: e.target.value})} rows={3} />
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <Button onClick={handleSave} disabled={isCreating || isUpdating || !formData.name || !formData.receivable_account_id}>
                {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Customer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2 bg-card border rounded-md p-2 w-full max-w-sm">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search customers..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="border-0 focus-visible:ring-0 shadow-none h-8"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Group</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead className="text-right">Credit Limit</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : filteredCustomers?.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2 text-indigo-500" />
                    <div>
                      <Link to={`/admin/customers/${customer.id}`} className="hover:underline hover:text-indigo-600">
                        {customer.name}
                      </Link>
                      {!customer.is_active && <span className="ml-2 text-xs text-red-500">(Inactive)</span>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {customer.customer_group || 'General'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">{customer.contact_phone}</div>
                  <div className="text-xs text-muted-foreground">{customer.contact_email}</div>
                </TableCell>
                <TableCell className="text-right font-mono">${Number(customer.credit_limit).toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(customer)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!filteredCustomers || filteredCustomers.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No customers found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
