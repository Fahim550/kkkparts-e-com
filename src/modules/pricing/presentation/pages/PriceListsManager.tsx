import React, { useState } from "react";
import { usePriceLists, usePriceListItems } from "../hooks/usePricing";
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
import { Loader2, Plus, Tag, DollarSign, Check, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PriceListsManager() {
  const { priceLists, isLoading, createPriceList } = usePriceLists();
  const [selectedList, setSelectedList] = useState<string | null>(null);

  // New list state
  const [isNewListOpen, setIsNewListOpen] = useState(false);
  const [listName, setListName] = useState("");
  const [listCurrency, setListCurrency] = useState("BDT");
  
  const handleCreateList = async () => {
    if (!listName) return;
    try {
      await createPriceList({ name: listName, currency: listCurrency, is_tax_included: false, is_active: true });
      setIsNewListOpen(false);
      setListName("");
    } catch (e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Price Lists</h1>
        <Dialog open={isNewListOpen} onOpenChange={setIsNewListOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> New Price List</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Price List</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>List Name (e.g. Retail, Wholesale)</Label>
                <Input value={listName} onChange={e => setListName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Currency</Label>
                <Input value={listCurrency} onChange={e => setListCurrency(e.target.value)} />
              </div>
              <Button onClick={handleCreateList} className="w-full">Create List</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="col-span-1 border rounded-md p-4 bg-muted/20">
          <h2 className="font-semibold mb-4 text-sm text-muted-foreground uppercase tracking-wider">Available Lists</h2>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : (
            <div className="space-y-2">
              {priceLists?.map(list => (
                <button
                  key={list.id}
                  onClick={() => setSelectedList(list.id)}
                  className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${selectedList === list.id ? 'bg-primary text-primary-foreground font-medium' : 'hover:bg-muted'}`}
                >
                  <Tag className="w-4 h-4 inline-block mr-2 opacity-70" />
                  {list.name}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="col-span-1 md:col-span-3 border rounded-md p-6 bg-card">
          {selectedList ? (
            <PriceListDetails listId={selectedList} listName={priceLists?.find(l => l.id === selectedList)?.name || ""} />
          ) : (
            <div className="text-center text-muted-foreground py-12 flex flex-col items-center">
              <DollarSign className="w-12 h-12 mb-4 text-muted-foreground/30" />
              <p>Select a price list from the sidebar to manage item prices.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PriceListDetails({ listId, listName }: { listId: string, listName: string }) {
  const { items, isLoading, setItemPrice } = usePriceListItems(listId);
  const { products } = useProducts();
  
  const [variationId, setVariationId] = useState("");
  const [price, setPrice] = useState(0);

  const handleSetPrice = async () => {
    if (!variationId || price <= 0) return;
    
    // Find the product to get its uom
    let uomId = "";
    for (const p of products || []) {
      const v = p.product_variations?.find((x: any) => x.id === variationId);
      if (v) {
        uomId = p.base_uom_id;
        break;
      }
    }
    
    if (!uomId) return;

    try {
      await setItemPrice({
        price_list_id: listId,
        variation_id: variationId,
        uom_id: uomId,
        price: price
      });
      setVariationId("");
      setPrice(0);
    } catch(e) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-xl font-semibold flex items-center"><Tag className="w-5 h-5 mr-2 text-indigo-500" /> {listName} Prices</h2>
      </div>

      <div className="grid grid-cols-3 gap-4 items-end bg-muted/30 p-4 rounded-md border">
        <div className="col-span-1">
          <Label>Product Variation</Label>
          <Select value={variationId} onValueChange={setVariationId}>
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
        <div className="col-span-1">
          <Label>Price</Label>
          <Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(Number(e.target.value))} />
        </div>
        <div className="col-span-1">
          <Button onClick={handleSetPrice} className="w-full" disabled={!variationId || price <= 0}>Set Price</Button>
        </div>
      </div>

      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product SKU</TableHead>
              <TableHead>UOM</TableHead>
              <TableHead className="text-right">Set Price</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={3} className="text-center py-4"><Loader2 className="animate-spin w-6 h-6 mx-auto" /></TableCell></TableRow>
            ) : items?.map((item) => (
              <TableRow key={item.id}>
                {/* @ts-ignore */}
                <TableCell className="font-medium">{item.product_variations?.products?.name} - {item.product_variations?.sku}</TableCell>
                {/* @ts-ignore */}
                <TableCell>{item.units_of_measure?.abbreviation}</TableCell>
                <TableCell className="text-right font-mono font-bold text-green-600">${Number(item.price).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {(!items || items.length === 0) && !isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No items have prices set in this list yet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
