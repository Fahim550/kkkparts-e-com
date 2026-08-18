import React, { useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { numberToWords } from '@/lib/number-to-words';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, Share2 } from 'lucide-react';

export interface InvoiceItem {
  name: string;
  qty: number;
  price: number;
  taxPct: number;
  amount: number;
}

export interface InvoiceData {
  type: "Sale" | "Purchase";
  partyName: string;
  partyPhone: string;
  invoiceNo: string;
  date: string;
  items: InvoiceItem[];
  totalQty: number;
  subTotal: number;
  roundOff: number;
  total: number;
  received: number;
  balance: number;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  data: InvoiceData | null;
}

export function InvoicePreviewModal({ open, onOpenChange, onSave, data }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      const canvas = await html2canvas(invoiceRef.current, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Invoice_${data.invoiceNo || 'Draft'}.pdf`);
    } catch (e) {
      console.error('Failed to generate PDF', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `Invoice ${data.invoiceNo} from MULTAQA QURIYATH TRAD.\nTotal Amount: ${data.total} OMR.\nLink: [Generate Link if applicable]`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareGmail = () => {
    const subject = `Invoice ${data.invoiceNo} from MULTAQA QURIYATH TRAD`;
    const body = `Please find your invoice details below.\nTotal Amount: ${data.total} OMR.`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] p-0 m-0 rounded-none bg-gray-50 flex flex-col hide-print">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0">
          <h2 className="text-xl font-semibold text-gray-800">Preview</h2>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox id="dont-show" />
              <label htmlFor="dont-show" className="text-sm text-gray-600 cursor-pointer">
                Do not show invoice preview again
              </label>
            </div>
            <Button onClick={onSave} className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded">
              Save & Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Themes */}
          <div className="w-64 bg-white border-r flex flex-col shrink-0 overflow-y-auto hidden md:block">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-gray-700">Select Theme</h3>
            </div>
            <div className="flex flex-col">
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">Classic Themes</div>
              <div className="p-4 border-b cursor-pointer bg-blue-50 text-blue-700 text-sm font-medium">Tally VAT Theme</div>
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">VAT Theme 1</div>
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">Arabic Theme</div>
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">Double Divine</div>
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">French Elite</div>
              <div className="p-4 border-b cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">Vintage Themes</div>
            </div>
            <div className="p-4 mt-auto bg-amber-50 m-4 rounded border border-amber-100 flex gap-3 items-start">
              <div className="text-amber-500">💡</div>
              <p className="text-xs text-amber-800">Use this theme for a clean and professional look</p>
            </div>
          </div>

          {/* Center - Preview Canvas */}
          <div className="flex-1 bg-gray-100 p-8 overflow-y-auto flex justify-center print-full-width">
            {/* The A4 Wrapper */}
            <div className="bg-white shadow-lg print:shadow-none print:w-full max-w-[800px] w-full min-h-[1130px] p-8 relative flex flex-col mx-auto" ref={invoiceRef}>
              <h1 className="text-center font-bold text-xl mb-4">Tax Invoice</h1>
              
              <div className="border border-gray-400 p-4 mb-4 relative">
                <div className="flex justify-between">
                  <div className="w-1/3">
                    {/* Placeholder for Logo Grid like in the screenshot */}
                    <div className="grid grid-cols-4 gap-1 w-32 opacity-20">
                      {Array(12).fill(0).map((_, i) => (
                        <div key={i} className="w-6 h-6 bg-gray-600 rounded-sm"></div>
                      ))}
                    </div>
                  </div>
                  <div className="w-2/3">
                    <h2 className="text-3xl font-bold text-gray-700 tracking-tight">MULTAQA QURIYATH TRAD</h2>
                    <div className="text-sm text-gray-600 mt-2 space-y-0.5">
                      <p>C.R.NO,1144157</p>
                      <p>P.O.BOX: 3157,POSTAL CODE:112</p>
                      <p>QURIYATH SANAYYA</p>
                      <div className="flex justify-between mt-2 font-medium">
                        <p>Phone: 79458035</p>
                        <p>Email: mohammaddawood19931@gmail.com</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-400 border-t-0 -mt-4 flex">
                <div className="w-1/2 border-r border-gray-400 p-2 text-sm">
                  <p className="font-semibold text-gray-600 mb-2">Bill To:</p>
                  <p className="font-bold text-lg mb-1">{data.partyName || 'CASH CUSTOMER'}</p>
                  <p>Contact No: {data.partyPhone || ''}</p>
                </div>
                <div className="w-1/2 p-2 text-sm space-y-2">
                  <p className="font-semibold text-gray-600 border-b border-gray-300 pb-1">Invoice Details:</p>
                  <p>Invoice No: {data.invoiceNo || 'N/A'}</p>
                  <p>Date: {data.date}</p>
                </div>
              </div>

              <div className="mt-4 border-t border-l border-gray-400 flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-400 text-gray-700 bg-gray-50">
                      <th className="p-2 border-r border-gray-400 text-left w-10">#</th>
                      <th className="p-2 border-r border-gray-400 text-left">Item name</th>
                      <th className="p-2 border-r border-gray-400 text-right w-20">Quantity</th>
                      <th className="p-2 border-r border-gray-400 text-right w-28">Price/ Unit(ر.ع.)</th>
                      <th className="p-2 border-r border-gray-400 text-center w-20">VAT %</th>
                      <th className="p-2 text-right border-r border-gray-400 w-28">Amount(ر.ع.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-400">
                        <td className="p-2 border-r border-gray-400 text-left">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-400 text-left font-medium">{item.name}</td>
                        <td className="p-2 border-r border-gray-400 text-right">{item.qty}</td>
                        <td className="p-2 border-r border-gray-400 text-right">{item.price.toFixed(2)} ر.ع.</td>
                        <td className="p-2 border-r border-gray-400 text-center">{item.taxPct}%</td>
                        <td className="p-2 border-r border-gray-400 text-right">{item.amount.toFixed(2)} ر.ع.</td>
                      </tr>
                    ))}
                    {/* Fill empty space if few items */}
                    {Array(Math.max(0, 10 - data.items.length)).fill(0).map((_, idx) => (
                      <tr key={`empty-${idx}`} className="">
                        <td className="p-4 border-r border-gray-400 text-left border-b-transparent"></td>
                        <td className="p-4 border-r border-gray-400 text-left border-b-transparent"></td>
                        <td className="p-4 border-r border-gray-400 text-right border-b-transparent"></td>
                        <td className="p-4 border-r border-gray-400 text-right border-b-transparent"></td>
                        <td className="p-4 border-r border-gray-400 text-center border-b-transparent"></td>
                        <td className="p-4 border-r border-gray-400 text-right border-b-transparent"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-y border-gray-400 font-bold bg-gray-50">
                      <td colSpan={2} className="p-2 border-r border-gray-400 text-left">Total</td>
                      <td className="p-2 border-r border-gray-400 text-right">{data.totalQty}</td>
                      <td className="p-2 border-r border-gray-400 text-right"></td>
                      <td className="p-2 border-r border-gray-400 text-center"></td>
                      <td className="p-2 border-r border-gray-400 text-right">{data.subTotal.toFixed(2)} ر.ع.</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary Section matching image */}
                <div className="flex w-full border-b border-gray-400 mt-0">
                  <div className="w-3/5 border-r border-gray-400 p-2">
                    {/* Empty block to push summary to right */}
                  </div>
                  <div className="w-2/5 border-r border-gray-400">
                    <div className="flex justify-between border-b border-gray-400 p-2 text-sm text-gray-700">
                      <span>Sub Total</span>
                      <span>:</span>
                      <span className="text-right">{data.subTotal.toFixed(2)} ر.ع.</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-400 p-2 text-sm text-gray-700">
                      <span>Round Off</span>
                      <span>:</span>
                      <span className="text-right">{data.roundOff.toFixed(2)} ر.ع.</span>
                    </div>
                    <div className="flex justify-between p-2 font-bold text-sm bg-gray-50">
                      <span>Total</span>
                      <span>:</span>
                      <span className="text-right">{data.total.toFixed(2)} ر.ع.</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-r border-gray-400">
                   <div className="p-1 border-b border-gray-400 bg-gray-50 text-xs font-bold text-gray-600">
                     Invoice Amount in Words:
                   </div>
                   <div className="p-2 text-sm italic border-b border-gray-400">
                     {numberToWords(data.total)}
                   </div>
                   <div className="flex justify-between p-1.5 text-sm">
                      <span className="w-4/5 text-right pr-4 text-gray-600">Received</span>
                      <span className="text-right">{data.received.toFixed(2)} ر.ع.</span>
                   </div>
                   <div className="flex justify-between p-1.5 text-sm bg-gray-50 border-t border-gray-400 font-bold">
                      <span className="w-4/5 text-right pr-4">Balance</span>
                      <span className="text-right">{data.balance.toFixed(2)} ر.ع.</span>
                   </div>
                </div>
                
                <div className="border-r border-b border-gray-400 p-2 min-h-24">
                  <p className="text-xs font-bold text-gray-700 mb-1">Terms & Conditions:</p>
                  <ul className="text-xs text-gray-600 list-decimal pl-4 space-y-1">
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>Subject to local jurisdiction.</li>
                  </ul>
                </div>
              </div>
              
            </div>
          </div>

          {/* Right Sidebar - Actions */}
          <div className="w-64 bg-white border-l flex flex-col shrink-0 p-6">
            <h3 className="font-semibold text-gray-800 mb-6">Share Invoice</h3>
            
            <div className="flex gap-4 mb-8">
              <button onClick={handleShareWhatsApp} className="flex flex-col items-center gap-2 hover:opacity-80">
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center border border-green-200">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-medium text-gray-600">Whatsapp</span>
              </button>
              
              <button onClick={handleShareGmail} className="flex flex-col items-center gap-2 hover:opacity-80">
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center border border-red-200">
                   {/* Simplified Gmail icon using text */}
                   <span className="text-xl font-bold">M</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Gmail</span>
              </button>
            </div>

            <div className="space-y-4">
               <button onClick={handleDownloadPDF} className="w-full py-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-gray-50 text-blue-600">
                 <Download className="w-6 h-6" />
                 <span className="text-xs font-semibold text-gray-700">Download PDF</span>
               </button>

               <button onClick={handlePrint} className="w-full py-4 border rounded-xl flex flex-col items-center gap-2 hover:bg-gray-50 text-blue-500">
                 <Printer className="w-6 h-6" />
                 <span className="text-xs font-semibold text-gray-700">Print Invoice (Thermal)</span>
               </button>

               <button onClick={handlePrint} className="w-full py-4 border rounded-xl flex flex-col items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-600">
                 <Printer className="w-6 h-6" />
                 <span className="text-xs font-semibold text-white">Print Invoice (Normal)</span>
               </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
