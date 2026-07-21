import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProducts } from "@/hooks/useDatabase";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  CreditCard,
  FileSpreadsheet,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingDown,
  X,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import { useInvoices } from "../hooks/useInvoices";

// ── helpers ────────────────────────────────────────────────────────────────
const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    n ?? 0,
  );

const daysDue = (dueDate: string) => {
  const diff = Math.floor(
    (Date.now() - new Date(dueDate).getTime()) / 86_400_000,
  );
  return diff;
};

const statusConfig: Record<
  string,
  { label: string; cls: string; icon: React.ReactNode }
> = {
  Unpaid: {
    label: "Unpaid",
    cls: "bg-red-100 text-red-700 border border-red-200",
    icon: <AlertTriangle className="w-3 h-3" />,
  },
  PartiallyPaid: {
    label: "Partial",
    cls: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: <Clock className="w-3 h-3" />,
  },
  Paid: {
    label: "Paid",
    cls: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
};

// ── component ───────────────────────────────────────────────────────────────
export default function SupplierDuePage() {
  const {
    invoices,
    isLoading,
    createInvoice,
    isCreating,
    payInvoice,
    isPaying,
  } = useInvoices();
  const { suppliers } = useSuppliers();
  const { receipts } = useGoodsReceive();
  const { data: products = [] } = useProducts();

  // create-invoice form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [receiptId, setReceiptId] = useState("none");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86_400_000).toISOString().split("T")[0],
  );
  const [items, setItems] = useState<
    {
      variation_id: string;
      quantity_billed: number;
      unit_price: number;
      amount: number;
      label?: string;
    }[]
  >([]);
  const [selVariation, setSelVariation] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  // pay-invoice dialog state
  const [payDialog, setPayDialog] = useState<{
    id: string;
    total: number;
  } | null>(null);
  const [payStatus, setPayStatus] = useState<"Paid" | "PartiallyPaid">("Paid");

  // list ui state
  const [search, setSearch] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ── derived stats ───────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const all = invoices ?? [];
    const totalDue = all
      .filter((i) => i.status !== "Paid")
      .reduce((s, i) => s + i.total_amount, 0);
    const overdue = all
      .filter((i) => i.status !== "Paid" && daysDue(i.due_date) > 0)
      .reduce((s, i) => s + i.total_amount, 0);
    const paid = all
      .filter((i) => i.status === "Paid")
      .reduce((s, i) => s + i.total_amount, 0);
    const count = all.filter((i) => i.status !== "Paid").length;
    return { totalDue, overdue, paid, count };
  }, [invoices]);

  // ── filtered list ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return (invoices ?? []).filter((inv) => {
      const supplier = (inv as any).suppliers?.name ?? "";
      const matchSearch =
        !search ||
        inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
        inv.supplier_invoice_number
          .toLowerCase()
          .includes(search.toLowerCase()) ||
        supplier.toLowerCase().includes(search.toLowerCase());
      const matchSupplier =
        filterSupplier === "all" || inv.supplier_id === filterSupplier;
      const matchStatus = filterStatus === "all" || inv.status === filterStatus;
      return matchSearch && matchSupplier && matchStatus;
    });
  }, [invoices, search, filterSupplier, filterStatus]);

  // ── item helpers ─────────────────────────────────────────────────────────
  const allVariations = useMemo(
    () =>
      (products ?? []).flatMap((p: any) =>
        (p.product_variations ?? p.variations ?? []).map((v: any) => ({
          id: v.id,
          label: `${p.name} — ${v.sku}`,
        })),
      ),
    [products],
  );

  const handleAddItem = () => {
    if (!selVariation || qty <= 0 || price < 0) return;
    const label =
      allVariations.find((v) => v.id === selVariation)?.label ?? selVariation;
    setItems([
      ...items,
      {
        variation_id: selVariation,
        quantity_billed: qty,
        unit_price: price,
        amount: qty * price,
        label,
      },
    ]);
    setSelVariation("");
    setQty(1);
    setPrice(0);
  };

  const handleRemoveItem = (idx: number) =>
    setItems(items.filter((_, i) => i !== idx));

  const invoiceTotal = items.reduce((s, i) => s + i.amount, 0);

  const handleCreate = async () => {
    if (!supplierId || !supplierInvoiceNumber || items.length === 0) return;
    try {
      const itemsPayload = items.map(({ label: _l, ...rest }) => rest);
      await createInvoice({
        invoice: {
          supplier_id: supplierId,
          purchase_receipt_id: receiptId === "none" ? null : receiptId,
          invoice_number: invoiceNumber,
          supplier_invoice_number: supplierInvoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          status: "Unpaid",
          total_amount: 0,
        },
        items: itemsPayload,
      });
      setIsCreateOpen(false);
      setItems([]);
      setSupplierInvoiceNumber("");
      setSupplierId("");
      setReceiptId("none");
      setInvoiceNumber(`INV-${Date.now()}`);
    } catch (_) {}
  };

  const handlePay = async () => {
    if (!payDialog) return;
    try {
      await payInvoice({ id: payDialog.id, status: payStatus });
      setPayDialog(null);
    } catch (_) {}
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 p-1">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingDown className="w-6 h-6 text-red-500" />
            Supplier Due
            <span className="text-sm font-normal text-muted-foreground">
              (AP Invoices)
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Track supplier bills, payments and outstanding balances
          </p>
        </div>
        <Dialog
          open={isCreateOpen}
          onOpenChange={(o) => {
            setIsCreateOpen(o);
            if (o) setInvoiceNumber(`INV-${Date.now()}`);
          }}
        >
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="w-4 h-4 mr-2" /> Add Bill / Invoice
            </Button>
          </DialogTrigger>

          {/* ── Create Invoice Dialog ── */}
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Record Supplier Invoice (Accounts Payable)
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label>Internal Invoice No.</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Supplier Invoice No. *</Label>
                  <Input
                    value={supplierInvoiceNumber}
                    onChange={(e) => setSupplierInvoiceNumber(e.target.value)}
                    placeholder="Provided by supplier"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Supplier *</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Linked GRN Receipt (Optional)</Label>
                  <Select value={receiptId} onValueChange={setReceiptId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select receipt" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— No Receipt —</SelectItem>
                      {receipts
                        ?.filter(
                          (r) => !supplierId || r.supplier_id === supplierId,
                        )
                        .map((r) => (
                          <SelectItem key={r.id} value={r.id}>
                            {r.receipt_number}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Invoice Date</Label>
                  <Input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Billed Items */}
              <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
                <h3 className="font-semibold text-sm">Billed Items</h3>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[180px] space-y-1">
                    <Label>Product Variation</Label>
                    <Select
                      value={selVariation}
                      onValueChange={setSelVariation}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select variation" />
                      </SelectTrigger>
                      <SelectContent>
                        {allVariations.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24 space-y-1">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="w-32 space-y-1">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    disabled={!selVariation || qty <= 0}
                  >
                    Add
                  </Button>
                </div>

                {items.length > 0 && (
                  <div className="rounded-md border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead>Product</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">
                            Unit Price
                          </TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                          <TableHead className="w-8" />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((it, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="text-sm">
                              {it.label ?? it.variation_id}
                            </TableCell>
                            <TableCell className="text-right">
                              {it.quantity_billed}
                            </TableCell>
                            <TableCell className="text-right">
                              {fmt(it.unit_price)}
                            </TableCell>
                            <TableCell className="text-right font-semibold">
                              {fmt(it.amount)}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-destructive"
                                onClick={() => handleRemoveItem(idx)}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={3}
                            className="text-right font-bold"
                          >
                            Total
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {fmt(invoiceTotal)}
                          </TableCell>
                          <TableCell />
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={
                  isCreating ||
                  items.length === 0 ||
                  !supplierInvoiceNumber ||
                  !supplierId
                }
              >
                {isCreating && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Record Invoice — {fmt(invoiceTotal)}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Summary Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Outstanding",
            value: fmt(stats.totalDue),
            sub: `${stats.count} unpaid invoice${stats.count !== 1 ? "s" : ""}`,
            cls: "border-l-4 border-l-red-500",
            icon: <FileSpreadsheet className="w-5 h-5 text-red-500" />,
          },
          {
            label: "Overdue",
            value: fmt(stats.overdue),
            sub: "Past due date",
            cls: "border-l-4 border-l-orange-500",
            icon: <AlertTriangle className="w-5 h-5 text-orange-500" />,
          },
          {
            label: "Total Paid",
            value: fmt(stats.paid),
            sub: "All time",
            cls: "border-l-4 border-l-emerald-500",
            icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" />,
          },
          {
            label: "Invoices",
            value: String(invoices?.length ?? 0),
            sub: "Total records",
            cls: "border-l-4 border-l-blue-500",
            icon: <CreditCard className="w-5 h-5 text-blue-500" />,
          },
        ].map((c) => (
          <div
            key={c.label}
            className={`rounded-lg border bg-card p-4 shadow-sm ${c.cls}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                {c.label}
              </span>
              {c.icon}
            </div>
            <div className="text-2xl font-bold">{c.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search invoice / supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={filterSupplier} onValueChange={setFilterSupplier}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            {suppliers?.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="Unpaid">Unpaid</SelectItem>
            <SelectItem value="PartiallyPaid">Partially Paid</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Invoice Table ── */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-8" />
              <TableHead>Invoice No.</TableHead>
              <TableHead>Supplier Ref.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Invoice Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-10">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto text-muted-foreground" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={9}
                  className="text-center py-12 text-muted-foreground"
                >
                  <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inv) => {
                const cfg = statusConfig[inv.status] ?? statusConfig.Unpaid;
                const days = daysDue(inv.due_date);
                const isOverdue = inv.status !== "Paid" && days > 0;
                const isExpanded = expandedId === inv.id;
                const invItems = (inv as any).purchase_invoice_items ?? [];

                return (
                  <React.Fragment key={inv.id}>
                    <TableRow
                      className={`cursor-pointer transition-colors hover:bg-muted/30 ${isExpanded ? "bg-muted/20" : ""}`}
                      onClick={() => setExpandedId(isExpanded ? null : inv.id)}
                    >
                      <TableCell>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-red-500 shrink-0" />
                          {inv.invoice_number}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inv.supplier_invoice_number}
                      </TableCell>
                      <TableCell className="font-medium">
                        {(inv as any).suppliers?.name ?? "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div
                          className={`text-sm ${isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}
                        >
                          {new Date(inv.due_date).toLocaleDateString()}
                          {isOverdue && (
                            <span className="block text-xs">
                              {days}d overdue
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}
                        >
                          {cfg.icon} {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">
                        {fmt(inv.total_amount)}
                      </TableCell>
                      <TableCell
                        className="text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {inv.status !== "Paid" && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                            onClick={() => {
                              setPayStatus("Paid");
                              setPayDialog({
                                id: inv.id,
                                total: inv.total_amount,
                              });
                            }}
                          >
                            <CreditCard className="w-3 h-3 mr-1" /> Pay
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>

                    {/* Expanded row — line items */}
                    {isExpanded && (
                      <TableRow className="bg-muted/10 hover:bg-muted/10">
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-10 py-3 border-t border-dashed">
                            {invItems.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                No line items found.
                              </p>
                            ) : (
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="text-xs text-muted-foreground">
                                    <th className="text-left pb-1 font-medium">
                                      Product
                                    </th>
                                    <th className="text-left pb-1 font-medium">
                                      SKU
                                    </th>
                                    <th className="text-right pb-1 font-medium">
                                      Qty Billed
                                    </th>
                                    <th className="text-right pb-1 font-medium">
                                      Unit Price
                                    </th>
                                    <th className="text-right pb-1 font-medium">
                                      Amount
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {invItems.map((item: any) => (
                                    <tr
                                      key={item.id}
                                      className="border-t border-muted/40"
                                    >
                                      <td className="py-1.5">
                                        <span className="font-medium">
                                          {item.product_variations?.products
                                            ?.name ?? "Unknown Product"}
                                        </span>
                                      </td>
                                      <td className="py-1.5 font-mono text-xs text-muted-foreground">
                                        {item.product_variations?.sku ?? "—"}
                                      </td>
                                      <td className="text-right py-1.5">
                                        {item.quantity_billed}
                                      </td>
                                      <td className="text-right py-1.5">
                                        {fmt(item.unit_price)}
                                      </td>
                                      <td className="text-right py-1.5 font-semibold">
                                        {fmt(item.amount)}
                                      </td>
                                    </tr>
                                  ))}
                                  <tr className="border-t-2 border-muted">
                                    <td
                                      colSpan={4}
                                      className="text-right py-2 font-bold text-sm pr-4"
                                    >
                                      Total
                                    </td>
                                    <td className="text-right py-2 font-bold text-primary">
                                      {fmt(inv.total_amount)}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            )}
                            {(inv as any).purchase_receipts && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Linked GRN:{" "}
                                <span className="font-mono">
                                  {
                                    (inv as any).purchase_receipts
                                      .receipt_number
                                  }
                                </span>
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* ── Pay Invoice Dialog ── */}
      <Dialog open={!!payDialog} onOpenChange={(o) => !o && setPayDialog(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="rounded-lg bg-muted/30 p-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Amount</span>
                <span className="font-bold">{fmt(payDialog?.total ?? 0)}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Payment Status</Label>
              <Select
                value={payStatus}
                onValueChange={(v) => setPayStatus(v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Paid">✅ Fully Paid</SelectItem>
                  <SelectItem value="PartiallyPaid">
                    🔶 Partially Paid
                  </SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Select "Partially Paid" if you are making a partial payment.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPayDialog(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handlePay}
                disabled={isPaying}
              >
                {isPaying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
