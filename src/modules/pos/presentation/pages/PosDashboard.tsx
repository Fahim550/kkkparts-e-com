import React, { useState } from "react";
import { usePosSession } from "../hooks/usePosSession";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Monitor, Play, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PosDashboard() {
  const { registers, isLoadingRegisters, currentShift, isLoadingShift, openShift, isOpening, closeShift, isClosing } = usePosSession();
  const [openingCash, setOpeningCash] = useState<number>(0);
  const [closingCash, setClosingCash] = useState<number>(0);
  const [selectedRegister, setSelectedRegister] = useState<string>("");
  const navigate = useNavigate();

  if (isLoadingRegisters || isLoadingShift) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

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
      <h1 className="text-2xl font-bold tracking-tight">Point of Sale (POS)</h1>

      {currentShift ? (
        <Card className="border-green-200 bg-green-50/50">
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
                ${Number(currentShift.opening_cash).toFixed(2)}
              </div>
            </div>

            <div className="flex space-x-4">
              <Button size="lg" className="flex-1" onClick={() => navigate("/admin/pos/terminal")}>
                Go to Terminal
              </Button>
            </div>

            <div className="border-t border-green-200 pt-6 mt-6 space-y-4">
              <h3 className="font-semibold text-green-900">Close Shift</h3>
              <div className="space-y-2 max-w-xs">
                <Label>Actual Cash in Drawer</Label>
                <Input type="number" min="0" value={closingCash} onChange={e => setClosingCash(Number(e.target.value))} />
              </div>
              <Button variant="destructive" onClick={handleCloseShift} disabled={isClosing}>
                {isClosing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                <Square className="w-4 h-4 mr-2" /> End Shift
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Open a Register Shift</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Register</Label>
              <select 
                className="w-full border rounded-md p-2"
                value={selectedRegister}
                onChange={e => setSelectedRegister(e.target.value)}
              >
                <option value="">-- Select Register --</option>
                {registers?.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label>Opening Cash Amount</Label>
              <Input type="number" min="0" value={openingCash} onChange={e => setOpeningCash(Number(e.target.value))} />
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
