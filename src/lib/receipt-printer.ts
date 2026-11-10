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
  });

  const itemsRows = (order.items || [])
    .map((item) => {
      const lineTotal = item.total || item.price * item.quantity;
      return `
        <tr>
          <td class="col-item">
            <span class="item-name">${escapeHtml(item.name)}</span>
          </td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-rate">${item.price.toFixed(2)}</td>
          <td class="col-total">${lineTotal.toFixed(2)}</td>
        </tr>
      `;
    })
    .join("");

  const subtotal = order.subtotal || order.grandTotal;
  const totalItems = order.totalItems || order.items.reduce((acc, it) => acc + it.quantity, 0);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Receipt ${escapeHtml(order.orderNumber)} - ${escapeHtml(restaurant.name)}</title>
  <style>
    @page {
      size: 80mm auto;
      margin: 3mm 4mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: "Courier New", Courier, monospace, -apple-system, system-ui;
      font-size: 11px;
      line-height: 1.35;
      color: #000;
      background: #fff;
      padding: 6px;
      width: 100%;
      max-width: 80mm;
      margin: 0 auto;
    }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .text-left { text-align: left; }
    .bold { font-weight: bold; }
    
    .receipt-header {
      text-align: center;
      padding-bottom: 6px;
      border-bottom: 1px dashed #000;
    }
    .restaurant-title {
      font-size: 15px;
      font-weight: 900;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .restaurant-meta {
      font-size: 10px;
      color: #333;
      margin-bottom: 3px;
    }
    .slip-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: bold;
      border: 1px solid #000;
      padding: 1px 6px;
      margin-top: 3px;
      text-transform: uppercase;
    }

    .meta-table {
      width: 100%;
      margin: 6px 0;
      font-size: 10.5px;
      border-collapse: collapse;
    }
    .meta-table td {
      padding: 1.5px 0;
      vertical-align: top;
    }

    .divider {
      border-top: 1px dashed #000;
      margin: 5px 0;
    }
    .divider-double {
      border-top: 2px solid #000;
      margin: 6px 0;
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin: 4px 0;
      font-size: 10.5px;
    }
    .items-table th {
      border-bottom: 1px solid #000;
      padding: 3px 0;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 10px;
    }
    .items-table td {
      padding: 3px 0;
      vertical-align: top;
    }
    .col-item { text-align: left; width: 48%; }
    .col-qty { text-align: center; width: 14%; }
    .col-rate { text-align: right; width: 18%; }
    .col-total { text-align: right; width: 20%; font-weight: bold; }
    
    .item-name {
      display: block;
      word-break: break-word;
    }

    .notes-box {
      font-size: 9.5px;
      padding: 3px;
      margin: 3px 0;
      border-left: 2px solid #000;
      background: #f8f8f8;
      font-style: italic;
    }

    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 4px;
      font-size: 11px;
    }
    .totals-table td {
      padding: 2px 0;
    }
    .grand-total-row td {
      font-size: 14px;
      font-weight: 900;
      padding: 4px 0;
    }

    .receipt-footer {
      text-align: center;
      margin-top: 8px;
      font-size: 9.5px;
      color: #222;
      border-top: 1px dashed #000;
      padding-top: 6px;
      line-height: 1.4;
    }
    .thankyou {
      font-weight: bold;
      text-transform: uppercase;
      margin-bottom: 2px;
    }
    .branding {
      font-size: 8.5px;
      color: #555;
    }

    @media print {
      body {
        width: 100%;
        margin: 0;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-header">
    <div class="restaurant-title">${escapeHtml(restaurant.name)}</div>
    ${restaurant.address ? `<div class="restaurant-meta">${escapeHtml(restaurant.address)}</div>` : ""}
    ${restaurant.phone || restaurant.whatsapp ? `<div class="restaurant-meta">Tel: ${escapeHtml(restaurant.phone || restaurant.whatsapp || "")}</div>` : ""}
    <div class="slip-badge">Dine-In Table Order Slip</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="bold">Order No:</td>
      <td class="text-right bold">${escapeHtml(order.orderNumber)}</td>
    </tr>
    <tr>
      <td class="bold">Table No:</td>
      <td class="text-right bold" style="font-size: 12px;">TABLE #${escapeHtml(order.tableNumber)}</td>
    </tr>
    <tr>
      <td>Date &amp; Time:</td>
      <td class="text-right">${escapeHtml(formattedDate)} ${escapeHtml(formattedTime)}</td>
    </tr>
    ${order.customerName ? `
    <tr>
      <td>Diner Name:</td>
      <td class="text-right">${escapeHtml(order.customerName)}</td>
    </tr>
    ` : ""}
  </table>

  ${order.notes ? `
  <div class="notes-box">
    <strong>Cooking Note:</strong> ${escapeHtml(order.notes)}
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
      <td class="text-right">₹${subtotal.toFixed(2)}</td>
    </tr>
    <tr>
      <td>Taxes &amp; Service:</td>
      <td class="text-right">Included</td>
    </tr>
  </table>

  <div class="divider-double"></div>

  <table class="totals-table">
    <tr class="grand-total-row">
      <td>GRAND TOTAL:</td>
      <td class="text-right">₹${order.grandTotal.toFixed(2)}</td>
    </tr>
  </table>

  <div class="divider-double"></div>

  <table class="meta-table" style="margin-top: 4px;">
    <tr>
      <td>Payment Mode:</td>
      <td class="text-right bold">Pay at Counter / Server</td>
    </tr>
    <tr>
      <td>Order Status:</td>
      <td class="text-right bold">${escapeHtml(order.status || "SENT TO KITCHEN")}</td>
    </tr>
  </table>

  <div class="receipt-footer">
    <div class="thankyou">Thank You For Dining With Us!</div>
    <div>Please show this slip to your server or counter.</div>
    <div class="branding" style="margin-top: 4px;">
      Powered by Menuly • Smart Contactless QR Menu
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
              document.body.removeChild(iframe);
            } catch {}
          }, 3000);
        }
      }, 300);
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
    const printWindow = window.open("", "_blank", "width=420,height=650,resizable=yes,scrollbars=yes");
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
