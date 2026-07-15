import React, { useState } from "react";
import { useDiscountRules } from "../hooks/usePricing";
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
import { Loader2, Plus, Percent } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function DiscountRulesManager() {
  const { rules, isLoading, createRule } = useDiscountRules();
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [name, setName] = useState("");
  const [priority, setPriority] = useState(0);
  const [type, setType] = useState("Percentage");
  const [value, setValue] = useState(0);
  
  const [conditionType, setConditionType] = useState("MIN_QUANTITY");
  const [conditionValue, setConditionValue] = useState("10");

  const handleCreate = async () => {
    if (!name || value <= 0 || !conditionValue) return;
    setIsCreating(true);
    try {
      await createRule({
        rule: {
          name,
          priority,
          discount_type: type as any,
          discount_value: value,
          is_active: true
        },
        conditions: [
          {
            discount_rule_id: "", // filled by repo
            condition_type: conditionType as any,
            condition_value: conditionValue
          }
        ]
      });
      setIsOpen(false);
      setName("");
      setValue(0);
    } catch (e) {
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Discount & Pricing Rules</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Rule</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create Discount Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Rule Name (e.g. Bulk 10+ Discount)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Discount Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Percentage">Percentage (%)</SelectItem>
                      <SelectItem value="Fixed Amount">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" min="0" step="0.01" value={value} onChange={e => setValue(Number(e.target.value))} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Priority (Higher executes first)</Label>
                <Input type="number" value={priority} onChange={e => setPriority(Number(e.target.value))} />
              </div>

              <div className="border-t pt-4 mt-2">
                <h3 className="font-semibold mb-4 text-sm">Condition</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Condition Type</Label>
                    <Select value={conditionType} onValueChange={setConditionType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MIN_QUANTITY">Minimum Quantity</SelectItem>
                        <SelectItem value="CUSTOMER">Specific Customer ID</SelectItem>
                        <SelectItem value="CUSTOMER_GROUP">Customer Group</SelectItem>
                        <SelectItem value="PRODUCT">Specific Product ID</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Condition Value</Label>
                    <Input value={conditionValue} onChange={e => setConditionValue(e.target.value)} placeholder="e.g. 10 or 'VIP'" />
                  </div>
                </div>
              </div>

              <Button onClick={handleCreate} className="w-full mt-4" disabled={isCreating || !name || value <= 0 || !conditionValue}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Create Rule
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule Name</TableHead>
              <TableHead>Discount</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : rules?.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <Percent className="w-4 h-4 mr-2 text-blue-500" />
                    {rule.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-green-600 font-bold">
                  {rule.discount_type === 'Percentage' ? `${rule.discount_value}%` : `$${rule.discount_value}`}
                </TableCell>
                <TableCell>{rule.priority}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${rule.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {rule.is_active ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
              </TableRow>
            ))}
            {(!rules || rules.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No discount rules configured.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
