// Turns a pasted table or an uploaded CSV into holdings this app understands.
//
// The point is that a user should be able to export from Zerodha, Groww,
// Upstox, Angel One, Dhan, a crypto exchange or plain Excel and have it just
// work, without being told to rename their columns first.

// Header names seen across Indian brokers, normalised to letters only.
const ALIASES = {
  name: [
    'symbol', 'tradingsymbol', 'instrument', 'instrumentname', 'stock', 'stockname',
    'scrip', 'scripname', 'security', 'securityname', 'company', 'companyname',
    'scheme', 'schemename', 'fundname', 'name', 'coin', 'asset', 'currency', 'isin'
  ],
  quantity: [
    'quantity', 'qty', 'shares', 'units', 'unit', 'holdingqty', 'holdingquantity',
    'netquantity', 'netqty', 'balance', 'closingbalance', 'availablequantity', 'totalquantity'
  ],
  buy: [
    'averageprice', 'avgprice', 'averagecost', 'avgcost', 'buyprice', 'buyavg',
    'buyaverageprice', 'purchaseprice', 'costprice', 'avgbuyprice', 'averagebuyprice',
    'buynav', 'purchasenav', 'averagenav', 'costperunit', 'avgnav'
  ],
  current: [
    'lastprice', 'ltp', 'currentprice', 'marketprice', 'closeprice', 'closingprice',
    'previousclosing', 'nav', 'currentnav', 'latestnav', 'currentmarketprice', 'cmp'
  ]
};

const norm = s => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// Split one delimited line, honouring "quoted, fields".
function splitLine(line, delim) {
  const out = [];
  let cur = '';
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') { cur += '"'; i++; }  // escaped quote
      else quoted = !quoted;
    } else if (ch === delim && !quoted) {
      out.push(cur); cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map(c => c.trim());
}

// Excel copy-paste gives tabs; a downloaded file gives commas or semicolons.
function detectDelimiter(sample) {
  const counts = ['\t', ',', ';', '|'].map(d => ({ d, n: (sample.match(new RegExp(`\\${d}`, 'g')) || []).length }));
  counts.sort((a, b) => b.n - a.n);
  return counts[0].n > 0 ? counts[0].d : ',';
}

// Find a column by heading. An exact match wins; otherwise fall back to a
// loose one, because real exports say "Quantity Available", "Avg. Buy Price (₹)"
// and similar rather than the bare word.
function findColumn(normalisedCells, key) {
  const exact = normalisedCells.findIndex(c => ALIASES[key].includes(c));
  if (exact !== -1) return exact;
  return normalisedCells.findIndex(c => c && ALIASES[key].some(a => c.includes(a)));
}

// Brokers often put a title or account details above the real table, so find
// the first row that actually looks like column headings.
function findHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 25); i++) {
    const cells = rows[i].map(norm);
    if (findColumn(cells, 'name') !== -1 && findColumn(cells, 'quantity') !== -1) return i;
  }
  return -1;
}

function mapColumns(header) {
  const cells = header.map(norm);
  return {
    name: findColumn(cells, 'name'),
    quantity: findColumn(cells, 'quantity'),
    buy: findColumn(cells, 'buy'),
    current: findColumn(cells, 'current')
  };
}

const toNumber = v => {
  if (v === null || v === undefined) return null;
  // Strips ₹, commas, spaces, and trailing notes like "1,234.50 Cr".
  const cleaned = String(v).replace(/[₹$,\s]/g, '').replace(/[^0-9.\-eE]/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
};

/**
 * @returns {{ rows: Array, columns: object, headerRow: Array, skipped: number, error?: string }}
 */
export function parseHoldingsTable(text) {
  const clean = String(text || '').replace(/\r\n?/g, '\n').trim();
  if (!clean) return { rows: [], columns: null, headerRow: [], skipped: 0, error: 'Nothing to read.' };

  const delim = detectDelimiter(clean.split('\n').slice(0, 5).join('\n'));
  const grid = clean.split('\n').filter(l => l.trim()).map(l => splitLine(l, delim));

  const headerIdx = findHeaderRow(grid);
  if (headerIdx === -1) {
    return {
      rows: [], columns: null, headerRow: [], skipped: 0,
      error: 'Could not find a heading row. The file needs a column for the name or symbol and one for quantity or units.'
    };
  }

  const columns = mapColumns(grid[headerIdx]);
  const rows = [];
  let skipped = 0;

  for (let i = headerIdx + 1; i < grid.length; i++) {
    const cells = grid[i];
    const name = columns.name >= 0 ? String(cells[columns.name] || '').trim() : '';
    const quantity = columns.quantity >= 0 ? toNumber(cells[columns.quantity]) : null;

    // Broker exports end with "Total" / "Grand Total" lines; those are not holdings.
    if (!name || /^(total|grand total|sub total|subtotal)$/i.test(name)) { skipped++; continue; }
    if (quantity === null || quantity === 0) { skipped++; continue; }

    rows.push({
      name,
      quantity,
      buyPrice: columns.buy >= 0 ? toNumber(cells[columns.buy]) : null,
      currentPrice: columns.current >= 0 ? toNumber(cells[columns.current]) : null
    });
  }

  return { rows, columns, headerRow: grid[headerIdx], skipped };
}

// Shape a parsed row into the columns the holdings table actually uses.
// Mutual funds keep their values in units/buy_nav/current_nav rather than
// quantity/buy_price/current_price.
export function toHolding(row, type) {
  const base = { type, quote_id: row.quoteId || null };

  if (type === 'mf') {
    return {
      ...base,
      scheme: row.name,
      units: row.quantity,
      buy_nav: row.buyPrice,
      current_nav: row.currentPrice
    };
  }

  const nameField = (type === 'stocks' || type === 'crypto') ? 'symbol' : 'name';
  return {
    ...base,
    [nameField]: row.name,
    quantity: row.quantity,
    buy_price: row.buyPrice,
    current_price: row.currentPrice
  };
}

// Rows the user still needs to fix before anything is saved.
export function validateRow(row, type) {
  const problems = [];
  if (!row.name) problems.push('name missing');
  if (!row.quantity || row.quantity <= 0) problems.push(type === 'mf' ? 'units missing' : 'quantity missing');
  if (row.buyPrice === null || row.buyPrice === undefined) problems.push(type === 'mf' ? 'buy NAV missing' : 'buy price missing');
  return problems;
}
