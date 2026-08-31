// Exporting holdings.
//
// CSV is built by hand rather than pulled from a library: the file is a few
// columns wide and a dependency for that is not worth the weight.
//
// PDF goes through the browser's own print dialogue ("Save as PDF"). A PDF
// library would add roughly 300 kB to every page load so that a handful of
// users can press one button, and browsers already render a better table than
// a hand-rolled generator would.

const num = v => (typeof v === 'number' ? v : parseFloat(v) || 0);

export function valueOf(h) {
  switch (h.type) {
    case 'mf': return num(h.units) * (num(h.current_nav) || num(h.buy_nav));
    case 'stocks':
    case 'crypto':
    case 'gold': return num(h.quantity) * (num(h.current_price) || num(h.buy_price));
    case 'properties': return num(h.buy_price);
    default: return num(h.quantity);
  }
}

export function costOf(h) {
  switch (h.type) {
    case 'mf': return num(h.units) * num(h.buy_nav);
    case 'stocks':
    case 'crypto':
    case 'gold': return num(h.quantity) * num(h.buy_price);
    case 'properties': return num(h.quantity);
    default: return num(h.quantity);
  }
}

const COLUMNS = [
  ['Type', h => h.type],
  ['Name', h => h.symbol || h.scheme || h.name || ''],
  ['Quantity / Units', h => num(h.quantity) || num(h.units) || ''],
  ['Buy price / NAV', h => num(h.buy_price) || num(h.buy_nav) || ''],
  ['Current price / NAV', h => num(h.current_price) || num(h.current_nav) || ''],
  ['Purchase date', h => h.purchase_date || ''],
  ['Invested', h => Math.round(costOf(h))],
  ['Current value', h => Math.round(valueOf(h))],
  ['Gain / loss', h => Math.round(valueOf(h) - costOf(h))]
];

/** Wrap a value so commas, quotes and newlines cannot break the row apart. */
function csvCell(value) {
  const s = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function holdingsToCsv(holdings, { portfolioName = 'Portfolio' } = {}) {
  const lines = [];
  lines.push(COLUMNS.map(c => csvCell(c[0])).join(','));

  for (const h of holdings) {
    lines.push(COLUMNS.map(([, get]) => csvCell(get(h))).join(','));
  }

  const invested = holdings.reduce((s, h) => s + costOf(h), 0);
  const value = holdings.reduce((s, h) => s + valueOf(h), 0);
  lines.push('');
  lines.push(['Total', portfolioName, '', '', '', '', Math.round(invested), Math.round(value), Math.round(value - invested)].map(csvCell).join(','));

  // A leading BOM makes Excel read ₹ and Devanagari correctly instead of
  // showing mojibake.
  return '﻿' + lines.join('\r\n');
}

export function downloadCsv(holdings, portfolioName = 'Portfolio') {
  const csv = holdingsToCsv(holdings, { portfolioName });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeName(portfolioName)}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in some browsers.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const safeName = s => String(s).replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'portfolio';

const inr = n => '₹' + Math.abs(Math.round(n)).toLocaleString('en-IN');
const signed = n => (n < 0 ? '-' : '') + inr(n);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * Open a clean, printable statement in a new window and raise the print
 * dialogue, where the user chooses "Save as PDF".
 */
export function printStatement(holdings, { portfolioName = 'Portfolio', ownerEmail = '' } = {}) {
  const invested = holdings.reduce((s, h) => s + costOf(h), 0);
  const value = holdings.reduce((s, h) => s + valueOf(h), 0);
  const pl = value - invested;
  const pct = invested > 0 ? (pl / invested) * 100 : 0;

  const rows = holdings.map(h => {
    const c = costOf(h);
    const v = valueOf(h);
    const g = v - c;
    return `<tr>
      <td>${esc(h.symbol || h.scheme || h.name || '')}<span class="muted"> · ${esc(h.type)}</span></td>
      <td class="r">${esc(num(h.quantity) || num(h.units) || '')}</td>
      <td class="r">${esc(h.purchase_date || '—')}</td>
      <td class="r">${inr(c)}</td>
      <td class="r">${inr(v)}</td>
      <td class="r ${g >= 0 ? 'up' : 'down'}">${signed(g)}</td>
    </tr>`;
  }).join('');

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><title>${esc(portfolioName)} — statement</title>
<style>
  @page { margin: 18mm; }
  body { font: 12px/1.5 system-ui, sans-serif; color: #0F172A; }
  h1 { font-size: 20px; margin: 0 0 2px; }
  .muted { color: #64748B; font-weight: normal; }
  .head { display: flex; justify-content: space-between; align-items: flex-end;
          border-bottom: 2px solid #E2E8F0; padding-bottom: 10px; margin-bottom: 18px; }
  .totals { display: flex; gap: 28px; margin-bottom: 20px; }
  .totals div span { display: block; color: #64748B; font-size: 11px; }
  .totals div strong { font-size: 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: .05em;
       color: #64748B; border-bottom: 1px solid #E2E8F0; padding: 8px 6px; }
  td { padding: 8px 6px; border-bottom: 1px solid #F1F5F9; }
  .r { text-align: right; }
  .up { color: #047857; } .down { color: #BE123C; }
  tfoot td { border-top: 2px solid #E2E8F0; font-weight: 600; }
  .note { margin-top: 22px; color: #64748B; font-size: 10px; }
</style></head>
<body>
  <div class="head">
    <div>
      <h1>${esc(portfolioName)}</h1>
      <div class="muted">MYWEALTH${ownerEmail ? ' · ' + esc(ownerEmail) : ''}</div>
    </div>
    <div class="muted">${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <div class="totals">
    <div><span>Invested</span><strong>${inr(invested)}</strong></div>
    <div><span>Current value</span><strong>${inr(value)}</strong></div>
    <div><span>Gain / loss</span><strong class="${pl >= 0 ? 'up' : 'down'}">${signed(pl)} (${pct.toFixed(2)}%)</strong></div>
  </div>

  <table>
    <thead><tr>
      <th>Holding</th><th class="r">Qty</th><th class="r">Bought</th>
      <th class="r">Invested</th><th class="r">Value</th><th class="r">Gain / loss</th>
    </tr></thead>
    <tbody>${rows || '<tr><td colspan="6" class="muted">No holdings.</td></tr>'}</tbody>
    <tfoot><tr>
      <td>Total · ${holdings.length} holding${holdings.length === 1 ? '' : 's'}</td>
      <td></td><td></td>
      <td class="r">${inr(invested)}</td>
      <td class="r">${inr(value)}</td>
      <td class="r ${pl >= 0 ? 'up' : 'down'}">${signed(pl)}</td>
    </tr></tfoot>
  </table>

  <p class="note">
    Values are as recorded in MYWEALTH on the date above and may lag the market.
    This statement is for your own reference; it is not a broker or tax document.
  </p>
</body></html>`;

  const w = window.open('', '_blank');
  if (!w) throw new Error('Your browser blocked the print window. Allow pop-ups for this site and try again.');

  w.document.write(html);
  w.document.close();
  // Give the new document a moment to lay out before the dialogue opens.
  w.onload = () => setTimeout(() => w.print(), 250);
}
