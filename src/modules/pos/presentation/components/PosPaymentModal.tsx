import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Trash2,
  Banknote,
  CreditCard,
  Landmark,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRightLeft,
  User,
} from "lucide-react";

export type PosPaymentMethod = "Cash" | "Card" | "Bank Transfer" | "Due";

export interface PosPaymentEntry {
  method: PosPaymentMethod;
  amount: number;
  reference_code?: string;
}

interface PosPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  cartItemsCount?: number;
  customerName?: string;
  onCustomerNameChange?: (name: string) => void;
  onComplete: (payments: PosPaymentEntry[]) => Promise<void> | void;
  isProcessing: boolean;
}

export default function PosPaymentModal({
  isOpen,
  onClose,
  totalAmount,
  cartItemsCount = 0,
  customerName = "",
  onCustomerNameChange,
  onComplete,
  isProcessing,
}: PosPaymentModalProps) {
  // Mode: "single" for 1-click single-tender, "split" for mixed payments
  const [mode, setMode] = useState<"single" | "split">("single");

  // Single mode state
  const [singleMethod, setSingleMethod] = useState<PosPaymentMethod>("Cash");
  const [singleAmountTendered, setSingleAmountTendered] = useState<string>("");
  const [singleReference, setSingleReference] = useState<string>("");

  // Split mode state
  interface SplitRow {
    method: PosPaymentMethod;
    amountStr: string;
    reference_code: string;
  }
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);

  // Local customer name fallback for Due
  const [localDueCustomerName, setLocalDueCustomerName] = useState("");

  // Reset/Initialize state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSingleMethod("Cash");
      setSingleAmountTendered(totalAmount > 0 ? totalAmount.toFixed(3) : "");
      setSingleReference("");
      setMode("single");
      setLocalDueCustomerName(customerName || "");
      // Preset split rows: line 1 with full total
      setSplitRows([
        {
          method: "Cash",
          amountStr: totalAmount > 0 ? totalAmount.toFixed(3) : "",
          reference_code: "",
        },
      ]);
    }
  }, [isOpen, totalAmount, customerName]);

  // Keep local customer name in sync with prop
  useEffect(() => {
    if (customerName) {
      setLocalDueCustomerName(customerName);
    }
  }, [customerName]);

  // Helper calculations for Single Mode
  const singleTenderedNum =
    singleAmountTendered === ""
      ? totalAmount
      : parseFloat(singleAmountTendered) || 0;
  const singleChange =
    singleMethod === "Cash" ? Math.max(0, singleTenderedNum - totalAmount) : 0;
  const singleRemaining = Math.max(0, totalAmount - singleTenderedNum);

  // Helper calculations for Split Mode
  const splitTotalAllocated = useMemo(() => {
    return splitRows.reduce(
      (sum, row) => sum + (parseFloat(row.amountStr) || 0),
      0
    );
  }, [splitRows]);

  const splitRemaining = Math.max(0, totalAmount - splitTotalAllocated);
  const splitCashOverpaid = useMemo(() => {
    if (splitTotalAllocated <= totalAmount) return 0;
    // Check if the overpaid portion comes from Cash
    const totalCash = splitRows
      .filter((r) => r.method === "Cash")
      .reduce((sum, r) => sum + (parseFloat(r.amountStr) || 0), 0);
    return Math.min(splitTotalAllocated - totalAmount, totalCash);
  }, [splitRows, splitTotalAllocated, totalAmount]);

  // Active payments list depending on mode
  const currentPayments: PosPaymentEntry[] = useMemo(() => {
    if (mode === "single") {
      return [
        {
          method: singleMethod,
          amount:
            singleMethod === "Cash"
              ? Math.min(singleTenderedNum, totalAmount)
              : totalAmount,
          reference_code: singleReference.trim() || undefined,
        },
      ];
    } else {
      return splitRows
        .map((r) => ({
          method: r.method,
          amount: parseFloat(r.amountStr) || 0,
          reference_code: r.reference_code.trim() || undefined,
        }))
        .filter((p) => p.amount > 0);
    }
  }, [
    mode,
    singleMethod,
    singleTenderedNum,
    totalAmount,
    singleReference,
    splitRows,
  ]);

  // Check if Due is selected in current payments
  const hasDue = useMemo(() => {
    if (mode === "single") return singleMethod === "Due";
    return splitRows.some((r) => r.method === "Due");
  }, [mode, singleMethod, splitRows]);

  const effectiveCustomerName = (
    localDueCustomerName ||
    customerName ||
    ""
  ).trim();
  const isDueValid = !hasDue || effectiveCustomerName.length > 0;

  // Validation
  const canConfirm = useMemo(() => {
    if (totalAmount <= 0) return false;
    if (isProcessing) return false;
    if (!isDueValid) return false;

    if (mode === "single") {
      if (singleMethod === "Cash") {
        return singleTenderedNum >= totalAmount - 0.001;
      }
      return true;
    } else {
      // In split mode, total allocated must cover totalAmount (within 0.001)
      return splitTotalAllocated >= totalAmount - 0.001;
    }
  }, [
    totalAmount,
    isProcessing,
    isDueValid,
    mode,
    singleMethod,
    singleTenderedNum,
    splitTotalAllocated,
  ]);

  // Handlers for Split Mode
  const handleAddSplitRow = (
    initialMethod: PosPaymentMethod = "Card",
    initialAmount?: number
  ) => {
    const defaultAmount =
      initialAmount !== undefined
        ? initialAmount
        : Math.max(0, splitRemaining);
    setSplitRows((prev) => [
      ...prev,
      {
        method: initialMethod,
        amountStr: defaultAmount > 0 ? defaultAmount.toFixed(3) : "",
        reference_code: "",
      },
    ]);
  };

  const handleUpdateSplitRow = (
    index: number,
    field: keyof SplitRow,
    value: string
  ) => {
    setSplitRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleRemoveSplitRow = (index: number) => {
    if (splitRows.length <= 1) return;
    setSplitRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSwitchToSplit = () => {
    // Convert current single selection into split line 1
    const line1Amount =
      singleMethod === "Cash" && singleTenderedNum > 0
        ? Math.min(singleTenderedNum, totalAmount)
        : totalAmount;

    setSplitRows([
      {
        method: singleMethod,
        amountStr: line1Amount.toFixed(3),
        reference_code: singleReference,
      },
    ]);
    setMode("split");
  };

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (onCustomerNameChange && effectiveCustomerName && !customerName) {
      onCustomerNameChange(effectiveCustomerName);
    }
    onComplete(currentPayments);
  };

  // Method metadata (Icons, Colors)
  const methodMeta: Record<
    PosPaymentMethod,
    {
      icon: React.ReactNode;
      activeClass: string;
      badgeClass: string;
      description: string;
    }
  > = {
    Cash: {
      icon: <Banknote className="w-4 h-4" />,
      activeClass:
        "border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400/20",
      badgeClass: "bg-emerald-100 text-emerald-800",
      description: "Cash in Hand",
    },
    Card: {
      icon: <CreditCard className="w-4 h-4" />,
      activeClass:
        "border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-400/20",
      badgeClass: "bg-blue-100 text-blue-800",
      description: "Debit / Credit POS",
    },
    "Bank Transfer": {
      icon: <Landmark className="w-4 h-4" />,
      activeClass:
        "border-indigo-500 bg-indigo-50 text-indigo-800 ring-2 ring-indigo-400/20",
      badgeClass: "bg-indigo-100 text-indigo-800",
      description: "Wire / Mobile Pay",
    },
    Due: {
      icon: <Clock className="w-4 h-4" />,
      activeClass:
        "border-amber-500 bg-amber-50 text-amber-800 ring-2 ring-amber-400/20",
      badgeClass: "bg-amber-100 text-amber-800",
      description: "Credit / Balance",
    },
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isProcessing) onClose();
      }}
    >
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl gap-0 border shadow-2xl">
        {/* ── 1. Top Header with Live Balance ── */}
        <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shrink-0">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
                  <span>Complete Payment</span>
                  {mode === "split" && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 border border-blue-400/30">
                      Mixed Payment
                    </span>
                  )}
                </DialogTitle>
                <p className="text-xs text-slate-300 mt-0.5">
                  {mode === "single"
                    ? "Select payment method or switch to mixed tender"
                    : "Combine Cash, Card, Bank Transfer, or Due"}
                </p>
              </div>

              {/* Mode toggle button */}
              <button
                type="button"
                onClick={() =>
                  mode === "single" ? handleSwitchToSplit() : setMode("single")
                }
                className="text-xs px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 border border-white/15 transition-all flex items-center gap-1.5 font-medium shrink-0 cursor-pointer"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-blue-300" />
                <span>{mode === "single" ? "Split Payment" : "Single Pay"}</span>
              </button>
            </div>
          </DialogHeader>

          {/* KPI Balance Banner */}
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-xl px-2.5 py-2">
              <div className="text-[10px] text-slate-400">Order Total</div>
              <div className="text-sm font-extrabold text-white">
                OMR {totalAmount.toFixed(3)}
              </div>
            </div>

            <div className="bg-white/10 rounded-xl px-2.5 py-2">
              <div className="text-[10px] text-slate-400">
                {mode === "single" ? "Tendered" : "Allocated"}
              </div>
              <div className="text-sm font-extrabold text-blue-300">
                OMR{" "}
                {(mode === "single"
                  ? singleTenderedNum
                  : splitTotalAllocated
                ).toFixed(3)}
              </div>
            </div>

            {/* Status Pill */}
            {(() => {
              const remaining =
                mode === "single" ? singleRemaining : splitRemaining;
              const change =
                mode === "single" ? singleChange : splitCashOverpaid;

              if (remaining > 0.001) {
                return (
                  <div className="rounded-xl px-2.5 py-2 bg-rose-500/30 border border-rose-500/40">
                    <div className="text-[10px] text-rose-200 font-medium">
                      Remaining
                    </div>
                    <div className="text-sm font-extrabold text-rose-300">
                      OMR {remaining.toFixed(3)}
                    </div>
                  </div>
                );
              }

              if (change > 0.001) {
                return (
                  <div className="rounded-xl px-2.5 py-2 bg-amber-500/30 border border-amber-500/40">
                    <div className="text-[10px] text-amber-200 font-medium">
                      Change Due
                    </div>
                    <div className="text-sm font-extrabold text-amber-300">
                      OMR {change.toFixed(3)}
                    </div>
                  </div>
                );
              }

              return (
                <div className="rounded-xl px-2.5 py-2 bg-emerald-500/30 border border-emerald-500/40">
                  <div className="text-[10px] text-emerald-200 font-medium">
                    Status
                  </div>
                  <div className="text-sm font-extrabold text-emerald-300 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Settled
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* ── 2. Modal Body ── */}
        <ScrollArea className="max-h-[58vh]">
          <div className="p-4 space-y-4 bg-slate-50">
            {/* ══════════════════════════════════════════════
                MODE A: SINGLE PAYMENT
            ══════════════════════════════════════════════ */}
            {mode === "single" && (
              <div className="space-y-3.5">
                {/* 2x2 Payment Method Cards */}
                <div className="grid grid-cols-2 gap-2">
                  {(["Cash", "Card", "Bank Transfer", "Due"] as const).map(
                    (m) => {
                      const meta = methodMeta[m];
                      const isSelected = singleMethod === m;
                      return (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setSingleMethod(m);
                            if (m === "Cash" && singleAmountTendered === "") {
                              setSingleAmountTendered(totalAmount.toFixed(3));
                            }
                          }}
                          className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all cursor-pointer ${
                            isSelected
                              ? meta.activeClass
                              : "border-slate-200 bg-white text-gray-700 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div
                            className={`p-2 rounded-lg shrink-0 ${
                              isSelected ? meta.badgeClass : "bg-slate-100 text-gray-600"
                            }`}
                          >
                            {meta.icon}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-sm leading-tight">
                              {m}
                            </div>
                            <div className="text-[11px] text-gray-400 mt-0.5">
                              {meta.description}
                            </div>
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Cash Tender Details */}
                {singleMethod === "Cash" && (
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-700">
                        Cash Amount Received
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() =>
                            setSingleAmountTendered(totalAmount.toFixed(3))
                          }
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold text-gray-700 transition-colors cursor-pointer"
                        >
                          Exact
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSingleAmountTendered(
                              (Math.ceil(totalAmount / 5) * 5 || 5).toFixed(3)
                            )
                          }
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold text-gray-700 transition-colors cursor-pointer"
                        >
                          Round 5
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSingleAmountTendered(
                              (Math.ceil(totalAmount / 10) * 10 || 10).toFixed(3)
                            )
                          }
                          className="text-[10px] bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded font-semibold text-gray-700 transition-colors cursor-pointer"
                        >
                          Round 10
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Input
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder={totalAmount.toFixed(3)}
                        value={singleAmountTendered}
                        onChange={(e) => setSingleAmountTendered(e.target.value)}
                        className="h-11 text-lg font-extrabold text-center bg-white border-slate-300 tracking-wider"
                        autoFocus
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                        OMR
                      </span>
                    </div>

                    {/* Quick +5, +10, +20 additions */}
                    <div className="flex gap-1.5 pt-1">
                      {[5, 10, 20, 50].map((add) => (
                        <button
                          key={add}
                          type="button"
                          onClick={() =>
                            setSingleAmountTendered(
                              (
                                (parseFloat(singleAmountTendered) || totalAmount) +
                                add
                              ).toFixed(3)
                            )
                          }
                          className="flex-1 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-md transition-colors cursor-pointer"
                        >
                          +{add}
                        </button>
                      ))}
                    </div>

                    {/* Change / Short notification */}
                    {singleChange > 0.001 && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between text-amber-900 font-semibold">
                        <span>Change to Return to Customer:</span>
                        <span className="text-sm font-extrabold text-amber-800">
                          OMR {singleChange.toFixed(3)}
                        </span>
                      </div>
                    )}
                    {singleRemaining > 0.001 && (
                      <div className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs flex items-center justify-between text-rose-800 font-semibold">
                        <span>Short by:</span>
                        <span className="text-sm font-extrabold text-rose-700">
                          OMR {singleRemaining.toFixed(3)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* Card / Bank Reference Field */}
                {(singleMethod === "Card" || singleMethod === "Bank Transfer") && (
                  <div className="bg-white rounded-xl p-3.5 border border-slate-200 space-y-2 shadow-xs">
                    <label className="text-xs font-semibold text-gray-700 block">
                      {singleMethod === "Card"
                        ? "Card Approval Code / Last 4 Digits (Optional)"
                        : "Bank Reference / Transaction ID (Optional)"}
                    </label>
                    <Input
                      placeholder={
                        singleMethod === "Card"
                          ? "e.g. 4021 or Auth #8921"
                          : "e.g. NBO Transfer #TX-9082"
                      }
                      value={singleReference}
                      onChange={(e) => setSingleReference(e.target.value)}
                      className="h-10 text-sm bg-white"
                    />
                  </div>
                )}

                {/* Due Credit Notice */}
                {singleMethod === "Due" && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 space-y-2 text-amber-900">
                    <div className="flex items-start gap-2 text-xs font-semibold">
                      <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <span>
                        Full balance of OMR {totalAmount.toFixed(3)} will be
                        recorded as customer credit/receivable.
                      </span>
                    </div>
                  </div>
                )}

                {/* Split Promo Banner */}
                <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
                    <span className="text-xs text-blue-900 font-medium">
                      Customer paying with mixed methods?
                    </span>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-bold border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0 cursor-pointer"
                    onClick={handleSwitchToSplit}
                  >
                    Use Split Payment
                  </Button>
                </div>
              </div>
            )}

            {/* ══════════════════════════════════════════════
                MODE B: SPLIT / MIXED PAYMENT
            ══════════════════════════════════════════════ */}
            {mode === "split" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 px-0.5">
                  <span>Payment Lines ({splitRows.length})</span>
                  <span className="text-[11px] text-gray-400 font-normal">
                    Combine any combination of tender methods
                  </span>
                </div>

                {/* Rows list */}
                {splitRows.map((row, idx) => {
                  const meta = methodMeta[row.method];
                  const thisAmount = parseFloat(row.amountStr) || 0;
                  // Calculate remainder before this row
                  const paidBefore = splitRows
                    .slice(0, idx)
                    .reduce(
                      (sum, r) => sum + (parseFloat(r.amountStr) || 0),
                      0
                    );
                  const remForThis = Math.max(0, totalAmount - paidBefore);

                  return (
                    <div
                      key={idx}
                      className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3 shadow-xs"
                    >
                      {/* Row header: Line number + delete */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-slate-100 text-gray-700 font-extrabold text-[10px] flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-bold text-gray-800">
                            Payment #{idx + 1}
                          </span>
                        </div>

                        {splitRows.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSplitRow(idx)}
                            className="text-slate-300 hover:text-red-500 transition-colors p-1 rounded hover:bg-red-50 cursor-pointer"
                            title="Remove this payment line"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* 4 Method selector pills */}
                      <div className="grid grid-cols-4 gap-1.5">
                        {(["Cash", "Card", "Bank Transfer", "Due"] as const).map(
                          (m) => {
                            const isSelected = row.method === m;
                            return (
                              <button
                                key={m}
                                type="button"
                                onClick={() =>
                                  handleUpdateSplitRow(idx, "method", m)
                                }
                                className={`flex flex-col items-center gap-1 py-1.5 px-1 rounded-lg border-2 text-[11px] font-bold transition-all cursor-pointer ${
                                  isSelected
                                    ? methodMeta[m].activeClass
                                    : "border-slate-200 bg-white text-gray-600 hover:bg-slate-50"
                                }`}
                              >
                                {methodMeta[m].icon}
                                <span className="truncate w-full text-center">
                                  {m === "Bank Transfer" ? "Bank" : m}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>

                      {/* Amount input + Quick Balance fill */}
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <div className="text-[10px] text-gray-500 font-semibold mb-1">
                            Amount (OMR)
                          </div>
                          <Input
                            type="number"
                            step="0.001"
                            min="0"
                            placeholder="0.000"
                            value={row.amountStr}
                            onChange={(e) =>
                              handleUpdateSplitRow(
                                idx,
                                "amountStr",
                                e.target.value
                              )
                            }
                            className="h-10 text-base font-extrabold text-center bg-white tracking-wider"
                          />
                        </div>

                        {/* Quick fill button */}
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateSplitRow(
                              idx,
                              "amountStr",
                              remForThis.toFixed(3)
                            )
                          }
                          className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-gray-700 font-bold text-xs rounded-md transition-colors whitespace-nowrap cursor-pointer"
                          title="Fill remaining unallocated balance into this line"
                        >
                          Fill Remainder
                        </button>
                      </div>

                      {/* Reference code for Card / Bank */}
                      {(row.method === "Card" ||
                        row.method === "Bank Transfer") && (
                        <div>
                          <Input
                            placeholder={
                              row.method === "Card"
                                ? "Card approval code / last 4 digits (optional)"
                                : "Bank transfer ref ID (optional)"
                            }
                            value={row.reference_code}
                            onChange={(e) =>
                              handleUpdateSplitRow(
                                idx,
                                "reference_code",
                                e.target.value
                              )
                            }
                            className="h-8 text-xs bg-slate-50"
                          />
                        </div>
                      )}

                      {/* Due note */}
                      {row.method === "Due" && (
                        <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200/70 rounded-md p-2 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            OMR {thisAmount.toFixed(3)} will be recorded as
                            credit owed by the customer.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* ── Quick Remainder Action Buttons (when remaining > 0) ── */}
                {splitRemaining > 0.001 && (
                  <div className="bg-slate-100 rounded-xl p-3 space-y-2 border border-slate-200">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-gray-700">
                        Allocate Remaining Balance:
                      </span>
                      <span className="font-extrabold text-rose-600">
                        OMR {splitRemaining.toFixed(3)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          handleAddSplitRow("Card", splitRemaining)
                        }
                        className="py-1.5 px-2 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> + Card
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleAddSplitRow("Bank Transfer", splitRemaining)
                        }
                        className="py-1.5 px-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Landmark className="w-3.5 h-3.5" /> + Bank
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddSplitRow("Due", splitRemaining)}
                        className="py-1.5 px-2 bg-white hover:bg-amber-50 text-amber-700 border border-slate-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" /> + Due
                      </button>
                    </div>
                  </div>
                )}

                {/* Always-accessible "+ Add Another Payment Method" button */}
                <button
                  type="button"
                  onClick={() => handleAddSplitRow("Cash")}
                  className="w-full py-2.5 px-3 border-2 border-dashed border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50/50 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Payment Method</span>
                </button>
              </div>
            )}

            {/* ══════════════════════════════════════════════
                INLINE CUSTOMER NAME FOR DUE (CREDIT)
            ══════════════════════════════════════════════ */}
            {hasDue && !effectiveCustomerName && (
              <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-3.5 space-y-2 text-amber-900 shadow-xs">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Customer Name Required for Due / Credit Sale</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-tight">
                  Please enter the customer's name so this credit can be tracked
                  in receivables:
                </p>
                <div className="relative">
                  <Input
                    placeholder="Enter customer name..."
                    value={localDueCustomerName}
                    onChange={(e) => setLocalDueCustomerName(e.target.value)}
                    className="h-9 text-xs bg-white border-amber-300 font-semibold"
                  />
                  <User className="w-3.5 h-3.5 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* ── 3. Modal Footer ── */}
        <div className="p-4 bg-white border-t flex items-center gap-2.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            className="flex-1 h-11 text-sm font-semibold cursor-pointer"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>

          <Button
            type="button"
            className="flex-[2] h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 rounded-xl active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Processing Order...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Confirm & Place Order (OMR {totalAmount.toFixed(3)})
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
