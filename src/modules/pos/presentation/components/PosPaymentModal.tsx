import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Banknote, CreditCard, Landmark } from "lucide-react";

type PaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Due";

interface PaymentEntry {
  method: PaymentMethod;
  amount: number;
  reference_code?: string;
}

export default function PosPaymentModal({ 
  isOpen, 
  onClose, 
  totalAmount, 
  onComplete, 
  isProcessing 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  totalAmount: number;
  onComplete: (payments: PaymentEntry[]) => void;
  isProcessing: boolean;
}) {
  const [payments, setPayments] = useState<PaymentEntry[]>([{ method: "Cash", amount: totalAmount }]);

  const handleAddPayment = () => {
    setPayments([...payments, { method: "Card", amount: 0 }]);
  };

  const handleUpdatePayment = (index: number, field: keyof PaymentEntry, value: any) => {
    const newPayments = [...payments];
    newPayments[index] = { ...newPayments[index], [field]: value };
    setPayments(newPayments);
  };

  const handleRemovePayment = (index: number) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const currentTotal = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const remaining = totalAmount - currentTotal;
  const isComplete = currentTotal >= totalAmount && totalAmount > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
      // Reset when opening
      if (open) setPayments([{ method: "Cash", amount: totalAmount }]);
    }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-6">
          <div className="flex justify-between items-end border-b pb-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Due</p>
              <p className="text-3xl font-bold">OMR {totalAmount.toFixed(3)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Remaining</p>
              <p className={`text-xl font-bold ${remaining > 0 ? 'text-red-500' : remaining < 0 ? 'text-yellow-500' : 'text-emerald-600'}`}>
                OMR {Math.abs(remaining).toFixed(3)} {remaining < 0 ? '(Change)' : ''}
              </p>
            </div>
          </div>

          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {payments.map((payment, index) => (
              <div key={index} className="flex space-x-2 items-start bg-muted/20 p-3 rounded-lg border">
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Method</Label>
                      <select 
                        className="w-full text-sm border rounded p-2 bg-background"
                        value={payment.method}
                        onChange={e => handleUpdatePayment(index, "method", e.target.value)}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="Due">Due</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Amount</Label>
                      <Input 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        value={payment.amount === 0 ? '' : payment.amount} 
                        onChange={e => handleUpdatePayment(index, "amount", Number(e.target.value))} 
                        autoFocus={index === payments.length - 1}
                      />
                    </div>
                  </div>
                  {payment.method !== "Cash" && (
                    <div className="space-y-1">
                      <Label className="text-xs">Reference (Last 4 digits / Ref #)</Label>
                      <Input 
                        className="h-8 text-sm" 
                        value={payment.reference_code || ""} 
                        onChange={e => handleUpdatePayment(index, "reference_code", e.target.value)} 
                      />
                    </div>
                  )}
                </div>
                {payments.length > 1 && (
                  <Button variant="ghost" size="icon" className="text-red-500 mt-5" onClick={() => handleRemovePayment(index)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          <Button variant="outline" size="sm" onClick={handleAddPayment} className="w-full border-dashed">
            <Plus className="w-4 h-4 mr-2" /> Split Payment
          </Button>

        </div>
        
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 w-32" 
            disabled={!isComplete || isProcessing}
            onClick={() => onComplete(payments)}
          >
            {isProcessing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
