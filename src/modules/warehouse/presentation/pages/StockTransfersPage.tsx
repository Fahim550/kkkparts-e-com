import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/useDatabase";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { StockTransferSchema } from "../../domain/validations";
import { useStock } from "../hooks/useStock";
import { useWarehouses } from "../hooks/useWarehouses";

type TransferFormData = z.infer<typeof StockTransferSchema>;

export default function StockTransfersPage() {
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { data: products = [] } = useProducts();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TransferFormData>({
    resolver: zodResolver(StockTransferSchema),
    defaultValues: {
      reference_type: "INTERNAL_TRANSFER",
    },
  });

  const fromWarehouseId = watch("from_warehouse_id");
  const toWarehouseId = watch("to_warehouse_id");
  const variationId = watch("variation_id");

  const { transferStock, isTransferring, balances } = useStock(fromWarehouseId);
  const [selectedBalanceId, setSelectedBalanceId] = React.useState<string>("");

  const availableQty = React.useMemo(() => {
    if (!balances || !selectedBalanceId) return 0;
    const bal = balances.find((b) => b.id === selectedBalanceId);
    return bal ? bal.quantity : 0;
  }, [balances, selectedBalanceId]);

  const onSubmit = async (data: TransferFormData) => {
    await transferStock(data);
    reset();
    setSelectedBalanceId("");
  };

  if (isLoadingWarehouses)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Stock Transfer</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Internal Stock Transfer</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source */}
              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground flex items-center">
                  Source <ArrowRight className="w-4 h-4 ml-2" />
                </h3>
                <div>
                  <Label>From Warehouse</Label>
                  <Select
                    value={fromWarehouseId}
                    onValueChange={(val) => setValue("from_warehouse_id", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.from_warehouse_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.from_warehouse_id.message}
                    </p>
                  )}
                </div>
                {/* To-Do: Add bin selection if needed */}
              </div>

              {/* Destination */}
              <div className="space-y-4">
                <h3 className="font-semibold text-muted-foreground">
                  Destination
                </h3>
                <div>
                  <Label>To Warehouse</Label>
                  <Select
                    value={toWarehouseId}
                    onValueChange={(val) => setValue("to_warehouse_id", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination warehouse..." />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses?.map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.to_warehouse_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.to_warehouse_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 border-t pt-4">
              <div>
                <Label>Source Stock (Variation - Bin)</Label>
                <Select
                  value={selectedBalanceId}
                  onValueChange={(val) => {
                    setSelectedBalanceId(val);
                    const bal = balances?.find((b) => b.id === val);
                    if (bal) {
                      setValue("variation_id", bal.variation_id, {
                        shouldValidate: true,
                      });
                      setValue("from_bin_id", bal.bin_id || undefined);
                      setValue("batch_number", bal.batch_number || undefined);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select available stock to transfer..." />
                  </SelectTrigger>
                  <SelectContent>
                    {balances
                      ?.filter((b) => b.quantity > 0)
                      .map((bal) => (
                        <SelectItem key={bal.id} value={bal.id}>
                          {bal.product_variations?.products?.name || "Unknown"}{" "}
                          - {bal.product_variations?.sku || "N/A"}
                          {bal.warehouse_bins?.name
                            ? ` (Bin: ${bal.warehouse_bins.name})`
                            : ""}
                          {bal.batch_number
                            ? ` (Batch: ${bal.batch_number})`
                            : ""}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {selectedBalanceId && (
                  <p
                    className={`text-sm mt-1 ${availableQty > 0 ? "text-green-600" : "text-amber-600"}`}
                  >
                    Available stock: {availableQty}
                  </p>
                )}
                {errors.variation_id && (
                  <p className="text-sm text-red-500 mt-1">
                    {errors.variation_id.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    {...register("quantity", { valueAsNumber: true })}
                  />
                  {errors.quantity && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.quantity.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label>Reference ID (Transfer Number)</Label>
                  <Input
                    {...register("reference_id")}
                    placeholder="e.g. TRF-001"
                  />
                  {errors.reference_id && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.reference_id.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isTransferring}>
              {isTransferring && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Transfer Stock
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
