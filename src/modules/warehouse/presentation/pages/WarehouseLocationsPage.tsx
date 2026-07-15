import React, { useState } from "react";
import { useWarehouses } from "../hooks/useWarehouses";
import { useWarehouseLocations } from "../hooks/useWarehouseLocations";
import { WarehouseZone, WarehouseBin } from "../../domain/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  WarehouseZoneSchema,
  WarehouseBinSchema,
} from "../../domain/validations";
import { z } from "zod";
import { Loader2, Plus, Edit, Trash2, FolderTree } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ZoneFormData = z.infer<typeof WarehouseZoneSchema>;
type BinFormData = z.infer<typeof WarehouseBinSchema>;

export default function WarehouseLocationsPage() {
  const { warehouses, isLoading: isLoadingWarehouses } = useWarehouses();
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>("");

  const {
    zones,
    isLoadingZones,
    createZone,
    updateZone,
    deleteZone,
    createBin,
    updateBin,
    deleteBin,
  } = useWarehouseLocations(selectedWarehouse);

  const [isZoneOpen, setIsZoneOpen] = useState(false);
  const [isBinOpen, setIsBinOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<WarehouseZone | null>(null);
  const [editingBin, setEditingBin] = useState<WarehouseBin | null>(null);
  const [activeZoneId, setActiveZoneId] = useState<string>("");

  const zoneForm = useForm<ZoneFormData>({
    resolver: zodResolver(WarehouseZoneSchema),
  });

  const binForm = useForm<BinFormData>({
    resolver: zodResolver(WarehouseBinSchema),
  });

  const onZoneSubmit = async (data: ZoneFormData) => {
    if (editingZone) {
      await updateZone({ id: editingZone.id, ...data });
    } else {
      await createZone(data);
    }
    setIsZoneOpen(false);
    zoneForm.reset();
    setEditingZone(null);
  };

  const onBinSubmit = async (data: BinFormData) => {
    if (editingBin) {
      await updateBin({ id: editingBin.id, ...data });
    } else {
      await createBin(data);
    }
    setIsBinOpen(false);
    binForm.reset();
    setEditingBin(null);
  };

  const openAddBin = (zoneId: string) => {
    setActiveZoneId(zoneId);
    binForm.setValue("zone_id", zoneId);
    setIsBinOpen(true);
  };

  if (isLoadingWarehouses)
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="animate-spin w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">
          Warehouse Locations
        </h1>
      </div>

      <div className="w-72">
        <Label>Select Warehouse</Label>
        <Select value={selectedWarehouse} onValueChange={setSelectedWarehouse}>
          <SelectTrigger>
            <SelectValue placeholder="Select a warehouse..." />
          </SelectTrigger>
          <SelectContent>
            {warehouses?.map((wh) => (
              <SelectItem key={wh.id} value={wh.id}>
                {wh.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedWarehouse && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Zones & Bins</CardTitle>
            <Dialog
              open={isZoneOpen}
              onOpenChange={(open) => {
                setIsZoneOpen(open);
                if (!open) {
                  zoneForm.reset();
                  setEditingZone(null);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" /> Add Zone
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingZone ? "Edit Zone" : "Create New Zone"}
                  </DialogTitle>
                </DialogHeader>
                <form
                  onSubmit={zoneForm.handleSubmit(onZoneSubmit)}
                  className="space-y-4"
                >
                  <input
                    type="hidden"
                    {...zoneForm.register("warehouse_id", {
                      value: selectedWarehouse,
                    })}
                  />
                  <div>
                    <Label>Code</Label>
                    <Input
                      {...zoneForm.register("code")}
                      placeholder="e.g. Z1"
                    />
                  </div>
                  <div>
                    <Label>Name</Label>
                    <Input
                      {...zoneForm.register("name")}
                      placeholder="e.g. Zone 1"
                    />
                  </div>
                  <Button type="submit" className="w-full">
                    {editingZone ? "Update" : "Create"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoadingZones ? (
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin w-6 h-6" />
              </div>
            ) : (
              <div className="space-y-6">
                {zones?.map((zone) => (
                  <div
                    key={zone.id}
                    className="border rounded-md p-4 bg-muted/20"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <FolderTree className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg">
                          {zone.name}{" "}
                          <span className="text-muted-foreground text-sm">
                            ({zone.code})
                          </span>
                        </h3>
                      </div>
                      <div className="space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAddBin(zone.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Add Bin
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingZone(zone);
                            zoneForm.setValue(
                              "warehouse_id",
                              zone.warehouse_id,
                            );
                            zoneForm.setValue("code", zone.code);
                            zoneForm.setValue("name", zone.name);
                            setIsZoneOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-blue-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("Delete zone?")) deleteZone(zone.id);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Barcode</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {zone.bins?.map((bin) => (
                          <TableRow key={bin.id}>
                            <TableCell className="font-medium">
                              {bin.code}
                            </TableCell>
                            <TableCell>{bin.name}</TableCell>
                            <TableCell>{bin.barcode}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingBin(bin);
                                  binForm.setValue("zone_id", bin.zone_id);
                                  binForm.setValue("code", bin.code);
                                  binForm.setValue("name", bin.name);
                                  binForm.setValue(
                                    "barcode",
                                    bin.barcode || "",
                                  );
                                  setIsBinOpen(true);
                                }}
                              >
                                <Edit className="w-4 h-4 text-blue-500" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (confirm("Delete bin?")) deleteBin(bin.id);
                                }}
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!zone.bins || zone.bins.length === 0) && (
                          <TableRow>
                            <TableCell
                              colSpan={4}
                              className="text-center py-4 text-muted-foreground"
                            >
                              No bins found in this zone.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                ))}
                {(!zones || zones.length === 0) && (
                  <div className="text-center py-8 text-muted-foreground">
                    No zones configured for this warehouse.
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bin Dialog */}
      <Dialog
        open={isBinOpen}
        onOpenChange={(open) => {
          setIsBinOpen(open);
          if (!open) {
            binForm.reset();
            setEditingBin(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBin ? "Edit Bin" : "Create New Bin"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={binForm.handleSubmit(onBinSubmit)}
            className="space-y-4"
          >
            <input type="hidden" {...binForm.register("zone_id")} />
            <div>
              <Label>Code</Label>
              <Input {...binForm.register("code")} placeholder="e.g. B1" />
            </div>
            <div>
              <Label>Name</Label>
              <Input {...binForm.register("name")} placeholder="e.g. Bin 1" />
            </div>
            <div>
              <Label>Barcode (Optional)</Label>
              <Input {...binForm.register("barcode")} />
            </div>
            <Button type="submit" className="w-full">
              {editingBin ? "Update" : "Create"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
