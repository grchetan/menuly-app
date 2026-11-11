import { formatPrice } from "./config";

export interface ReceiptOrderData {
  orderNumber: string;
  tableNumber: string;
  customerName?: string | null;
  customerPhone?: string | null;
  notes?: string | null;
  items: Array<{
    id?: string;
    name: string;
    quantity: number;
    price: number;
    total?: number;
  }>;
  totalItems?: number;
  subtotal?: number;
  tax?: number;
  grandTotal: number;
  status?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  createdAt: string;
}

export interface ReceiptRestaurantData {
  name: string;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  slug?: string;
}

export function generateReceiptHtml(order: ReceiptOrderData, restaurant: ReceiptRestaurantData): string {
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const formattedTime = new Date(order.createdAt).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const subtotal = order.subtotal || order.grandTotal;
  const totalItems = order.totalItems || (order.items || []).reduce((acc, it) => acc + (it.quantity || 1), 0);

  const itemsRows = (order.items || [])
    .map((item) => {
      const lineTotal = item.total || item.price * item.quantity;
      return `
        <tr>
          <td class="col-item">
            <span class="item-name">${escapeHtml(item.name)}</span>
          </td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-rate">&#8377;${item.price.toFixed(2)}</td>
          <td class="col-total">&#8377;${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tax Invoice #${escapeHtml(order.orderNumber)} - ${escapeHtml(restaurant.name)}</title>
  <style>
    @page {
      size: auto;
      margin: 10mm auto;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Inter", "Helvetica Neue", Arial, sans-serif;
      font-size: 11px;
      line-height: 1.4;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* Print page outer wrapper: forces universal centering across all paper sizes & PDF drivers */
    .receipt-page-wrapper {
      width: 100%;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: flex-start;
      padding: 24px 12px;
      margin: 0 auto;
      text-align: center;
      box-sizing: border-box;
    }

    /* Receipt card: 80mm standard width, centered with auto margins */
    .receipt-card {
      width: 80mm;
      max-width: 100%;
      margin: 0 auto;
      display: inline-block;
      text-align: left;
      background: #ffffff;
      border: 1px solid #0f172a;
      border-radius: 8px;
      padding: 18px 16px;
      box-sizing: border-box;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      position: relative;
    }

    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: 700; }
    .uppercase { text-transform: uppercase; }
    .font-mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }

    /* Header styling */
    .receipt-header {
      text-align: center;
      padding-bottom: 8px;
      border-bottom: 1px dashed #94a3b8;
    }
    .restaurant-title {
      font-size: 16px;
      font-weight: 900;
      letter-spacing: -0.2px;
      text-transform: uppercase;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 3px;
    }
    .restaurant-meta {
      font-size: 10px;
      color: #475569;
      margin-top: 1.5px;
      line-height: 1.35;
    }
    .slip-badge-wrap {
      margin-top: 6px;
    }
    .slip-badge {
      display: inline-block;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      border: 1px solid #0f172a;
      border-radius: 4px;
      padding: 2px 8px;
      background: #f1f5f9;
      color: #0f172a;
    }

    /* Meta Table / Grid */
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0;
      font-size: 10.5px;
    }
    .meta-table td {
      padding: 2px 0;
      vertical-align: top;
    }
    .table-badge {
      display: inline-block;
      background: #0f172a;
      color: #ffffff;
      font-weight: 800;
      font-size: 10.5px;
      padding: 1.5px 6px;
      border-radius: 4px;
      letter-spacing: 0.5px;
    }
    .order-id-badge {
      font-weight: 800;
      font-family: ui-monospace, SFMono-Regular, monospace;
      color: #0f172a;
    }

    /* Cooking Notes Box */
    .notes-box {
      font-size: 10px;
      padding: 5px 8px;
      margin: 6px 0;
      border-left: 3px solid #d97706;
      background: #fffbeb;
      border-radius: 0 4px 4px 0;
      color: #92400e;
      line-height: 1.35;
    }

    /* Items Table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 4px 0;
      font-size: 10.5px;
    }
    .items-table th {
      border-top: 1px solid #0f172a;
      border-bottom: 1.5px solid #0f172a;
      padding: 5px 2px;
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9.5px;
      letter-spacing: 0.4px;
      color: #0f172a;
    }
    .items-table td {
      padding: 5px 2px;
      vertical-align: top;
      border-bottom: 1px dotted #cbd5e1;
    }
    .items-table tr:last-child td {
      border-bottom: none;
    }
    .col-item { text-align: left; width: 48%; }
    .col-qty { text-align: center; width: 14%; font-weight: 700; }
    .col-rate { text-align: right; width: 18%; font-variant-numeric: tabular-nums; }
    .col-total { text-align: right; width: 20%; font-weight: 800; font-variant-numeric: tabular-nums; color: #0f172a; }

    .item-name {
      display: block;
      word-break: break-word;
      font-weight: 600;
      color: #1e293b;
    }

    /* Dividers */
    .divider {
      border-top: 1px dashed #94a3b8;
      margin: 7px 0;
    }
    .divider-double {
      border-top: 2px solid #0f172a;
      border-bottom: 1px solid #0f172a;
      height: 2px;
      margin: 7px 0;
    }

    /* Totals Table */
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 11px;
    }
    .totals-table td {
      padding: 2.5px 0;
      color: #334155;
    }
    .grand-total-row td {
      font-size: 14px;
      font-weight: 900;
      padding: 6px 0;
      color: #0f172a;
      letter-spacing: -0.2px;
    }
    .grand-total-amount {
      font-size: 15px;
      font-weight: 900;
      color: #0f172a;
    }

    /* Footer */
    .receipt-footer {
      text-align: center;
      margin-top: 8px;
      font-size: 9.5px;
      color: #475569;
      border-top: 1px dashed #94a3b8;
      padding-top: 7px;
      line-height: 1.45;
    }
    .thankyou {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #0f172a;
      margin-bottom: 2px;
    }
    .footer-note {
      font-size: 9px;
      color: #64748b;
    }
    .branding {
      font-size: 8.5px;
      color: #64748b;
      margin-top: 5px;
      letter-spacing: 0.3px;
    }

    /* Print media overrides: perfectly centered on A4 / Letter, exact fit on 80mm thermal roll */
    @media print {
      html, body {
        width: 100% !important;
        height: auto !important;
        background-color: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .receipt-page-wrapper {
        width: 100% !important;
        min-height: auto !important;
        display: flex !important;
        justify-content: center !important;
        align-items: flex-start !important;
        padding: 0 !important;
        margin: 0 auto !important;
        background: transparent !important;
      }
      .receipt-card {
        width: 80mm !important;
        max-width: 100% !important;
        margin: 0 auto !important;
        display: block !important;
        border: 1px solid #0f172a !important;
        border-radius: 6px !important;
        box-shadow: none !important;
        padding: 14px 12px !important;
        background: #ffffff !important;
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-page-wrapper">
    <div class="receipt-card">
      <div class="receipt-header">
        <div class="restaurant-title">${escapeHtml(restaurant.name)}</div>
        ${restaurant.address ? `<div class="restaurant-meta">${escapeHtml(restaurant.address)}</div>` : ""}
        ${restaurant.phone || restaurant.whatsapp ? `<div class="restaurant-meta">Tel / WhatsApp: ${escapeHtml(restaurant.phone || restaurant.whatsapp || "")}</div>` : ""}
        <div class="slip-badge-wrap">
          <div class="slip-badge">TAX INVOICE &bull; DINE-IN ORDER SLIP</div>
        </div>
      </div>

      <table class="meta-table">
        <tr>
          <td class="bold">Order No:</td>
          <td class="text-right">
            <span class="order-id-badge">${escapeHtml(order.orderNumber)}</span>
          </td>
        </tr>
        <tr>
          <td class="bold">Table No:</td>
          <td class="text-right">
            <span class="table-badge">TABLE #${escapeHtml(order.tableNumber)}</span>
          </td>
        </tr>
        <tr>
          <td>Date &amp; Time:</td>
          <td class="text-right">${escapeHtml(formattedDate)} ${escapeHtml(formattedTime)}</td>
        </tr>
        ${order.customerName ? `
        <tr>
          <td>Diner:</td>
          <td class="text-right bold">
            ${escapeHtml(order.customerName)}
            ${order.customerPhone ? `<span style="font-weight: normal; color: #475569;">(${escapeHtml(order.customerPhone)})</span>` : ""}
          </td>
        </tr>
        ` : order.customerPhone ? `
        <tr>
          <td>Contact:</td>
          <td class="text-right bold">${escapeHtml(order.customerPhone)}</td>
        </tr>
        ` : ""}
      </table>

      ${order.notes ? `
      <div class="notes-box">
        <strong>Special Cooking Note:</strong> ${escapeHtml(order.notes)}
      </div>
      ` : ""}

      <table class="items-table">
        <thead>
          <tr>
            <th class="col-item">Item</th>
            <th class="col-qty">Qty</th>
            <th class="col-rate">Rate</th>
            <th class="col-total">Amt</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>

      <div class="divider"></div>

      <table class="totals-table">
        <tr>
          <td>Subtotal (${totalItems} items):</td>
          <td class="text-right bold font-mono">&#8377;${subtotal.toFixed(2)}</td>
        </tr>
        <tr>
          <td>GST &amp; Service Charges:</td>
          <td class="text-right" style="color: #059669; font-weight: 700;">Included</td>
        </tr>
      </table>

      <div class="divider-double"></div>

      <table class="totals-table">
        <tr class="grand-total-row">
          <td>GRAND TOTAL:</td>
          <td class="text-right grand-total-amount font-mono">&#8377;${order.grandTotal.toFixed(2)}</td>
        </tr>
      </table>

      <div class="divider-double"></div>

      <table class="meta-table" style="margin-top: 4px;">
        <tr>
          <td>Payment Mode:</td>
          <td class="text-right bold uppercase">${escapeHtml(order.paymentMethod || "Pay at Counter / Server")}</td>
        </tr>
        <tr>
          <td>Order Status:</td>
          <td class="text-right bold uppercase" style="color: #0f172a;">${escapeHtml(order.status || "SENT TO KITCHEN")}</td>
        </tr>
      </table>

      <div class="receipt-footer">
        <div class="thankyou">Thank You For Dining With Us!</div>
        <div class="footer-note">Please show this slip to your server or billing counter.</div>
        <div class="branding">
          Powered by <strong>Menuly</strong> &bull; Smart Contactless QR Menu &amp; POS
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Triggers clean standalone receipt printing without any webpage clutter,
 * background images, dimmed modal backdrop, or extra pages.
 */
export function printReceipt(order: ReceiptOrderData, restaurant: ReceiptRestaurantData): void {
  if (typeof window === "undefined") return;

  const html = generateReceiptHtml(order, restaurant);

  // Method 1: Invisible iframe for seamless, 1-page clean printing
  try {
    const existing = document.getElementById("menuly-receipt-print-frame");
    if (existing) {
      existing.remove();
    }

    const iframe = document.createElement("iframe");
    iframe.setAttribute("id", "menuly-receipt-print-frame");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.opacity = "0";
    iframe.style.zIndex = "-9999";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch {
          // If iframe printing is blocked, fallback to popup window
          fallbackPrintWindow(html);
        } finally {
          setTimeout(() => {
            try {
              iframe.remove();
            } catch {}
          }, 3000);
        }
      }, 350);
      return;
    }
  } catch {
    // Fallback if iframe creation fails
  }

  // Method 2: Fallback popup print window
  fallbackPrintWindow(html);
}

function fallbackPrintWindow(html: string): void {
  try {
    const printWindow = window.open("", "_blank", "width=480,height=700,resizable=yes,scrollbars=yes");
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 400);
      return;
    }
  } catch {}

  // Last-resort fallback
  window.print();
}
