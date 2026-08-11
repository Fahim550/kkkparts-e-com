import { useState, useMemo } from "react";
import { useProducts, useUpdateProduct } from "@/hooks/useDatabase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pencil,
  Check,
  X,
  Search,
  Tag,
  ShoppingBag,
  Users,
} from "lucide-react";
import { toast } from "sonner";

interface EditingRow {
  id: string;
  price: string;
  dealer_price: string;
}

export default function PriceListsManager() {
  const { data: products = [], isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<EditingRow | null>(null);

  const filtered = useMemo(
    () =>
      products.filter(
        (p) =>
          (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
          (p.brand || "").toLowerCase().includes(search.toLowerCase()) ||
          ((p as any).sku || "").toLowerCase().includes(search.toLowerCase())
      ),
    [products, search]
  );

  const startEdit = (p: any) => {
    setEditing({
      id: p.id,
      price: p.price != null ? String(p.price) : "",
      dealer_price: p.dealer_price != null ? String(p.dealer_price) : "",
    });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    const retailPrice = parseFloat(editing.price) || 0;
    const dealerPrice = editing.dealer_price ? parseFloat(editing.dealer_price) : null;
    try {
      await updateProduct.mutateAsync({
        id: editing.id,
        price: retailPrice,
        dealer_price: dealerPrice,
      } as any);
      toast.success("Prices updated successfully");
      setEditing(null);
    } catch {
      toast.error("Failed to update prices");
    }
  };

  const totalWithRetail = products.filter((p) => p.price && Number(p.price) > 0).length;
  const totalWithDealer = products.filter((p) => p.dealer_price && Number(p.dealer_price) > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Price List</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage retail and dealer prices for all products in one place.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2 rounded-md bg-blue-500/10">
            <ShoppingBag className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total Products</p>
            <p className="text-xl font-bold">{products.length}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2 rounded-md bg-green-500/10">
            <Tag className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">With Retail Price</p>
            <p className="text-xl font-bold">{totalWithRetail}</p>
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-card flex items-center gap-3">
          <div className="p-2 rounded-md bg-purple-500/10">
            <Users className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">With Dealer Price</p>
            <p className="text-xl font-bold">{totalWithDealer}</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by product name, brand, or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead className="hidden sm:table-cell">SKU</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead>Retail Price</TableHead>
              <TableHead>Dealer Price</TableHead>
              <TableHead className="hidden sm:table-cell">Discount</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  Loading products...
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                  No products found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((p: any) => {
                const isEditing = editing?.id === p.id;
                const retailPrice = Number(p.price) || 0;
                const dealerPrice = Number(p.dealer_price) || 0;
                const discountPct =
                  retailPrice > 0 && dealerPrice > 0
                    ? Math.round((1 - dealerPrice / retailPrice) * 100)
                    : null;

                return (
                  <TableRow key={p.id}>
                    {/* Product */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {p.image && (
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-8 h-8 rounded object-cover hidden sm:block"
                          />
                        )}
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.brand}</p>
                        </div>
                      </div>
                    </TableCell>

                    {/* SKU */}
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground font-mono">
                      {p.sku || "—"}
                    </TableCell>

                    {/* Category */}
                    <TableCell className="hidden md:table-cell text-xs">
                      {p.category || "—"}
                    </TableCell>

                    {/* Retail Price */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.price}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, price: e.target.value } : prev
                            )
                          }
                          className="w-28 h-8 text-sm"
                          autoFocus
                        />
                      ) : (
                        <span className="font-semibold text-green-600">
                          {retailPrice > 0 ? `৳${retailPrice.toFixed(2)}` : (
                            <span className="text-muted-foreground text-xs">Not set</span>
                          )}
                        </span>
                      )}
                    </TableCell>

                    {/* Dealer Price */}
                    <TableCell>
                      {isEditing ? (
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={editing.dealer_price}
                          onChange={(e) =>
                            setEditing((prev) =>
                              prev ? { ...prev, dealer_price: e.target.value } : prev
                            )
                          }
                          className="w-28 h-8 text-sm"
                        />
                      ) : (
                        <span className="font-semibold text-purple-600">
                          {dealerPrice > 0 ? `৳${dealerPrice.toFixed(2)}` : (
                            <span className="text-muted-foreground text-xs">Not set</span>
                          )}
                        </span>
                      )}
                    </TableCell>

                    {/* Discount */}
                    <TableCell className="hidden sm:table-cell">
                      {discountPct !== null && discountPct > 0 ? (
                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                          {discountPct}% off
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>

                    {/* Action */}
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={saveEdit}
                            disabled={updateProduct.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={cancelEdit}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => startEdit(p)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
