import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calculator, Copy, Check } from "lucide-react";

export function QuickCalculatorPopover() {
  const [input, setInput] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [op, setOp] = useState<string | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDigit = (digit: string) => {
    if (overwrite || input === "0") {
      setInput(digit);
      setOverwrite(false);
    } else {
      if (digit === "." && input.includes(".")) return;
      setInput(input + digit);
    }
  };

  const handleOp = (nextOp: string) => {
    const current = parseFloat(input);
    if (prev === null) {
      setPrev(current);
    } else if (op) {
      const res = calculate(prev, current, op);
      setPrev(res);
      setInput(String(res));
    }
    setOp(nextOp);
    setOverwrite(true);
  };

  const calculate = (a: number, b: number, operator: string): number => {
    switch (operator) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b !== 0 ? a / b : 0;
      default:
        return b;
    }
  };

  const handleEquals = () => {
    if (prev === null || !op) return;
    const current = parseFloat(input);
    const res = calculate(prev, current, op);
    setInput(String(Number(res.toFixed(4))));
    setPrev(null);
    setOp(null);
    setOverwrite(true);
  };

  const handleClear = () => {
    setInput("0");
    setPrev(null);
    setOp(null);
    setOverwrite(false);
  };

  const handlePercent = () => {
    const current = parseFloat(input);
    setInput(String(current / 100));
  };

  const handleBackspace = () => {
    if (input.length > 1) {
      setInput(input.slice(0, -1));
    } else {
      setInput("0");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors"
          title="Quick Calculator"
        >
          <Calculator className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-64 p-3 bg-white shadow-xl border border-slate-200 rounded-xl z-50 text-slate-900"
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Calculator className="w-3.5 h-3.5 text-blue-600" />
            Calculator
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-medium px-1.5 py-0.5 rounded hover:bg-blue-50 transition"
            title="Copy value"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        {/* Display Screen */}
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 mb-3 text-right">
          <div className="text-[11px] text-slate-400 font-mono h-4 truncate">
            {prev !== null && `${prev} ${op || ""}`}
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 tracking-tight truncate">
            {input}
          </div>
        </div>

        {/* Keypad Grid */}
        <div className="grid grid-cols-4 gap-1.5">
          <button
            type="button"
            onClick={handleClear}
            className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-xs transition cursor-pointer"
          >
            C
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            ⌫
          </button>
          <button
            type="button"
            onClick={handlePercent}
            className="p-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs transition cursor-pointer"
          >
            %
          </button>
          <button
            type="button"
            onClick={() => handleOp("÷")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition cursor-pointer"
          >
            ÷
          </button>

          {["7", "8", "9"].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/90 text-slate-800 font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOp("×")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition cursor-pointer"
          >
            ×
          </button>

          {["4", "5", "6"].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/90 text-slate-800 font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOp("-")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition cursor-pointer"
          >
            -
          </button>

          {["1", "2", "3"].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => handleDigit(n)}
              className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/90 text-slate-800 font-semibold text-xs transition shadow-2xs cursor-pointer"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOp("+")}
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-sm transition cursor-pointer"
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleDigit("0")}
            className="col-span-2 p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/90 text-slate-800 font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={() => handleDigit(".")}
            className="p-2 rounded-lg bg-slate-100/70 hover:bg-slate-200/90 text-slate-800 font-semibold text-xs transition shadow-2xs cursor-pointer"
          >
            .
          </button>
          <button
            type="button"
            onClick={handleEquals}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-2xs cursor-pointer"
          >
            =
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
