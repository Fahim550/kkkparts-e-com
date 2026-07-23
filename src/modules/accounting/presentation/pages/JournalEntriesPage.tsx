import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BookOpen, Calendar, ChevronDown, ChevronRight, FileText, Loader2, Plus, Search, Trash2, X } from "lucide-react";
import React, { useState } from "react";
import { useChartOfAccounts, useJournalEntries } from "../hooks/useAccounting";

export default function JournalEntriesPage() {
  const { data: accounts } = useChartOfAccounts();

  // ── Backend-driven Filter State ──
  const [filterSearch, setFilterSearch] = useState("");
  const [filterReferenceType, setFilterReferenceType] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filters = {
    ...(filterSearch ? { search: filterSearch } : {}),
    ...(filterReferenceType ? { referenceType: filterReferenceType } : {}),
    ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
    ...(filterDateTo ? { dateTo: filterDateTo } : {}),
  };

  const { journalEntries, isLoading, postJournal, isPosting } = useJournalEntries(filters);
  const [isOpen, setIsOpen] = useState(false);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);


  const [narration, setNarration] = useState("");
  const [lines, setLines] = useState([
    { account_id: "", debit: 0, credit: 0, narration: "" },
    { account_id: "", debit: 0, credit: 0, narration: "" }
  ]);

  const handleAddLine = () => setLines([...lines, { account_id: "", debit: 0, credit: 0, narration: "" }]);
  const handleRemoveLine = (idx: number) => setLines(lines.filter((_, i) => i !== idx));

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const toggleExpand = (id: string) => {
    setExpandedEntryId(expandedEntryId === id ? null : id);
  };

  const handleSubmit = async () => {
    if (!isBalanced) return;
    try {
      await postJournal({
        posting_date: new Date().toISOString().split("T")[0],
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
      setLines([
        { account_id: "", debit: 0, credit: 0, narration: "" },
        { account_id: "", debit: 0, credit: 0, narration: "" }
      ]);
      setNarration("");
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Journal Entries</h1>
          <p className="text-sm text-muted-foreground">View and post general journal transactions.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Journal Entry</Button>
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
                        className="w-full border rounded p-2 text-sm bg-background"
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
      
      {/* ── Backend Filter Bar ── */}
      <div className="flex flex-wrap items-center gap-3 bg-card border rounded-lg p-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search entry no. or narration..."
            className="pl-9"
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
        </div>
        <div className="w-44">
          <Select
            value={filterReferenceType || "all"}
            onValueChange={(v) => setFilterReferenceType(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All References" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All References</SelectItem>
              <SelectItem value="purchase_receipt">Purchase Receipt</SelectItem>
              <SelectItem value="pos_receipt">POS Sale</SelectItem>
              <SelectItem value="manual">Manual Entry</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            className="w-36"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            title="Date From"
          />
          <span className="text-muted-foreground text-sm">—</span>
          <Input
            type="date"
            className="w-36"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            title="Date To"
          />
        </div>
        {(filterSearch || filterReferenceType || filterDateFrom || filterDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSearch("");
              setFilterReferenceType("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <Card>

        {/* <CardHeader>
          <CardTitle>All Journal Entries</CardTitle>
        </CardHeader> */}
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Entry No.</TableHead>
                <TableHead>Posting Date</TableHead>
                <TableHead>Reference</TableHead>
                <TableHead>Narration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total Debit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="animate-spin w-6 h-6 mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : (
                journalEntries?.map((entry: any) => {
                  const entryTotalDebit = entry.journal_entry_lines?.reduce(
                    (sum: number, l: any) => sum + (Number(l.debit_amount) || 0),
                    0
                  );
                  const isExpanded = expandedEntryId === entry.id;

                  return (
                    <React.Fragment key={entry.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => toggleExpand(entry.id)}
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-mono font-medium flex items-center gap-1.5">
                          <BookOpen className="w-4 h-4 text-indigo-600" />
                          {entry.entry_number}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm gap-1 text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(entry.posting_date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize text-xs font-normal">
                            {entry.reference_type?.replace(/_/g, " ") || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm">
                          {entry.narration || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-none">
                            {entry.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono font-bold">
                          ${entryTotalDebit.toFixed(2)}
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                          <TableCell colSpan={7} className="p-4">
                            <div className="border rounded-md bg-card p-4 space-y-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                Journal Entry Line Breakdown
                              </h4>
                              <Table>
                                <TableHeader>
                                  <TableRow className="hover:bg-transparent">
                                    <TableHead className="text-xs">Account Code & Name</TableHead>
                                    <TableHead className="text-xs">Account Type</TableHead>
                                    <TableHead className="text-xs">Line Narration</TableHead>
                                    <TableHead className="text-xs text-right">Debit ($)</TableHead>
                                    <TableHead className="text-xs text-right">Credit ($)</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {entry.journal_entry_lines?.map((line: any) => (
                                    <TableRow key={line.id} className="hover:bg-muted/20">
                                      <TableCell className="font-medium text-sm">
                                        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded mr-2">
                                          {line.chart_of_accounts?.account_number || "—"}
                                        </span>
                                        {line.chart_of_accounts?.name || "Unknown Account"}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {line.chart_of_accounts?.account_type || "N/A"}
                                      </TableCell>
                                      <TableCell className="text-xs text-muted-foreground">
                                        {line.narration || "—"}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm font-medium">
                                        {Number(line.debit_amount) > 0 ? `$${Number(line.debit_amount).toFixed(2)}` : "—"}
                                      </TableCell>
                                      <TableCell className="text-right font-mono text-sm font-medium">
                                        {Number(line.credit_amount) > 0 ? `$${Number(line.credit_amount).toFixed(2)}` : "—"}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })
              )}

              {(!journalEntries || journalEntries.length === 0) && !isLoading && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    No Journal Entries found. Post a purchase receipt or create a new journal entry above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

