import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useProductTemplates,
  useDeleteProductTemplate,
} from "../hooks/useProducts";
import { ProductTemplateWithDetails } from "../../domain/types";
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
import { Loader2, Plus, Edit, Trash2, Box, ImageIcon, X } from "lucide-react";
import ProductFormModal from "./ProductFormModal";

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: products, isLoading } = useProductTemplates();
  const deleteProduct = useDeleteProductTemplate();

  const [isOpen, setIsOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductTemplateWithDetails | null>(null);
  const [search, setSearch] = useState(() => searchParams.get("search") || "");

  useEffect(() => {
    const q = searchParams.get("search");
    if (q !== null) {
      setSearch(q);
    }
  }, [searchParams]);

  const filteredProducts = products?.filter((p) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (p.name && p.name.toLowerCase().includes(q)) || 
      (p.item_code && p.item_code.toLowerCase().includes(q)) ||
      (p.brand?.name && p.brand.name.toLowerCase().includes(q)) ||
      (p.category?.name && p.category.name.toLowerCase().includes(q)) ||
      (p.variations && p.variations.some((v: any) => v.sku && v.sku.toLowerCase().includes(q)))
    );
  }) || [];

  const handleEdit = (product: ProductTemplateWithDetails) => {
    setEditingProduct(product);
    setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this product? All variations will be deleted too.")) {
      await deleteProduct.mutateAsync(id);
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  if (isLoading)
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products Management</h1>
          <p className="text-sm text-muted-foreground">Manage products and variations</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setIsOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Product
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <div className="relative max-w-sm w-full">
          <Input 
            placeholder="Search by product name, code, brand..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSearchParams(e.target.value ? { search: e.target.value } : {});
            }}
            className="pr-8"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setSearchParams({});
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {search && (
          <span className="text-xs text-muted-foreground">
            Found {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-14">Image</TableHead>
              <TableHead>Item Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Price (OMR)</TableHead>
              <TableHead>Variants</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <div className="w-10 h-10 rounded-md border bg-muted/30 flex items-center justify-center overflow-hidden shrink-0">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon className="w-4 h-4 text-muted-foreground/40" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{product.item_code}</TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>{product.category?.name}</TableCell>
                <TableCell>{product.brand?.name || "—"}</TableCell>
                <TableCell className="font-semibold text-blue-600">
                  {(product as any).price != null ? Number((product as any).price).toFixed(2) : "0.00"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Box className="w-4 h-4 text-muted-foreground" />
                    {product.variations?.length || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${product.is_active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {product.is_active ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleEdit(product)}
                  >
                    <Edit className="w-4 h-4 text-blue-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(product.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredProducts.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ProductFormModal 
        isOpen={isOpen} 
        onOpenChange={handleOpenChange} 
        product={editingProduct} 
      />
    </div>
  );
}
