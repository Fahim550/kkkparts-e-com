import React, { useState } from "react";
import { useInvoices } from "../hooks/useInvoices";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { useGoodsReceive } from "../hooks/useGoodsReceive";
import { useProducts } from "../../../product/presentation/hooks/useProducts";
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
import { Loader2, Plus, FileSpreadsheet } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SupplierDuePage() {
  const { invoices, isLoading, createInvoice, isCreating } = useInvoices();
  const { suppliers } = useSuppliers();
  const { receipts } = useGoodsReceive();
  const { products } = useProducts();

  const [isOpen, setIsOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${Date.now()}`);
  const [supplierInvoiceNumber, setSupplierInvoiceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [receiptId, setReceiptId] = useState("none");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  
  const [items, setItems] = useState<{ variation_id: string; quantity_billed: number; unit_price: number; amount: number }[]>([]);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handleAddItem = () => {
    if (!selectedVariation || qty <= 0 || price < 0) return;
    
    setItems([...items, { 
      variation_id: selectedVariation, 
      quantity_billed: qty, 
      unit_price: price,
      amount: qty * price
    }]);
    setSelectedVariation("");
    setQty(1);
    setPrice(0);
  };

  const handleCreate = async () => {
    if (!supplierId || !supplierInvoiceNumber || items.length === 0) return;
    try {
      await createInvoice({
        invoice: {
          supplier_id: supplierId,
          purchase_receipt_id: receiptId === "none" ? null : receiptId,
          invoice_number: invoiceNumber,
          supplier_invoice_number: supplierInvoiceNumber,
          invoice_date: invoiceDate,
          due_date: dueDate,
          status: "Unpaid",
          total_amount: 0 // Will be calculated in service
        },
        items,
      });
      setIsOpen(false);
      setItems([]);
      setInvoiceNumber(`INV-${Date.now()}`);
      setSupplierInvoiceNumber("");
    } catch (e) {
      // handled
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Supplier Due (AP Invoices)</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Bill / Invoice</Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record Supplier Invoice (Accounts Payable)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Internal Invoice No.</Label>
                  <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Supplier Invoice No.</Label>
                  <Input value={supplierInvoiceNumber} onChange={e => setSupplierInvoiceNumber(e.target.value)} placeholder="Provided by supplier" />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>
                      {suppliers?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Linked Receipt (Optional)</Label>
                  <Select value={receiptId} onValueChange={setReceiptId}>
                    <SelectTrigger><SelectValue placeholder="Select receipt" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">-- No Receipt --</SelectItem>
                      {receipts?.filter(r => r.supplier_id === supplierId || !supplierId).map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.receipt_number}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Invoice Date</Label>
                  <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>
              </div>

              <div className="border p-4 rounded-md space-y-4 bg-muted/20">
                <h3 className="font-semibold">Billed Items</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product Variation</Label>
                    <Select value={selectedVariation} onValueChange={setSelectedVariation}>
                      <SelectTrigger><SelectValue placeholder="Select variation" /></SelectTrigger>
                      <SelectContent>
                        {products?.map(p => (
                          p.product_variations?.map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>{p.name} - {v.sku}</SelectItem>
                          ))
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input type="number" min="1" value={qty} onChange={e => setQty(Number(e.target.value))} />
                  </div>
                  <div className="w-32">
                    <Label>Unit Price</Label>
                    <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} />
                  </div>
                  <Button type="button" onClick={handleAddItem}>Add</Button>
                </div>

                {items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variation ID</TableHead>
                        <TableHead className="text-right">Qty Billed</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-mono text-xs">{it.variation_id}</TableCell>
                          <TableCell className="text-right">{it.quantity_billed}</TableCell>
                          <TableCell className="text-right">${it.unit_price}</TableCell>
                          <TableCell className="text-right font-bold">${it.amount}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Button onClick={handleCreate} className="w-full" disabled={isCreating || items.length === 0 || !supplierInvoiceNumber}>
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Record Invoice
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice No.</TableHead>
              <TableHead>Supplier Ref.</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : invoices?.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center">
                    <FileSpreadsheet className="w-4 h-4 mr-2 text-red-500" />
                    {inv.invoice_number}
                  </div>
                </TableCell>
                <TableCell>{inv.supplier_invoice_number}</TableCell>
                {/* @ts-ignore */}
                <TableCell>{inv.suppliers?.name}</TableCell>
                <TableCell>{new Date(inv.due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">{inv.status}</span>
                </TableCell>
                <TableCell className="text-right font-bold">${inv.total_amount}</TableCell>
              </TableRow>
            ))}
            {(!invoices || invoices.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No invoices found.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
