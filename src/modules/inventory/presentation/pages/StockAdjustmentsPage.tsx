import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, ChevronsUpDown, Loader2, Settings2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useProductTemplates } from "../../../product/presentation/hooks/useProducts";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { useInventory } from "../hooks/useInventory";

export default function StockAdjustmentsPage() {
  const { adjustStock, writeOffDamage, isAdjusting, isWritingOff } =
    useInventory();
  const { warehouses } = useWarehouses();
  const { data: products } = useProductTemplates();

  // General Adjustment State
  const [adjWarehouseId, setAdjWarehouseId] = useState("");
  const [adjVariationId, setAdjVariationId] = useState("");
  const [adjQuantity, setAdjQuantity] = useState(0);
  const [adjUnitCost, setAdjUnitCost] = useState<number | "">("");
  const [adjReason, setAdjReason] = useState("");

  // Average cost fetched from FIFO layers (for reference on negative adjustments)
  const [avgCost, setAvgCost] = useState<number | null>(null);
  const [isFetchingCost, setIsFetchingCost] = useState(false);

  // Combobox open states for variation pickers
  const [adjVariationOpen, setAdjVariationOpen] = useState(false);
  const [dmgVariationOpen, setDmgVariationOpen] = useState(false);

  // Damage Write-off State
  const [dmgWarehouseId, setDmgWarehouseId] = useState("");
  const [dmgVariationId, setDmgVariationId] = useState("");
  const [dmgQuantity, setDmgQuantity] = useState(1);
  const [dmgReason, setDmgReason] = useState("");

  // Flatten all variations for easy lookup
  const allVariations = useMemo(
    () =>
      products?.flatMap((p) =>
        (p.variations ?? []).map((v: any) => ({
          id: v.id as string,
          label: `${p.name} — ${v.sku}`,
          productName: p.name as string,
          sku: v.sku as string,
        }))
      ) ?? [],
    [products],
  );

  const isPositive = adjQuantity > 0;
  const isNegative = adjQuantity < 0;
  const absQty = Math.abs(adjQuantity);
  const effectiveUnitCost =
    typeof adjUnitCost === "number" ? adjUnitCost : 0;

  // Fetch weighted average cost from FIFO layers whenever
  // the selected product or warehouse changes.
  useEffect(() => {
    const fetchAvgCost = async () => {
      if (!adjVariationId || !adjWarehouseId) {
        setAvgCost(null);
        return;
      }
      setIsFetchingCost(true);
      try {
        const { data: layers, error } = await supabase
          .from("fifo_ledgers")
          .select("unit_cost, quantity_remaining")
          .eq("variation_id", adjVariationId)
          .eq("warehouse_id", adjWarehouseId)
          .gt("quantity_remaining", 0);

        if (error) throw error;

        if (!layers || layers.length === 0) {
          setAvgCost(null);
          return;
        }

        const totalQty = layers.reduce(
          (sum, l) => sum + Number(l.quantity_remaining),
          0
        );
        const totalValue = layers.reduce(
          (sum, l) =>
            sum + Number(l.quantity_remaining) * Number(l.unit_cost),
          0
        );
        const avg = totalQty > 0 ? totalValue / totalQty : null;
        setAvgCost(avg);

        // Auto-fill unit cost field with weighted average for negative adjustments
        if (isNegative && avg !== null) {
          setAdjUnitCost(parseFloat(avg.toFixed(2)));
        }
      } catch (_e) {
        setAvgCost(null);
      } finally {
        setIsFetchingCost(false);
      }
    };

    fetchAvgCost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjVariationId, adjWarehouseId]);

  // When quantity switches to negative and avg cost is available, auto-fill
  useEffect(() => {
    if (isNegative && avgCost !== null && adjUnitCost === "") {
      setAdjUnitCost(parseFloat(avgCost.toFixed(2)));
    }
    if (isPositive && adjUnitCost !== "" && typeof adjUnitCost === "number") {
      // keep what the user typed for positive
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adjQuantity]);

  const totalImpact =
    adjQuantity !== 0 && effectiveUnitCost > 0
      ? absQty * effectiveUnitCost
      : null;

  const handleAdjust = async () => {
    if (!adjWarehouseId || !adjVariationId || adjQuantity === 0 || !adjReason)
      return;
    // Only block submission if POSITIVE and no cost entered
    if (isPositive && effectiveUnitCost <= 0) return;

    const product = products?.find((p) =>
      p.variations?.some((v: any) => v.id === adjVariationId),
    );
    if (!product || !product.base_uom_id) return;
    try {
      await adjustStock({
        warehouse_id: adjWarehouseId,
        variation_id: adjVariationId,
        uom_id: product.base_uom_id,
        quantity: adjQuantity,
        // For negative: FIFO engine auto-consumes existing cost layers — no unit_cost needed
        unit_cost: isPositive ? effectiveUnitCost : undefined,
        reason: adjReason,
      });
      setAdjQuantity(0);
      setAdjUnitCost("");
      setAdjReason("");
      setAdjVariationId("");
      setAvgCost(null);
    } catch (e) {}
  };

  const handleDamage = async () => {
    if (!dmgWarehouseId || !dmgVariationId || dmgQuantity <= 0 || !dmgReason)
      return;
    const product = products?.find((p) =>
      p.variations?.some((v: any) => v.id === dmgVariationId),
    );
    if (!product || !product.base_uom_id) return;
    try {
      await writeOffDamage({
        warehouse_id: dmgWarehouseId,
        variation_id: dmgVariationId,
        uom_id: product.base_uom_id,
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
          Stock Adjustments &amp; Write-offs
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

            {/* How unit cost works — info panel */}
            {/* <div className="rounded-md border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-900 flex gap-3">
              <Info className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
              <div className="space-y-1.5">
                <p>
                  <strong>Adding stock (+):</strong> You must enter the{" "}
                  <strong>Unit Cost</strong> — this is what you paid per unit.
                  The system records a new FIFO cost layer so future sales
                  can calculate the correct Cost of Goods Sold (COGS).
                  <br />
                  <em>Total value added = Quantity × Unit Cost</em>
                </p>
                <p>
                  <strong>Removing stock (−) — product missing:</strong> No
                  unit cost entry required. The system automatically deducts
                  cost from the <em>oldest</em> FIFO layers (First-In,
                  First-Out). The average cost shown below is for your
                  reference and to preview the inventory value impact.
                </p>
              </div>
            </div> */}

            <div className="grid grid-cols-2 gap-4 pt-2">
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
                <Popover open={adjVariationOpen} onOpenChange={setAdjVariationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={adjVariationOpen}
                      className="w-full justify-between font-normal bg-background px-3 h-10"
                    >
                      <span className="truncate text-sm">
                        {adjVariationId
                          ? allVariations.find((v) => v.id === adjVariationId)?.label
                          : "Search product / SKU..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0 shadow-lg" align="start">
                    <Command>
                      <CommandInput placeholder="Type product name or SKU..." />
                      <CommandList>
                        <CommandEmpty>No product variation found.</CommandEmpty>
                        <CommandGroup>
                          {allVariations.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.label}
                              onSelect={() => {
                                setAdjVariationId(v.id);
                                setAdjVariationOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  adjVariationId === v.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{v.productName}</span>
                                <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Quantity Adjustment (+/−)</Label>
                <Input
                  type="number"
                  value={adjQuantity}
                  onChange={(e) => setAdjQuantity(Number(e.target.value))}
                />
                <p className="text-xs text-muted-foreground">
                  Use <strong>negative</strong> for missing stock,{" "}
                  <strong>positive</strong> for found/added stock.
                </p>
              </div>

              {/* Unit Cost — always shown, context-aware label & behaviour */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>
                    Unit Cost{" "}
                    {isPositive && (
                      <span className="text-red-500 text-xs font-semibold ml-1">
                        ★ Required
                      </span>
                    )}
                    {isNegative && (
                      <span className="text-muted-foreground text-xs font-normal ml-1">
                        (Reference — auto-filled)
                      </span>
                    )}
                  </Label>
                  {isFetchingCost && (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  )}
                </div>

                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={adjUnitCost}
                  onChange={(e) =>
                    setAdjUnitCost(
                      e.target.value === "" ? "" : Number(e.target.value),
                    )
                  }
                  disabled={adjQuantity === 0}
                  className={
                    isNegative
                      ? "border-amber-300 bg-amber-50/40"
                      : ""
                  }
                />

                {isPositive && (
                  <p className="text-xs text-muted-foreground">
                    Price you paid per unit — creates a new FIFO cost layer.
                  </p>
                )}
                {isNegative && avgCost !== null && (
                  <p className="text-xs text-amber-700">
                    Auto-filled: weighted average cost is{" "}
                    <strong>৳{avgCost.toFixed(2)}</strong> per unit. You can
                    edit for your records.
                  </p>
                )}
                {isNegative && avgCost === null && !isFetchingCost && (
                  <p className="text-xs text-muted-foreground">
                    Select warehouse &amp; product to load average cost.
                  </p>
                )}
                {adjQuantity === 0 && (
                  <p className="text-xs text-muted-foreground">
                    Enter a quantity first.
                  </p>
                )}
              </div>

              {/* Real-time inventory value impact preview */}
              {totalImpact !== null && adjQuantity !== 0 && (
                <div
                  className={`col-span-2 rounded-md p-3 flex items-center justify-between text-sm font-medium ${
                    isPositive
                      ? "bg-green-50 border border-green-200 text-green-800"
                      : "bg-red-50 border border-red-200 text-red-800"
                  }`}
                >
                  <span>
                    {isPositive ? "📦 Adding" : "📉 Removing"}{" "}
                    <strong>{absQty}</strong> unit
                    {absQty !== 1 ? "s" : ""} @ ৳
                    {effectiveUnitCost.toFixed(2)} each
                  </span>
                  <span className="font-bold">
                    Inventory Value {isPositive ? "+" : "−"} ৳
                    {totalImpact.toFixed(2)}
                  </span>
                </div>
              )}

              <div className="space-y-2 col-span-2">
                <Label>Reason</Label>
                <Textarea
                  value={adjReason}
                  onChange={(e) => setAdjReason(e.target.value)}
                  placeholder="E.g., Found during annual physical count / Product missing from shelf"
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
                (isPositive && effectiveUnitCost <= 0)
              }
            >
              {isAdjusting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
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
                <Popover open={dmgVariationOpen} onOpenChange={setDmgVariationOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={dmgVariationOpen}
                      className="w-full justify-between font-normal bg-background px-3 h-10"
                    >
                      <span className="truncate text-sm">
                        {dmgVariationId
                          ? allVariations.find((v) => v.id === dmgVariationId)?.label
                          : "Search product / SKU..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[360px] p-0 shadow-lg" align="start">
                    <Command>
                      <CommandInput placeholder="Type product name or SKU..." />
                      <CommandList>
                        <CommandEmpty>No product variation found.</CommandEmpty>
                        <CommandGroup>
                          {allVariations.map((v) => (
                            <CommandItem
                              key={v.id}
                              value={v.label}
                              onSelect={() => {
                                setDmgVariationId(v.id);
                                setDmgVariationOpen(false);
                              }}
                              className="flex items-center gap-2"
                            >
                              <Check
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  dmgVariationId === v.id ? "opacity-100" : "opacity-0",
                                )}
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{v.productName}</span>
                                <span className="text-xs text-muted-foreground font-mono">{v.sku}</span>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
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
