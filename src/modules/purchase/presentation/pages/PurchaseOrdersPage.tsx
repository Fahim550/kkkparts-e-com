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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAddProduct, useProducts } from "@/hooks/useDatabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Eye, FileText, Loader2, Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { z } from "zod";
import { useCategories } from "../../../product/presentation/hooks/useCategories";
import { useCreateProductVariation } from "../../../product/presentation/hooks/useProducts";
import { useUOMs } from "../../../product/presentation/hooks/useUOMs";
import ProductFormModal from "../../../product/presentation/pages/ProductFormModal";
import { SupplierSchema } from "../../../supplier/domain/validations";
import { useSuppliers } from "../../../supplier/presentation/hooks/useSuppliers";
import { usePurchaseOrders } from "../hooks/usePurchaseOrders";

export default function PurchaseOrdersPage() {
  // ── Filter state (backend-driven) ──────────────────────────────────────
  const [filterSearch, setFilterSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterSupplier, setFilterSupplier] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");

  const filters = {
    ...(filterSearch ? { search: filterSearch } : {}),
    ...(filterStatus ? { status: filterStatus } : {}),
    ...(filterSupplier ? { supplierId: filterSupplier } : {}),
    ...(filterDateFrom ? { dateFrom: filterDateFrom } : {}),
    ...(filterDateTo ? { dateTo: filterDateTo } : {}),
  };

  const { orders, isLoading, createOrder, isCreating } =
    usePurchaseOrders(filters);
  const { suppliers, createSupplier, payableAccounts, isCreating: isCreatingSupplier } = useSuppliers();
  const { data: products = [], refetch: refetchProducts } = useProducts();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // ── Quick-create: Supplier ──
  const [supplierDialogOpen, setSupplierDialogOpen] = useState(false);
  const supplierForm = useForm<z.infer<typeof SupplierSchema>>({
    resolver: zodResolver(SupplierSchema),
    defaultValues: { is_active: true, name: "", contact_email: "", contact_phone: "", address: "", tax_id: "" },
  });
  const handleQuickCreateSupplier = async (data: z.infer<typeof SupplierSchema>) => {
    try {
      const newSupplier = await createSupplier({
        ...data,
        contact_email: data.contact_email || null,
        contact_phone: data.contact_phone || null,
        address: data.address || null,
        tax_id: data.tax_id || null,
      });
      setSupplierId((newSupplier as any).id);
      setSupplierDialogOpen(false);
      supplierForm.reset();
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    }
  };

  // ── Quick-create: Product ──
  const [productDialogOpen, setProductDialogOpen] = useState(false);

  const [isOpen, setIsOpen] = useState(false);
  const [poNumber, setPoNumber] = useState(`PO-${Date.now()}`);

  useEffect(() => {
    if (isOpen) {
      setPoNumber(`PO-${Date.now()}`);
    }
  }, [isOpen]);
  const [supplierId, setSupplierId] = useState("");
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Minimal item management for UI
  const [items, setItems] = useState<
    {
      variation_id: string;
      uom_id: string;
      quantity_ordered: number;
      unit_price: number;
      display_name?: string;
    }[]
  >([]);
  const [selectedVariation, setSelectedVariation] = useState("");
  const [qty, setQty] = useState(1);
  const [price, setPrice] = useState(0);

  const handleAddItem = () => {
    if (!selectedVariation || qty <= 0 || price < 0) return;
    const product = products.find((p) =>
      p.product_variations?.some((v: any) => v.id === selectedVariation),
    );
    if (!product || !product.base_uom_id) return;
    const variation = product.product_variations?.find(
      (v: any) => v.id === selectedVariation,
    );
    const uom_id = product.base_uom_id;
    setItems([
      ...items,
      {
        variation_id: selectedVariation,
        uom_id,
        quantity_ordered: qty,
        unit_price: price,
        display_name: `${product.name} - ${variation?.sku || ""}`,
      },
    ]);
    setSelectedVariation("");
    setQty(1);
    setPrice(0);
  };

  const handleCreate = async () => {
    if (!supplierId || items.length === 0) return;
    try {
      await createOrder({
        po: {
          supplier_id: supplierId,
          po_number: poNumber,
          order_date: orderDate,
          status: "Draft",
        },
        items: items.map(({ display_name, ...rest }) => rest),
      });
      setIsOpen(false);
      setItems([]);
      setPoNumber(`PO-${Date.now()}`);
    } catch (e) {
      // Error handled by hook
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" /> New PO
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create Purchase Order</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>PO Number</Label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Supplier</Label>
                  <div className="flex gap-2 items-center">
                    <Select value={supplierId} onValueChange={setSupplierId}>
                      <SelectTrigger className="flex-1">
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
                    {/* Quick-create Supplier */}
                    <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon" title="Create new supplier">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Quick Create Supplier</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={supplierForm.handleSubmit(handleQuickCreateSupplier)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2 space-y-1">
                              <Label>Supplier Name <span className="text-red-500">*</span></Label>
                              <Input {...supplierForm.register("name")} placeholder="e.g. Dhaka Auto Parts" />
                              {supplierForm.formState.errors.name && (
                                <p className="text-xs text-red-500">{supplierForm.formState.errors.name.message}</p>
                              )}
                            </div>
                            <div className="space-y-1">
                              <Label>Contact Email</Label>
                              <Input {...supplierForm.register("contact_email")} type="email" placeholder="email@example.com" />
                            </div>
                            <div className="space-y-1">
                              <Label>Contact Phone</Label>
                              <Input {...supplierForm.register("contact_phone")} placeholder="Phone number" />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label>Address</Label>
                              <Input {...supplierForm.register("address")} placeholder="Full address" />
                            </div>
                            <div className="space-y-1">
                              <Label>Tax ID</Label>
                              <Input {...supplierForm.register("tax_id")} placeholder="Optional" />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <Label>Payable Account <span className="text-red-500">*</span></Label>
                              <Select
                                value={supplierForm.watch("payable_account_id")}
                                onValueChange={(v) => supplierForm.setValue("payable_account_id", v)}
                              >
                                <SelectTrigger><SelectValue placeholder="Select account..." /></SelectTrigger>
                                <SelectContent>
                                  {payableAccounts?.map((acc) => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name} ({acc.account_number})</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {supplierForm.formState.errors.payable_account_id && (
                                <p className="text-xs text-red-500">{supplierForm.formState.errors.payable_account_id.message}</p>
                              )}
                            </div>
                            <div className="col-span-2 flex items-center gap-2 pt-1 border-t">
                              <Switch
                                checked={supplierForm.watch("is_active")}
                                onCheckedChange={(v) => supplierForm.setValue("is_active", v)}
                              />
                              <Label>Active Supplier</Label>
                            </div>
                          </div>
                          <Button type="submit" className="w-full" disabled={isCreatingSupplier}>
                            {isCreatingSupplier && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Create Supplier
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <div>
                  <Label>Order Date</Label>
                  <Input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="border p-4 rounded-md space-y-4">
                <h3 className="font-semibold">Add Items</h3>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Product Variation</Label>
                    <div className="flex gap-2 items-center mt-1">
                      <Select
                        value={selectedVariation}
                        onValueChange={setSelectedVariation}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select variation" />
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((p) =>
                            p.product_variations?.map((v: any) => (
                              <SelectItem key={v.id} value={v.id}>
                                {p.name} - {v.sku}
                              </SelectItem>
                            )),
                          )}
                        </SelectContent>
                      </Select>
                      {/* Quick-create Product */}
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="icon" 
                        title="Create new product"
                        onClick={() => setProductDialogOpen(true)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                      <ProductFormModal 
                        isOpen={productDialogOpen}
                        onOpenChange={setProductDialogOpen}
                        product={null}
                        onSuccess={async (product, variation) => {
                          await refetchProducts();
                          queryClient.invalidateQueries({ queryKey: ["products"] });
                          if (variation) {
                            setSelectedVariation(variation.id);
                          } else if (product?.product_variations?.[0]) {
                            setSelectedVariation(product.product_variations[0].id);
                          }
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-24">
                    <Label>Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={qty}
                      onChange={(e) => setQty(Number(e.target.value))}
                    />
                  </div>
                  <div className="w-32">
                    <Label>Unit Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                    />
                  </div>
                  <Button type="button" onClick={handleAddItem}>
                    Add
                  </Button>
                </div>

                {items.length > 0 && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((it, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="text-sm">
                            {it.display_name || it.variation_id}
                          </TableCell>
                          <TableCell className="text-right">
                            {it.quantity_ordered}
                          </TableCell>
                          <TableCell className="text-right">
                            ${it.unit_price}
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            ${it.quantity_ordered * it.unit_price}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={isCreating || items.length === 0}
              >
                {isCreating && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Create Purchase Order
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── Filter Bar ── */}
      <div className="flex flex-wrap gap-3 items-end p-3 border rounded-lg bg-muted/10">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search PO number..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
          />
          {filterSearch && (
            <button
              onClick={() => setFilterSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          )}
        </div>
        <div className="w-44">
          <Select
            value={filterSupplier || "all"}
            onValueChange={(v) => setFilterSupplier(v === "all" ? "" : v)}
          >
            <SelectTrigger>
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
        </div>
        <div className="w-36">
          <Select
            value={filterStatus || "all"}
            onValueChange={(v) => setFilterStatus(v === "all" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Received">Received</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
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
        {(filterSearch ||
          filterStatus ||
          filterSupplier ||
          filterDateFrom ||
          filterDateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setFilterSearch("");
              setFilterStatus("");
              setFilterSupplier("");
              setFilterDateFrom("");
              setFilterDateTo("");
            }}
          >
            <X className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>PO Number</TableHead>
              <TableHead>Supplier</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto" />
                </TableCell>
              </TableRow>
            ) : (
              orders?.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <FileText className="w-4 h-4 mr-2 text-muted-foreground" />
                      {order.po_number}
                    </div>
                  </TableCell>
                  {/* @ts-ignore */}
                  <TableCell>{order.suppliers?.name}</TableCell>
                  <TableCell>
                    {new Date(order.order_date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="px-2 py-1 rounded-full text-xs bg-secondary">
                      {order.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    ${order.total_amount}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link to={`/admin/purchase-orders/${order.id}`}>
                      <Button variant="ghost" size="icon">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
            {(!orders || orders.length === 0) && !isLoading && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  No Purchase Orders found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
