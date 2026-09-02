import React, { useState } from "react";
import { useChartOfAccounts, useCreateAccount } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
import { ACCOUNT_TYPES } from "../../domain/constants";

export default function ChartOfAccountsPage() {
  const { data: accounts, isLoading } = useChartOfAccounts();
  const createAccountMutation = useCreateAccount();

  const [isOpen, setIsOpen] = useState(false);
  const [accountNumber, setAccountNumber] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<string>("Liability");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber || !name || !accountType) return;

    await createAccountMutation.mutateAsync({
      account_number: accountNumber.trim(),
      name: name.trim(),
      account_type: accountType,
      is_group: false,
      is_active: true,
    });

    setAccountNumber("");
    setName("");
    setAccountType("Liability");
    setIsOpen(false);
  };

  if (isLoading) return <div className="p-12 text-center"><Loader2 className="animate-spin w-8 h-8 mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Chart of Accounts</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> Add Account
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Account</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Account Type <span className="text-red-500">*</span></Label>
                <Select value={accountType} onValueChange={setAccountType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ACCOUNT_TYPES).map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Account Number / Code <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. 2100"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Account Name <span className="text-red-500">*</span></Label>
                <Input
                  placeholder="e.g. Accounts Payable"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={createAccountMutation.isPending}
              >
                {createAccountMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Save Account
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
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

