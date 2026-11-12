const escapeHtml = value =>
  String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);

const money = value =>
  `৳${Number(value ?? 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

function dateText(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString("en-BD", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
}

export function printOrderInvoice(order) {
  if (!order) return;

  const items = Array.isArray(order.items) ? order.items : [];

  const rows = items.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>
        <strong>${escapeHtml(item.name)}</strong>
        ${item.size
          ? `<small>Size: ${escapeHtml(item.size)}</small>`
          : ""}
        <small>SKU: ${escapeHtml(item.sku)}</small>
      </td>
      <td>${escapeHtml(item.quantity)}</td>
      <td>${money(item.price)}</td>
      <td>${money(item.subtotal)}</td>
    </tr>
  `).join("");

  const address = [
    order.shippingAddress?.address,
    order.shippingAddress?.area,
    order.shippingAddress?.district
  ].filter(Boolean).map(escapeHtml).join(", ");

  const payment = order.paymentMethod === "cod"
    ? "Cash on Delivery"
    : escapeHtml(order.paymentMethod || "Not specified");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Invoice ${escapeHtml(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: #edf2f5;
      color: #213346;
      font: 14px/1.55 Arial, sans-serif;
    }
    .toolbar {
      max-width: 880px;
      margin: 20px auto 0;
      text-align: right;
    }
    .toolbar button {
      background: #11786e;
      color: white;
      border: 0;
      border-radius: 9px;
      padding: 12px 22px;
      cursor: pointer;
    }
    .invoice {
      max-width: 880px;
      margin: 15px auto 40px;
      padding: 42px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 35px #19304a12;
    }
    .head, .columns, .totals-row {
      display: flex;
      justify-content: space-between;
      gap: 24px;
    }
    .brand {
      font-size: 29px;
      font-weight: 800;
      letter-spacing: -1.2px;
      color: #183247;
    }
    .brand span { color: #128679; }
    h1 {
      margin: 0;
      font-size: 27px;
      letter-spacing: 2px;
      color: #183247;
    }
    h2 {
      font-size: 11px;
      letter-spacing: 1.5px;
      color: #718497;
      text-transform: uppercase;
    }
    p { margin: 4px 0; }
    .muted { color: #708194; }
    .meta { margin-top: 27px; }
    .columns > div { width: 48%; }
    .rule {
      height: 3px;
      margin: 30px 0;
      background: linear-gradient(90deg, #137e71, #d6ede7);
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 25px;
    }
    th {
      padding: 13px 8px;
      background: #edf6f3;
      color: #234c45;
      font-size: 11px;
      text-align: left;
      text-transform: uppercase;
    }
    td {
      padding: 14px 8px;
      border-bottom: 1px solid #e9edf0;
      vertical-align: top;
    }
    small { display: block; color: #768696; }
    .totals {
      max-width: 330px;
      margin: 26px 0 20px auto;
    }
    .totals-row { margin: 8px 0; }
    .grand {
      margin-top: 16px;
      border-top: 2px solid #e5efec;
      padding-top: 15px;
      font-size: 20px;
      font-weight: 800;
      color: #10796c;
    }
    .footer {
      border-top: 1px solid #e3e9ed;
      margin-top: 38px;
      padding-top: 22px;
      text-align: center;
      color: #65778b;
    }
    @media (max-width: 600px) {
      .invoice { margin: 0; padding: 20px; border-radius: 0; }
      .head { flex-wrap: wrap; }
      .columns { flex-direction: column; }
      .columns > div { width: 100%; }
      table { font-size: 11px; }
      th, td { padding: 8px 4px; }
    }
    @page { size: A4; margin: 12mm; }
    @media print {
      body { background: white; }
      .toolbar { display: none; }
      .invoice {
        margin: 0;
        padding: 0;
        max-width: none;
        box-shadow: none;
      }
      tr { break-inside: avoid; }
      * { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <main class="invoice">
    <div class="head">
      <div>
        <div class="brand">everything<span>bd</span>.</div>
        <p class="muted">Customer Support: 01316804410</p>
      </div>
      <div>
        <h1>INVOICE</h1>
        <p><b>${escapeHtml(order.orderNumber)}</b></p>
        <p class="muted">${dateText(order.createdAt)}</p>
      </div>
    </div>
    <div class="rule"></div>
    <div class="columns">
      <div>
        <h2>Bill To</h2>
        <p><b>${escapeHtml(order.customer?.name)}</b></p>
        <p>${escapeHtml(order.customer?.phone)}</p>
        <p>${escapeHtml(order.customer?.email)}</p>
        <p>${address}</p>
      </div>
      <div>
        <h2>Order Information</h2>
        <p>Order: <b>${escapeHtml(order.orderNumber)}</b></p>
        <p>Status: ${escapeHtml(order.orderStatus)}</p>
        <p>Payment: ${payment}</p>
        <p>Payment Status: ${escapeHtml(order.paymentStatus)}</p>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Product Description</th>
          <th>Qty</th>
          <th>Unit Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="totals">
      <div class="totals-row">
        <span>Subtotal</span><b>${money(order.subtotal)}</b>
      </div>
      <div class="totals-row">
        <span>Delivery Charge</span>
        <b>${money(order.deliveryCharge)}</b>
      </div>
      <div class="totals-row">
        <span>Discount</span>
        <b>− ${money(order.discount)}</b>
      </div>
      <div class="totals-row grand">
        <span>Grand Total</span><span>${money(order.total)}</span>
      </div>
    </div>
    <div class="footer">
      <p><b>Thank you for shopping with EverythingBD!</b></p>
      <p>Invoice generated from the recorded order details.</p>
    </div>
  </main>
</body>
</html>`;

  const popup = window.open(
    "",
    "_blank",
    "width=920,height=800"
  );

  if (!popup) {
    window.alert(
      "Please allow popups to print the invoice."
    );
    return;
  }

  popup.document.open();
  popup.document.write(html);
  popup.document.close();
  popup.focus();
}
