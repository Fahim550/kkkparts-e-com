import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useSettings } from '@/hooks/useDatabase';
import { numberToWords } from '@/lib/number-to-words';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Download, Printer, Share2 } from 'lucide-react';
import { useRef } from 'react';
import { toast } from 'sonner';

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
  partyAddress?: string;
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
  onSave?: () => void;
  data: InvoiceData | null;
}

export function InvoicePreviewModal({ open, onOpenChange, onSave, data }: Props) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const { data: settings } = useSettings();
  const s = (Array.isArray(settings) ? settings[0] : settings) || {};

  const shopName = s?.site_name || "MULTAQA QURIYATH TRAD";
  const shopCrNo = s?.site_description || "1144157";
  const shopAddress = s?.contact_address || "QURIYATH SANAYYA, SULTANATE OF OMAN";
  const shopPhone = s?.contact_phone || s?.support_phone || "79458035";
  const shopEmail = s?.contact_email || s?.support_email || "mohammaddawood19931@gmail.com";
  const shopLogo = s?.logo_url || "";

  if (!data) return null;

  const isPurchase = data.type === "Purchase";
  const docTitle = isPurchase ? "PURCHASE INVOICE" : "TAX INVOICE";

  // 1. Download PDF using html2canvas & jsPDF
  const handleDownloadPDF = async () => {
    if (!invoiceRef.current) return;
    try {
      toast.info("Generating PDF...");
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${isPurchase ? "Purchase" : "Invoice"}_${data.invoiceNo || 'Document'}.pdf`);
      toast.success("PDF downloaded successfully");
    } catch (e: any) {
      console.error('Failed to generate PDF', e);
      toast.error('Failed to generate PDF: ' + e.message);
    }
  };

  // 2. Print Normal (A4 Sheet with full header, exact alignment, and no UI buttons)
  const handlePrintNormal = () => {
    if (!invoiceRef.current) return;
    const printContent = invoiceRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${data.invoiceNo}</title>
          <style>
            @page {
              size: A4 portrait;
              margin: 8mm 10mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              background: #ffffff;
              color: #111827;
              margin: 0;
              padding: 0;
              font-size: 13px;
            }
            table {
              border-collapse: collapse;
              width: 100%;
            }
            th, td {
              border-color: #6b7280;
            }
            .border { border: 1px solid #6b7280; }
            .border-t { border-top: 1px solid #6b7280; }
            .border-b { border-bottom: 1px solid #6b7280; }
            .border-l { border-left: 1px solid #6b7280; }
            .border-r { border-right: 1px solid #6b7280; }
            .border-gray-400 { border-color: #6b7280; }
            .border-gray-300 { border-color: #d1d5db; }
            .bg-gray-50 { background-color: #f9fafb !important; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .font-bold { font-weight: 700; }
            .font-semibold { font-weight: 600; }
            .font-medium { font-weight: 500; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .p-1 { padding: 4px; }
            .p-1\\.5 { padding: 6px; }
            .p-2 { padding: 8px; }
            .p-3 { padding: 12px; }
            .p-4 { padding: 16px; }
            .p-8 { padding: 24px; }
            .text-xs { font-size: 11px; }
            .text-sm { font-size: 13px; }
            .text-base { font-size: 15px; }
            .text-lg { font-size: 17px; }
            .text-xl { font-size: 20px; }
            .text-2xl { font-size: 24px; }
            .text-3xl { font-size: 28px; }
            .text-gray-500 { color: #6b7280; }
            .text-gray-600 { color: #4b5563; }
            .text-gray-700 { color: #374151; }
            .text-gray-800 { color: #1f2937; }
            .text-gray-900 { color: #111827; }
            .text-red-600 { color: #dc2626; }
            .w-full { width: 100%; }
            .w-10 { width: 40px; }
            .w-20 { width: 80px; }
            .w-28 { width: 110px; }
            .w-1\\/2 { width: 50%; }
            .w-1\\/3 { width: 30%; }
            .w-2\\/3 { width: 70%; }
            .w-2\\/5 { width: 40%; }
            .w-3\\/5 { width: 60%; }
            .w-4\\/5 { width: 80%; }
            .space-y-0\\.5 > * + * { margin-top: 2px; }
            .space-y-1 > * + * { margin-top: 4px; }
            .space-y-2 > * + * { margin-top: 8px; }
            .italic { font-style: italic; }
            .uppercase { text-transform: uppercase; }
            .grid { display: grid; }
            .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
            .gap-1 { gap: 4px; }
            .w-32 { width: 100px; }
            .w-6 { width: 20px; }
            .h-6 { height: 20px; }
            .bg-gray-600 { background-color: #4b5563; }
            .rounded-sm { border-radius: 2px; }
            .opacity-20 { opacity: 0.2; }
            .mt-0 { margin-top: 0px; }
            .mt-2 { margin-top: 8px; }
            .mt-4 { margin-top: 14px; }
            .mb-1 { margin-bottom: 4px; }
            .mb-2 { margin-bottom: 8px; }
            .mb-4 { margin-bottom: 14px; }
            .-mt-4 { margin-top: -14px; }
            .pr-4 { padding-right: 16px; }
            .pl-4 { padding-left: 16px; }
            .list-decimal { list-style-type: decimal; }
            .min-h-\\[1130px\\] { min-height: auto; }
          </style>
        </head>
        <body>
          <div style="max-width: 100%; margin: 0 auto;">
            ${printContent}
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 300);
  };

  // 3. Print Thermal (80mm POS Slip with clear receipt format)
  const handlePrintThermal = () => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const itemsRows = data.items
      .map(
        (it, i) => `
      <tr>
        <td style="padding: 4px 0; text-align: left; vertical-align: top;">${i + 1}. ${it.name}</td>
        <td style="padding: 4px 0; text-align: center; vertical-align: top;">${it.qty}</td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top;">${it.price.toFixed(3)}</td>
        <td style="padding: 4px 0; text-align: right; vertical-align: top;">${it.amount.toFixed(3)}</td>
      </tr>
    `
      )
      .join("");

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${docTitle} - ${data.invoiceNo}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 2mm 3mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            body {
              font-family: 'Courier New', Courier, monospace, system-ui;
              width: 74mm;
              margin: 0 auto;
              padding: 2mm 0;
              color: #000000;
              background: #ffffff;
              font-size: 11px;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .font-bold { font-weight: bold; }
            .divider {
              border-top: 1px dashed #000000;
              margin: 6px 0;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            th {
              border-bottom: 1px solid #000;
              border-top: 1px solid #000;
              padding: 3px 0;
            }
          </style>
        </head>
        <body>
          <div class="text-center">
            ${shopLogo ? `<div style="margin-bottom: 6px;"><img src="${shopLogo}" alt="${shopName}" style="max-height: 40px; max-width: 140px; object-fit: contain;" /></div>` : ""}
            <div style="font-size: 15px; font-weight: bold;">${shopName}</div>
            ${shopCrNo ? `<div style="font-size: 10px; margin-top: 2px;">C.R. NO: ${shopCrNo}</div>` : ""}
            ${shopAddress ? `<div style="font-size: 10px;">${shopAddress}</div>` : ""}
            ${shopPhone ? `<div style="font-size: 10px;">Tel: ${shopPhone}</div>` : ""}
            ${shopEmail ? `<div style="font-size: 10px;">Email: ${shopEmail}</div>` : ""}
          </div>

          <div class="divider"></div>

          <div class="text-center font-bold" style="font-size: 12px; letter-spacing: 1px;">
            ${docTitle}
          </div>

          <div class="divider"></div>

          <div style="font-size: 10px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Inv No: <b>${data.invoiceNo}</b></span>
              <span>Date: ${data.date}</span>
            </div>
            <div style="margin-top: 3px;">
              <span>${isPurchase ? "Supplier" : "Customer"}: <b>${data.partyName}</b></span>
            </div>
            ${data.partyPhone ? `<div style="margin-top: 1px;"><span>Phone: ${data.partyPhone}</span></div>` : ""}
          </div>

          <div class="divider"></div>

          <table style="font-size: 10px;">
            <thead>
              <tr>
                <th class="text-left">Item</th>
                <th class="text-center" style="width: 25px;">Qty</th>
                <th class="text-right" style="width: 44px;">Price</th>
                <th class="text-right" style="width: 50px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="divider"></div>

          <div style="font-size: 11px;">
            <div style="display: flex; justify-content: space-between;">
              <span>Total Items / Qty:</span>
              <span>${data.items.length} / ${data.totalQty}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 2px;">
              <span>Sub Total:</span>
              <span>OMR ${data.subTotal.toFixed(3)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-top: 4px;">
              <span>TOTAL:</span>
              <span>OMR ${data.total.toFixed(3)}</span>
            </div>
            <div class="divider"></div>
            <div style="display: flex; justify-content: space-between;">
              <span>${isPurchase ? "Paid" : "Received"}:</span>
              <span>OMR ${data.received.toFixed(3)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-weight: bold; margin-top: 2px;">
              <span>Balance Due:</span>
              <span>OMR ${data.balance.toFixed(3)}</span>
            </div>
          </div>

          <div class="divider"></div>

          <div class="text-center" style="font-size: 9px; font-style: italic;">
            ${numberToWords(data.total)}
          </div>

          <div class="divider"></div>

          <div class="text-center" style="font-size: 10px; margin-top: 6px;">
            Thank you for your business!
          </div>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 3000);
    }, 300);
  };

  const handleShareWhatsApp = () => {
    const text = `${docTitle} ${data.invoiceNo} from ${shopName}.\nTotal Amount: ${data.total.toFixed(3)} OMR.\nParty: ${data.partyName}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareGmail = () => {
    const subject = `${docTitle} ${data.invoiceNo} from ${shopName}`;
    const body = `Dear ${data.partyName},\n\nPlease find your ${docTitle.toLowerCase()} details below:\nInvoice No: ${data.invoiceNo}\nDate: ${data.date}\nTotal Amount: ${data.total.toFixed(3)} OMR\nBalance Due: ${data.balance.toFixed(3)} OMR\n\nThank you,\n${shopName}`;
    window.open(`https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[100vw] w-full h-[100vh] max-h-[100vh] p-0 m-0 rounded-none bg-gray-50 flex flex-col border-none shadow-none">
        {/* Header - Hidden on Print */}
        <div className="flex items-center justify-between px-6 py-3 bg-white border-b shrink-0 hide-print no-print">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold text-gray-800">
              {isPurchase ? "Purchase Order / Invoice Preview" : "Tax Invoice Preview"}
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700">
              {data.invoiceNo}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Checkbox id="dont-show" />
              <label htmlFor="dont-show" className="text-sm text-gray-600 cursor-pointer">
                Do not show invoice preview again
              </label>
            </div>
            <Button
              onClick={onSave || (() => onOpenChange(false))}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium rounded h-9 px-4"
            >
              Save & Close
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">
          {/* Center - Preview Canvas */}
          <div className="flex-1 bg-gray-100 p-6 overflow-y-auto flex justify-center">
            {/* The A4 Wrapper */}
            <div
              className="bg-white shadow-md max-w-[820px] w-full min-h-[1130px] p-8 relative flex flex-col mx-auto my-2 border border-gray-200 rounded-xs"
              ref={invoiceRef}
            >
              <h1 className="text-center font-bold text-2xl mb-4 tracking-wide text-gray-800 uppercase">
                {docTitle}
              </h1>

              {/* Company Header Box */}
              <div className="border border-gray-400 p-4 mb-4 relative">
                <div className="flex justify-between items-start">
                  <div className="w-1/3">
                    {shopLogo ? (
                      <img src={shopLogo} alt={shopName} className="h-12 max-w-40 object-contain mb-2" />
                    ) : (
                      <div className="grid grid-cols-4 gap-1 w-32 opacity-25">
                        {Array(12).fill(0).map((_, i) => (
                          <div key={i} className="w-6 h-6 bg-gray-700 rounded-xs"></div>
                        ))}
                      </div>
                    )}
                    <div className="text-[11px] font-bold text-gray-400 mt-2 tracking-wider">
                      {isPurchase ? "PURCHASE VOUCHER" : "ORIGINAL FOR RECIPIENT"}
                    </div>
                  </div>
                  <div className="w-2/3 text-right">
                    <h2 className="text-3xl font-black text-gray-800 tracking-tight">{shopName}</h2>
                    <div className="text-xs text-gray-600 mt-2 space-y-0.5">
                      {shopCrNo && (
                        <p><span className="font-semibold text-gray-700">C.R. NO:</span> {shopCrNo}</p>
                      )}
                      <p><span className="font-semibold text-gray-700">P.O. BOX:</span> 3157, <span className="font-semibold text-gray-700">POSTAL CODE:</span> 112</p>
                      {shopAddress && <p>{shopAddress}</p>}
                      <div className="flex justify-end gap-3 mt-1.5 font-medium text-gray-700">
                        {shopPhone && <p>Phone: {shopPhone}</p>}
                        {shopPhone && shopEmail && <span>|</span>}
                        {shopEmail && <p>Email: {shopEmail}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Party & Invoice Details Bar */}
              <div className="border border-gray-400 border-t-0 -mt-4 flex">
                <div className="w-1/2 border-r border-gray-400 p-3 text-sm">
                  <p className="font-semibold text-gray-500 text-xs uppercase mb-1">
                    {isPurchase ? "Supplier / Vendor:" : "Bill To / Customer:"}
                  </p>
                  <p className="font-bold text-lg text-gray-900 mb-1">{data.partyName || (isPurchase ? 'SUPPLIER' : 'CASH CUSTOMER')}</p>
                  <p className="text-xs text-gray-600">Contact No: {data.partyPhone || 'N/A'}</p>
                  {data.partyAddress && (
                    <p className="text-xs text-gray-600 mt-0.5">Address: {data.partyAddress}</p>
                  )}
                </div>
                <div className="w-1/2 p-3 text-sm space-y-1.5 bg-gray-50/50">
                  <p className="font-semibold text-gray-500 text-xs uppercase border-b border-gray-300 pb-1">
                    {isPurchase ? "Purchase Details:" : "Invoice Details:"}
                  </p>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Document No:</span>
                    <span className="font-mono font-bold text-gray-900">{data.invoiceNo || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium text-gray-900">{data.date}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Currency:</span>
                    <span className="font-medium text-gray-900">OMR (ر.ع.)</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="mt-4 border-t border-l border-gray-400 flex-1">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-400 text-gray-700 bg-gray-50 font-bold">
                      <th className="p-2 border-r border-gray-400 text-left w-10">#</th>
                      <th className="p-2 border-r border-gray-400 text-left">Item name</th>
                      <th className="p-2 border-r border-gray-400 text-right w-20">Quantity</th>
                      <th className="p-2 border-r border-gray-400 text-right w-28">Price/ Unit (ر.ع.)</th>
                      <th className="p-2 border-r border-gray-400 text-center w-20">VAT %</th>
                      <th className="p-2 text-right border-r border-gray-400 w-28">Amount (ر.ع.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-400">
                        <td className="p-2 border-r border-gray-400 text-left">{idx + 1}</td>
                        <td className="p-2 border-r border-gray-400 text-left font-medium text-gray-800">{item.name}</td>
                        <td className="p-2 border-r border-gray-400 text-right font-medium">{item.qty}</td>
                        <td className="p-2 border-r border-gray-400 text-right font-mono">{item.price.toFixed(3)} ر.ع.</td>
                        <td className="p-2 border-r border-gray-400 text-center">{item.taxPct}%</td>
                        <td className="p-2 border-r border-gray-400 text-right font-mono font-medium">{item.amount.toFixed(3)} ر.ع.</td>
                      </tr>
                    ))}
                    {/* Fill empty space if few items */}
                    {Array(Math.max(0, 8 - data.items.length)).fill(0).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        <td className="p-3 border-r border-gray-400 text-left"></td>
                        <td className="p-3 border-r border-gray-400 text-left"></td>
                        <td className="p-3 border-r border-gray-400 text-right"></td>
                        <td className="p-3 border-r border-gray-400 text-right"></td>
                        <td className="p-3 border-r border-gray-400 text-center"></td>
                        <td className="p-3 border-r border-gray-400 text-right"></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-y border-gray-400 font-bold bg-gray-50">
                      <td colSpan={2} className="p-2 border-r border-gray-400 text-left">Total</td>
                      <td className="p-2 border-r border-gray-400 text-right">{data.totalQty}</td>
                      <td className="p-2 border-r border-gray-400 text-right"></td>
                      <td className="p-2 border-r border-gray-400 text-center"></td>
                      <td className="p-2 border-r border-gray-400 text-right font-mono">{data.subTotal.toFixed(3)} ر.ع.</td>
                    </tr>
                  </tfoot>
                </table>

                {/* Summary Section */}
                <div className="flex w-full border-b border-gray-400 mt-0">
                  <div className="w-3/5 border-r border-gray-400 p-3">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Payment Terms</p>
                    <p className="text-xs text-gray-600 mt-1">Payment via Cash / Bank Transfer / Card.</p>
                  </div>
                  <div className="w-2/5 border-r border-gray-400">
                    <div className="flex justify-between border-b border-gray-400 p-2 text-sm text-gray-700">
                      <span>Sub Total</span>
                      <span>:</span>
                      <span className="text-right font-mono">{data.subTotal.toFixed(3)} ر.ع.</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-400 p-2 text-sm text-gray-700">
                      <span>Round Off</span>
                      <span>:</span>
                      <span className="text-right font-mono">{data.roundOff.toFixed(3)} ر.ع.</span>
                    </div>
                    <div className="flex justify-between p-2 font-bold text-sm bg-gray-50">
                      <span>Total</span>
                      <span>:</span>
                      <span className="text-right font-mono text-base">{data.total.toFixed(3)} ر.ع.</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-r border-gray-400">
                   <div className="p-1.5 border-b border-gray-400 bg-gray-50 text-xs font-bold text-gray-600 uppercase">
                     Invoice Amount in Words:
                   </div>
                   <div className="p-2.5 text-sm font-medium italic border-b border-gray-400 text-gray-800">
                     {numberToWords(data.total)}
                   </div>
                   <div className="flex justify-between p-2 text-sm">
                      <span className="w-4/5 text-right pr-4 text-gray-600">{isPurchase ? "Amount Paid" : "Received"}</span>
                      <span className="text-right font-mono font-medium">{data.received.toFixed(3)} ر.ع.</span>
                   </div>
                   <div className="flex justify-between p-2 text-sm bg-gray-50 border-t border-gray-400 font-bold">
                      <span className="w-4/5 text-right pr-4">Balance Due</span>
                      <span className="text-right font-mono text-red-600">{data.balance.toFixed(3)} ر.ع.</span>
                   </div>
                </div>

                <div className="border-r border-b border-gray-400 p-3 min-h-20">
                  <p className="text-xs font-bold text-gray-700 mb-1">Terms & Conditions:</p>
                  <ul className="text-xs text-gray-600 list-decimal pl-4 space-y-0.5">
                    <li>Goods once sold will not be taken back or exchanged.</li>
                    <li>Subject to local Oman jurisdiction.</li>
                    <li>Official receipt issued by {shopName}{shopCrNo ? ` (C.R. NO: ${shopCrNo})` : ""}.</li>
                  </ul>
                </div>
              </div>

            </div>
          </div>

          {/* Right Sidebar - Actions (Hidden on Print) */}
          <div className="w-64 bg-white border-l flex flex-col shrink-0 p-6 hide-print no-print">
            <h3 className="font-semibold text-gray-800 mb-6">Share & Print</h3>

            <div className="flex gap-4 mb-8">
              <button
                onClick={handleShareWhatsApp}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition cursor-pointer"
              >
                <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center border border-green-200 shadow-xs">
                  <Share2 className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-gray-600">Whatsapp</span>
              </button>

              <button
                onClick={handleShareGmail}
                className="flex flex-col items-center gap-2 hover:opacity-80 transition cursor-pointer"
              >
                <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center border border-red-200 shadow-xs">
                   <span className="text-lg font-bold">M</span>
                </div>
                <span className="text-xs font-medium text-gray-600">Gmail</span>
              </button>
            </div>

            <div className="space-y-4">
               <button
                 onClick={handleDownloadPDF}
                 className="w-full py-3.5 border border-gray-200 rounded-xl flex flex-col items-center gap-1.5 hover:bg-gray-50 text-blue-600 transition cursor-pointer shadow-xs"
               >
                 <Download className="w-5 h-5" />
                 <span className="text-xs font-semibold text-gray-700">Download PDF</span>
               </button>

               <button
                 onClick={handlePrintThermal}
                 className="w-full py-3.5 border border-gray-200 rounded-xl flex flex-col items-center gap-1.5 hover:bg-gray-50 text-slate-700 transition cursor-pointer shadow-xs"
               >
                 <Printer className="w-5 h-5 text-gray-600" />
                 <span className="text-xs font-semibold text-gray-700">Print Invoice (Thermal)</span>
               </button>

               <button
                 onClick={handlePrintNormal}
                 className="w-full py-3.5 border rounded-xl flex flex-col items-center gap-1.5 bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-blue-600 transition cursor-pointer"
               >
                 <Printer className="w-5 h-5 text-white" />
                 <span className="text-xs font-semibold text-white">Print Invoice (Normal)</span>
               </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
