import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, Loader2, Settings2 } from "lucide-react";
import { useState } from "react";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { useInventory } from "../hooks/useInventory";
import { useProductTemplates } from "../../../product/presentation/hooks/useProducts";

export default function StockAdjustmentsPage() {
  const { adjustStock, writeOffDamage, isAdjusting, isWritingOff } =
    useInventory();
  const { warehouses } = useWarehouses();
  const { data: products } = useProductTemplates();

  // General Adjustment State
  const [adjWarehouseId, setAdjWarehouseId] = useState("");
  const [adjVariationId, setAdjVariationId] = useState("");
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjUnitCost, setAdjUnitCost] = useState(0);
  const [adjReason, setAdjReason] = useState("");

  // Damage Write-off State
  const [dmgWarehouseId, setDmgWarehouseId] = useState("");
  const [dmgVariationId, setDmgVariationId] = useState("");
  const [dmgQuantity, setDmgQuantity] = useState(1);
  const [dmgReason, setDmgReason] = useState("");

  const handleAdjust = async () => {
    if (!adjWarehouseId || !adjVariationId || adjQuantity === 0 || !adjReason)
      return;
    try {
      await adjustStock({
        warehouse_id: adjWarehouseId,
        variation_id: adjVariationId,
        uom_id: "00000000-0000-0000-0000-000000000000", // placeholder
        quantity: adjQuantity,
        unit_cost: adjQuantity > 0 ? adjUnitCost : undefined,
        reason: adjReason,
      });
      setAdjQuantity(0);
      setAdjUnitCost(0);
      setAdjReason("");
      setAdjVariationId("");
    } catch (e) {}
  };

  const handleDamage = async () => {
    if (!dmgWarehouseId || !dmgVariationId || dmgQuantity <= 0 || !dmgReason)
      return;
    try {
      await writeOffDamage({
        warehouse_id: dmgWarehouseId,
        variation_id: dmgVariationId,
        uom_id: "00000000-0000-0000-0000-000000000000", // placeholder
        quantity: dmgQuantity,
        reason: dmgReason,
      });
      setDmgQuantity(1);
      setDmgReason("");
      setDmgVariationId("");
    } catch (e) {}
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Stock Adjustments & Write-offs
        </h1>
      </div>

      <Tabs defaultValue="adjustment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="adjustment">
            <Settings2 className="w-4 h-4 mr-2" /> General Adjustment
          </TabsTrigger>
          <TabsTrigger
            value="damage"
            className="text-red-500 data-[state=active]:text-red-600"
          >
            <AlertTriangle className="w-4 h-4 mr-2" /> Damage Write-off
          </TabsTrigger>
        </TabsList>

        <TabsContent value="adjustment" className="mt-4">
          <div className="border p-6 rounded-md bg-card shadow-sm space-y-4">
            <h2 className="text-lg font-semibold">
              General Inventory Adjustment
            </h2>
            <p className="text-sm text-muted-foreground">
              Adjust stock levels due to physical count discrepancies, found
              inventory, or other reasons. Automatically handled by the
              Inventory Engine.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select
                  value={adjWarehouseId}
                  onValueChange={setAdjWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Variation</Label>
                <Select
                  value={adjVariationId}
                  onValueChange={setAdjVariationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variation" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) =>
                      p.variations?.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {p.name} - {v.sku}
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity Adjustment (+/-)</Label>
                <Input
                  type="number"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Use negative for deduction, positive for addition.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Unit Cost (Required if positive)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={adjUnitCost}
                  onChange={(e) => setAdjUnitCost(Number(e.target.value))}
                  disabled={adjQuantity <= 0}
                />
                <p className="text-xs text-muted-foreground">
                  Sets the FIFO cost layer for added stock.
                </p>
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Reason</Label>
                <Textarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="E.g., Found during annual physical count"
                />
              </div>
            </div>

            <Button
              onClick={handleAdjust}
              className="w-full mt-4"
              disabled={
                isAdjusting ||
                !adjWarehouseId ||
                !adjVariationId ||
                adjQuantity === 0 ||
                !adjReason ||
                (adjQuantity > 0 && adjUnitCost <= 0)
              }
            >
              {isAdjusting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Process Adjustment
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="damage" className="mt-4">
          <div className="border border-red-200 p-6 rounded-md bg-red-50/30 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-red-700">
              Damaged Stock Write-off
            </h2>
            <p className="text-sm text-red-600/80">
              Record damaged, expired, or unsellable stock. This permanently
              deducts the quantity from inventory and consumes the oldest FIFO
              cost layers.
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select
                  value={dmgWarehouseId}
                  onValueChange={setDmgWarehouseId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses?.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Product Variation</Label>
                <Select
                  value={dmgVariationId}
                  onValueChange={setDmgVariationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select variation" />
                  </SelectTrigger>
                  <SelectContent>
                    {products?.map((p) =>
                      p.variations?.map((v: any) => (
                        <SelectItem key={v.id} value={v.id}>
                          {p.name} - {v.sku}
                        </SelectItem>
                      )),
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Quantity to Write Off (Positive number)</Label>
                <Input
                  type="number"
                  min="1"
                  value={dmgQuantity}
                  onChange={(e) => setDmgQuantity(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Reason for Write-off</Label>
                <Textarea
                  value={dmgReason}
                  onChange={(e) => setDmgReason(e.target.value)}
                  placeholder="E.g., Damaged during transit, Expired"
                />
              </div>
            </div>

            <Button
              onClick={handleDamage}
              variant="destructive"
              className="w-full mt-4"
              disabled={
                isWritingOff ||
                !dmgWarehouseId ||
                !dmgVariationId ||
                dmgQuantity <= 0 ||
                !dmgReason
              }
            >
              {isWritingOff && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm Write-off
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
