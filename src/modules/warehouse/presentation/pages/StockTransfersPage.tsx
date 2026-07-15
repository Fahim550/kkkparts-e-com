import React from "react";
import { useWarehouses } from "../hooks/useWarehouses";
import { useStock } from "../hooks/useStock";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { StockTransferSchema } from "../../domain/validations";
import { z } from "zod";
import { Loader2, ArrowRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TransferFormData = z.infer<typeof StockTransferSchema>;

export default function StockTransfersPage() {
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const { transferStock, isTransferring } = useStock();

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

  const onSubmit = async (data: TransferFormData) => {
    await transferStock(data);
    reset();
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
                <Label>Product Variation ID</Label>
                <Input
                  {...register("variation_id")}
                  placeholder="Enter exact Variation ID for transfer"
                />
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
