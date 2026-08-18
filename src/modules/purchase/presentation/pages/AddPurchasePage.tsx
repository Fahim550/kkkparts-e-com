import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useToast } from "@/hooks/use-toast";
import { useProducts } from "@/hooks/useDatabase";
import { usePurchaseOrders } from "@/modules/purchase/presentation/hooks/usePurchaseOrders";
import { useSuppliers } from "@/modules/supplier/presentation/hooks/useSuppliers";
import { Loader2, Plus, Trash2, Upload } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUOMs } from "@/modules/product/presentation/hooks/useUOMs";

export default function AddPurchasePage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { suppliers } = useSuppliers();
  const { data: products = [] } = useProducts();
  const { data: uoms = [] } = useUOMs();
  const { createOrder, isCreating } = usePurchaseOrders();

  const [supplierId, setSupplierId] = useState("");
  const [phone, setPhone] = useState("");
  const [billNumber, setBillNumber] = useState("");
  const [billDate, setBillDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  
  const [paymentType, setPaymentType] = useState("Cash");
  const [roundOff, setRoundOff] = useState(true);

  const [items, setItems] = useState([
    { id: 1, variation_id: "", qty: 1, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
  ]);

  const handleAddRow = () => {
    setItems([
      ...items,
      { id: Date.now(), variation_id: "", qty: 1, uom: "NONE", price: 0, discountPct: 0, discountAmt: 0, taxPct: 0, taxAmt: 0, amount: 0 }
    ]);
  };

  const handleRemoveRow = (id: number) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: number, field: string, value: any) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amounts if price, qty, discount, or tax change
        if (["qty", "price", "discountPct", "discountAmt", "taxPct", "taxAmt"].includes(field)) {
          let baseAmt = (field === "qty" ? value : updated.qty) * (field === "price" ? value : updated.price);
          
          let dAmt = updated.discountAmt;
          if (field === "discountPct") {
            dAmt = baseAmt * (value / 100);
            updated.discountAmt = dAmt;
          } else if (field === "discountAmt") {
            updated.discountPct = baseAmt > 0 ? (value / baseAmt) * 100 : 0;
          }

          let afterDiscount = baseAmt - dAmt;

          let tAmt = updated.taxAmt;
          if (field === "taxPct") {
            tAmt = afterDiscount * (value / 100);
            updated.taxAmt = tAmt;
          } else if (field === "taxAmt") {
            updated.taxPct = afterDiscount > 0 ? (value / afterDiscount) * 100 : 0;
          }

          updated.amount = afterDiscount + tAmt;
        }
        return updated;
      }
      return item;
    }));
  };

  const handleProductSelect = (id: number, variationId: string) => {
    const product = products.find(p => p.product_variations?.some((v: any) => v.id === variationId));
    const variation = product?.product_variations?.find((v: any) => v.id === variationId);
    
    if (product && variation) {
      let isLastRow = false;
      const updatedItems = items.map((item, index) => {
        if (item.id === id) {
          if (index === items.length - 1) {
            isLastRow = true;
          }
          const price = Number(variation.cost_price || product.original_price || product.price || 0);
          const qty = item.qty || 1;
          return {
            ...item,
            variation_id: variationId,
            uom: product.base_uom_id || "NONE",
            price: price,
            discountPct: 0,
            discountAmt: 0,
            taxPct: 0,
            taxAmt: 0,
            amount: price * qty
          };
        }
        return item;
      });

      if (isLastRow) {
        updatedItems.push({ 
          id: Date.now(), 
          variation_id: "", 
          qty: 1, 
          uom: "NONE", 
          price: 0, 
          discountPct: 0, 
          discountAmt: 0, 
          taxPct: 0, 
          taxAmt: 0, 
          amount: 0 
        });
      }
      
      setItems(updatedItems);
    }
  };

  const totalQty = items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
  const totalDiscount = items.reduce((sum, item) => sum + (Number(item.discountAmt) || 0), 0);
  const totalTax = items.reduce((sum, item) => sum + (Number(item.taxAmt) || 0), 0);
  let totalAmount = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  
  if (roundOff) {
    totalAmount = Math.round(totalAmount);
  }

  const handleSave = async () => {
    if (!supplierId) {
      toast({ variant: "destructive", title: "Error", description: "Please select a supplier." });
      return;
    }
    
    const validItems = items.filter(i => i.variation_id && i.qty > 0);
    if (validItems.length === 0) {
      toast({ variant: "destructive", title: "Error", description: "Please add at least one valid item." });
      return;
    }

    try {
      await createOrder({
        po: {
          supplier_id: supplierId,
          po_number: billNumber || `PO-${Date.now()}`,
          order_date: billDate,
          status: "Draft",
        },
        items: validItems.map(item => ({
          variation_id: item.variation_id,
          uom_id: item.uom,
          quantity_ordered: item.qty,
          unit_price: item.price,
          // We can send discount and tax if the backend supports it, for now just what's required
        }))
      });
      
      toast({ title: "Success", description: "Purchase order created successfully." });
      navigate("/admin/purchase-orders");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto pb-20">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Purchase</h1>
      </div>

      <div className="bg-card border rounded-lg p-6 space-y-6 shadow-sm">
        {/* Header Fields */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Party *</Label>
            <Select value={supplierId} onValueChange={(val) => {
              setSupplierId(val);
              const supp = suppliers?.find(s => s.id === val);
              if (supp && supp.contact_phone) setPhone(supp.contact_phone);
            }}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Select Supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers?.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Phone No.</Label>
            <Input 
              value={phone} 
              onChange={e => setPhone(e.target.value)} 
              placeholder="Phone number"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Bill Number</Label>
            <Input 
              value={billNumber} 
              onChange={e => setBillNumber(e.target.value)} 
              placeholder="Optional"
              className="bg-background"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Bill Date</Label>
            <Input 
              type="date"
              value={billDate} 
              onChange={e => setBillDate(e.target.value)}
              className="bg-background"
            />
          </div>
        </div>

        {/* Items Grid */}
        <div className="border rounded-md overflow-hidden bg-background">
          <Table className="border-collapse">
            <TableHeader className="bg-muted">
              <TableRow className="h-10 border-b">
                <TableHead className="w-12 text-center border-r font-semibold align-middle" rowSpan={2}>#</TableHead>
                <TableHead className="min-w-[250px] border-r font-semibold align-middle" rowSpan={2}>Item / Product</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold align-middle" rowSpan={2}>Qty</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold align-middle" rowSpan={2}>Unit</TableHead>
                <TableHead className="w-28 border-r text-right font-semibold align-middle" rowSpan={2}>Price</TableHead>
                <TableHead className="w-48 border-r text-center font-semibold" colSpan={2}>Discount</TableHead>
                <TableHead className="w-48 border-r text-center font-semibold" colSpan={2}>Tax</TableHead>
                <TableHead className="w-32 text-right font-semibold align-middle" rowSpan={2}>Net Amount</TableHead>
              </TableRow>
              <TableRow className="h-8 border-b">
                <TableHead className="w-24 border-r text-center font-semibold bg-muted/50">%</TableHead>
                <TableHead className="w-24 border-r text-right font-semibold bg-muted/50">Amount</TableHead>
                <TableHead className="w-24 border-r text-center font-semibold bg-muted/50">%</TableHead>
                <TableHead className="w-24 border-r text-right font-semibold bg-muted/50">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item, index) => (
                <TableRow key={item.id} className="group border-b transition-colors hover:bg-muted/30">
                  <TableCell className="text-center border-r p-2 align-middle">
                    <div className="flex items-center justify-center gap-1">
                      <span className="w-4 text-muted-foreground font-medium">{index + 1}</span>
                      <button 
                        onClick={() => handleRemoveRow(item.id)}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Select value={item.variation_id} onValueChange={(v) => handleProductSelect(item.id, v)}>
                      <SelectTrigger className="border-0 shadow-none focus:ring-1 h-9 rounded bg-transparent">
                        <SelectValue placeholder="Select Item..." />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => 
                          p.product_variations?.map((v: any) => (
                            <SelectItem key={v.id} value={v.id}>{p.name} {v.sku ? `(${v.sku})` : ''}</SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="1" 
                      value={item.qty || ''} 
                      onChange={e => updateItem(item.id, 'qty', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                     <Select value={item.uom} onValueChange={v => updateItem(item.id, 'uom', v)}>
                      <SelectTrigger className="border-0 shadow-none focus:ring-1 h-9 rounded bg-transparent">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">NONE</SelectItem>
                        {uoms?.map((u: any) => (
                          <SelectItem key={u.id} value={u.id}>{u.abbreviation || u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0" 
                      value={item.price || ''} 
                      onChange={e => updateItem(item.id, 'price', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.discountPct || ''} 
                      onChange={e => updateItem(item.id, 'discountPct', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                     <Input 
                      type="number" 
                      min="0"
                      value={item.discountAmt || ''} 
                      onChange={e => updateItem(item.id, 'discountAmt', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.taxPct || ''} 
                      onChange={e => updateItem(item.id, 'taxPct', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-center h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="p-1 border-r">
                    <Input 
                      type="number" 
                      min="0"
                      value={item.taxAmt || ''} 
                      onChange={e => updateItem(item.id, 'taxAmt', Number(e.target.value))}
                      className="border-0 shadow-none focus-visible:ring-1 text-right h-9 rounded bg-transparent"
                    />
                  </TableCell>
                  <TableCell className="text-right pr-4 font-medium align-middle">
                    {item.amount.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Total Row */}
              <TableRow className="bg-muted/20 font-semibold">
                <TableCell colSpan={2} className="border-r p-2">
                  <Button variant="ghost" size="sm" onClick={handleAddRow} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                    <Plus className="w-4 h-4 mr-2" /> ADD ROW
                  </Button>
                </TableCell>
                <TableCell className="text-center border-r align-middle">{totalQty}</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">TOTAL</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">{totalDiscount.toFixed(2)}</TableCell>
                <TableCell className="border-r"></TableCell>
                <TableCell className="text-right border-r align-middle pr-4">{totalTax.toFixed(2)}</TableCell>
                <TableCell className="text-right pr-4 align-middle">{totalAmount.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        {/* Footer Area */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="space-y-4">
            <div className="border rounded-md p-4 bg-muted/10">
              <Label className="text-xs font-semibold text-muted-foreground uppercase mb-2 block">Terms & Conditions</Label>
              <Select>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Purchase Bill" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Purchase Bill</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" className="w-full text-blue-600 border-blue-200 hover:bg-blue-50">
              <Upload className="w-4 h-4 mr-2" /> Upload Bill
            </Button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground uppercase">Payment Type</Label>
            <Select value={paymentType} onValueChange={setPaymentType}>
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Bank">Bank Transfer</SelectItem>
                <SelectItem value="Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-end gap-2">
              <Checkbox id="round-off" checked={roundOff} onCheckedChange={(c) => setRoundOff(!!c)} />
              <Label htmlFor="round-off" className="text-sm">Round Off</Label>
            </div>
            
            <div className="flex items-center justify-between text-xl font-bold bg-muted/20 p-4 rounded-lg border">
              <span>Total</span>
              <span>{totalAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/admin/purchase-orders")}>Cancel</Button>
              <Button onClick={handleSave} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 w-32">
                {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
