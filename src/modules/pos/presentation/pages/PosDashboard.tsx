import React, { useState, useEffect } from "react";
import { usePosSession } from "../hooks/usePosSession";
import { useWarehouses } from "../../../warehouse/presentation/hooks/useWarehouses";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Monitor, Play, Square, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PosDashboard() {
  const {
    registers,
    isLoadingRegisters,
    currentShift,
    isLoadingShift,
    openShift,
    isOpening,
    closeShift,
    isClosing,
    createRegister,
    isCreatingRegister,
  } = usePosSession();

  const { warehouses } = useWarehouses();
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [newRegisterName, setNewRegisterName] = useState<string>("");
  const [newRegisterWarehouseId, setNewRegisterWarehouseId] = useState<string>("");

  const navigate = useNavigate();

  // Auto-select first register if none selected
  useEffect(() => {
    if (!selectedRegister && registers && registers.length > 0) {
      setSelectedRegister(registers[0].id);
    }
  }, [registers, selectedRegister]);

  // Pre-fill warehouse for new register
  useEffect(() => {
    if (warehouses && warehouses.length > 0 && !newRegisterWarehouseId) {
      setNewRegisterWarehouseId(warehouses[0].id);
    }
  }, [warehouses, newRegisterWarehouseId]);

  if (isLoadingRegisters || isLoadingShift) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const handleCreateRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegisterName.trim() || !newRegisterWarehouseId) return;
    try {
      const created = await createRegister({
        name: newRegisterName.trim(),
        warehouseId: newRegisterWarehouseId,
      });
      if (created?.id) {
        setSelectedRegister(created.id);
      }
      setIsCreateOpen(false);
      setNewRegisterName("");
    } catch (err) {}
  };

  const handleOpenShift = async () => {
    if (!selectedRegister) return;
    try {
      await openShift({ registerId: selectedRegister, openingCash });
      navigate("/admin/pos/terminal");
    } catch (e) {}
  };

  const handleCloseShift = async () => {
    if (!currentShift) return;
    try {
      await closeShift({ shiftId: currentShift.id, closingCashActual: closingCash });
    } catch (e) {}
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale (POS)</h1>
          <p className="text-sm text-muted-foreground">Manage cash registers and open/close shifts to process store sales.</p>
        </div>
      </div>

      {currentShift ? (
        <Card className="border-green-200 bg-green-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center">
              <Monitor className="w-5 h-5 mr-2" /> Shift Open
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm text-green-900">
              <div>
                <span className="font-semibold">Opened At: </span>
                {new Date(currentShift.opened_at).toLocaleString()}
              </div>
              <div>
                <span className="font-semibold">Opening Cash: </span>
                OMR {Number(currentShift.opening_cash).toFixed(3)}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button size="lg" className="flex-1 bg-emerald-600 hover:bg-emerald-700" onClick={() => navigate("/admin/pos/terminal")}>
                Go to Terminal
              </Button>
            </div>

            <div className="border-t border-green-200 pt-6 mt-6 space-y-4">
              <h3 className="font-semibold text-green-900">Close Shift</h3>
              <div className="space-y-2 max-w-xs">
                <Label>Actual Cash in Drawer (OMR)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.001"
                  value={closingCash}
                  onChange={(e) => setClosingCash(Number(e.target.value))}
                />
              </div>
              <Button variant="destructive" onClick={handleCloseShift} disabled={isClosing}>
                {isClosing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Square className="w-4 h-4 mr-2" /> End Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-sm border">
          <CardHeader>
            <CardTitle>Open a Register Shift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="font-medium">Select Register</Label>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 h-8 px-2 text-xs">
                      <Plus className="w-3.5 h-3.5 mr-1" /> Create Register
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create New POS Register</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreateRegister} className="space-y-4 pt-2">
                      <div className="space-y-2">
                        <Label>Register Name <span className="text-red-500">*</span></Label>
                        <Input
                          placeholder="e.g. Counter 3 / Main Cashier"
                          value={newRegisterName}
                          onChange={(e) => setNewRegisterName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Assigned Warehouse / Shop <span className="text-red-500">*</span></Label>
                        <Select
                          value={newRegisterWarehouseId}
                          onValueChange={setNewRegisterWarehouseId}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select warehouse" />
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
                      <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                          Cancel
                        </Button>
                        <Button type="submit" disabled={isCreatingRegister || !newRegisterName.trim()}>
                          {isCreatingRegister && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Save Register
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              <select
                className="w-full border rounded-md p-2 bg-white text-sm"
                value={selectedRegister}
                onChange={(e) => setSelectedRegister(e.target.value)}
              >
                <option value="">-- Select Register --</option>
                {registers?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
              {(!registers || registers.length === 0) && (
                <p className="text-xs text-amber-600 mt-1">
                  No registers found. Click &quot;Create Register&quot; above to add one.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="font-medium">Opening Cash Amount (OMR)</Label>
              <Input
                type="number"
                min="0"
                step="0.001"
                placeholder="0.000"
                value={openingCash}
                onChange={(e) => setOpeningCash(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground">Initial cash placed in the register drawer at start of shift.</p>
            </div>

            <Button onClick={handleOpenShift} disabled={isOpening || !selectedRegister} className="w-full">
              {isOpening && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <Play className="w-4 h-4 mr-2" /> Open Shift & Start Selling
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
