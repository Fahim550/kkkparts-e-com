import type { DbOrder } from "@/hooks/useDatabase";

interface InvoicePrintProps {
  order: DbOrder;
}

export const printInvoice = (order: DbOrder) => {
  const items = (order.items as any[]) || [];
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Invoice - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #1a1a1a; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid #111; padding-bottom: 20px; }
    .logo { font-size: 28px; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
    .invoice-title { text-align: right; }
    .invoice-title h2 { font-size: 24px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .invoice-title p { color: #666; font-size: 13px; margin-top: 4px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-block h4 { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 8px; }
    .info-block p { font-size: 14px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
    th { background: #111; color: #fff; text-align: left; padding: 12px 16px; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 12px 16px; border-bottom: 1px solid #eee; font-size: 14px; }
    tr:nth-child(even) { background: #f9f9f9; }
    .totals { text-align: right; margin-top: 10px; }
    .totals .row { display: flex; justify-content: flex-end; gap: 40px; padding: 6px 0; font-size: 14px; }
    .totals .total-row { font-size: 20px; font-weight: 900; border-top: 2px solid #111; padding-top: 10px; margin-top: 6px; }
    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 20px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><img src="/logo.png" alt="kkkparts" style="max-height: 40px; width: auto;" onerror="this.style.display='none'; this.nextSibling.style.display='block';" /><span style="display:none;">kkkparts.com</span></div>
    <div class="invoice-title">
      <h2>Invoice</h2>
      <p>${order.order_number} · ${new Date(order.created_at).toLocaleDateString("en-GB")}</p>
    </div>
  </div>
  <div class="info-grid">
    <div class="info-block">
      <h4>Bill To</h4>
      <p><strong>${order.customer_name}</strong></p>
      <p>${order.customer_phone}</p>
      ${order.customer_email ? `<p>${order.customer_email}</p>` : ""}
      <p>${order.shipping_address}</p>
    </div>
    <div class="info-block">
      <h4>Order Details</h4>
      <p><strong>Order:</strong> ${order.order_number}</p>
      <p><strong>Date:</strong> ${new Date(order.created_at).toLocaleDateString("en-GB")}</p>
      <p><strong>Payment:</strong> ${order.payment_method.toUpperCase()}</p>
      <p><strong>Status:</strong> ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Item</th><th>Size</th><th>Color</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr>
    </thead>
    <tbody>
      ${items
        .map(
          (item: any) => `
        <tr>
          <td>${item.productName}</td>
          <td>${item.size}</td>
          <td>${item.color}</td>
          <td>${item.quantity}</td>
          <td style="text-align:right">OMR ${Number(item.price).toFixed(3)}</td>
          <td style="text-align:right">OMR ${(item.price * item.quantity).toFixed(3)}</td>
        </tr>
      `,
        )
        .join("")}
    </tbody>
  </table>
  <div class="totals">
    <div class="row"><span>Subtotal:</span><span>OMR ${Number(order.total).toFixed(3)}</span></div>
    <div class="row total-row"><span>Total:</span><span>OMR ${Number(order.total).toFixed(3)}</span></div>
  </div>
  <div class="footer">
    <p>Thank you for shopping with kkkparts · Oman</p>
  </div>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
};

export const printCourierSlip = (order: DbOrder) => {
  const items = (order.items as any[]) || [];
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Courier Slip - ${order.order_number}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a1a; max-width: 400px; margin: 0 auto; }
    .slip { border: 2px solid #111; padding: 24px; }
    .slip-header { text-align: center; border-bottom: 2px dashed #ccc; padding-bottom: 16px; margin-bottom: 16px; }
    .slip-header h1 { font-size: 20px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
    .slip-header p { font-size: 11px; color: #666; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .section { margin-bottom: 16px; }
    .section-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #999; margin-bottom: 6px; font-weight: 700; }
    .field { font-size: 14px; line-height: 1.5; }
    .field strong { font-weight: 700; }
    .order-num { font-size: 22px; font-weight: 900; text-align: center; background: #111; color: #fff; padding: 10px; margin-bottom: 16px; letter-spacing: 2px; }
    .items-list { font-size: 12px; line-height: 1.8; }
    .cod-badge { text-align: center; background: #fef3c7; color: #92400e; font-weight: 900; font-size: 16px; padding: 10px; margin-top: 16px; text-transform: uppercase; letter-spacing: 2px; border: 2px solid #f59e0b; }
    .total-amount { text-align: center; font-size: 28px; font-weight: 900; margin-top: 12px; }
    .footer { text-align: center; margin-top: 16px; padding-top: 16px; border-top: 2px dashed #ccc; font-size: 10px; color: #999; }
    @media print { body { padding: 10px; } }
  </style>
</head>
<body>
  <div class="slip">
    <div class="slip-header">
      <img src="/logo.png" alt="kkkparts.com" style="max-height: 40px; margin-bottom: 8px;" onerror="this.style.display='none'; this.nextSibling.style.display='block';" />
      <h1 style="display:none;">kkkparts.com</h1>
      <p>Courier Delivery Slip</p>
    </div>
    <div class="order-num">${order.order_number}</div>
    <div class="section">
      <div class="section-title">Deliver To</div>
      <div class="field"><strong>${order.customer_name}</strong></div>
      <div class="field">${order.customer_phone}</div>
      <div class="field">${order.shipping_address}</div>
    </div>
    <div class="section">
      <div class="section-title">Items (${items.reduce((sum: number, i: any) => sum + i.quantity, 0)} pcs)</div>
      <div class="items-list">
        ${items.map((item: any) => `• ${item.productName} — Size ${item.size}, ${item.color} ×${item.quantity}`).join("<br/>")}
      </div>
    </div>
    <div class="cod-badge">Cash on Delivery</div>
    <div class="total-amount">OMR ${Number(order.total).toFixed(3)}</div>
    <div class="footer">
      <p>Date: ${new Date(order.created_at).toLocaleDateString("en-GB")}</p>
    </div>
  </div>
</body>
</html>`;
  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => win.print();
  }
};
