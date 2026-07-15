import React, { useState } from "react";
import { useChartOfAccounts, useJournalEntries } from "../hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function JournalEntriesPage() {
  const { data: accounts } = useChartOfAccounts();
  const { postJournal, isPosting } = useJournalEntries();
  const [isOpen, setIsOpen] = useState(false);

  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([{ account_id: "", debit: 0, credit: 0, narration: "" }, { account_id: "", debit: 0, credit: 0, narration: "" }]);

  const handleAddLine = () => setLines([...lines, { account_id: "", debit: 0, credit: 0, narration: "" }]);
  const handleRemoveLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async () => {
    if (!isBalanced) return;
    try {
      await postJournal({
        posting_date: new Date().toISOString(),
        narration,
        reference_type: "manual",
        lines: lines.map(l => ({
          account_id: l.account_id,
          debit_amount: Number(l.debit) || 0,
          credit_amount: Number(l.credit) || 0,
          narration: l.narration
        }))
      });
      setIsOpen(false);
      setLines([{ account_id: "", debit: 0, credit: 0, narration: "" }, { account_id: "", debit: 0, credit: 0, narration: "" }]);
      setNarration("");
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Journal Entry</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Post Manual Journal Entry</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Header Narration</Label>
                <Input value={narration} onChange={e => setNarration(e.target.value)} placeholder="e.g. Initial Capital Injection" />
              </div>

              <div className="border rounded-md p-4 bg-muted/20 space-y-4">
                <div className="grid grid-cols-12 gap-2 text-sm font-semibold mb-2">
                  <div className="col-span-5">Account</div>
                  <div className="col-span-3">Narration</div>
                  <div className="col-span-2 text-right">Debit</div>
                  <div className="col-span-2 text-right">Credit</div>
                </div>
                {lines.map((line, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 flex">
                      <Button variant="ghost" size="icon" className="text-red-500 mr-1 h-9 w-9" onClick={() => handleRemoveLine(idx)} disabled={lines.length <= 2}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <select 
                        className="w-full border rounded p-2 text-sm"
                        value={line.account_id}
                        onChange={e => {
                          const n = [...lines]; n[idx].account_id = e.target.value; setLines(n);
                        }}
                      >
                        <option value="">Select Account...</option>
                        {accounts?.filter(a => !a.is_group).map(a => (
                          <option key={a.id} value={a.id}>{a.account_number} - {a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <Input className="h-9" value={line.narration} onChange={e => {
                        const n = [...lines]; n[idx].narration = e.target.value; setLines(n);
                      }} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="0" className="h-9 text-right" value={line.debit === 0 ? '' : line.debit} onChange={e => {
                        const n = [...lines]; n[idx].debit = Number(e.target.value); n[idx].credit = 0; setLines(n);
                      }} />
                    </div>
                    <div className="col-span-2">
                      <Input type="number" min="0" className="h-9 text-right" value={line.credit === 0 ? '' : line.credit} onChange={e => {
                        const n = [...lines]; n[idx].credit = Number(e.target.value); n[idx].debit = 0; setLines(n);
                      }} />
                    </div>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={handleAddLine}><Plus className="w-4 h-4 mr-2" /> Add Line</Button>
                  <div className="flex space-x-8 text-right font-mono font-semibold">
                    <div className={totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}>
                      Total Dr: ${totalDebit.toFixed(2)}
                    </div>
                    <div className={totalDebit !== totalCredit ? 'text-red-500' : 'text-green-600'}>
                      Total Cr: ${totalCredit.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={!isBalanced || isPosting || lines.some(l => !l.account_id)} className="w-full">
                {isPosting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Post Entry
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <p>This is where the general journal history will be displayed.</p>
        </CardContent>
      </Card>
    </div>
  );
}
