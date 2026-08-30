// Vercel serverless function: market data proxy.
//
// Why a server function instead of calling these APIs from the browser?
// Yahoo Finance and AMFI do not send CORS headers, so a browser fetch to them
// is blocked. This runs on Vercel's server, where CORS does not apply.
//
// Endpoints:
//   /api/market?action=search&type=stock|mf|crypto&q=tata
//   /api/market?action=quote&type=stock|mf|crypto&id=TCS.NS
//
// All three upstream sources are free and need no API key.

const UA = 'Mozilla/5.0 (compatible; BahiKhata/1.0)';

// ---------------------------------------------------------------- AMFI (MF)
// AMFI publishes one big semicolon-separated text file of every scheme's NAV,
// refreshed once per business day. It is a few MB, so we parse it once and keep
// it in module memory; Vercel reuses a warm function instance across requests.
const AMFI_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';
const AMFI_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

let amfiCache = { at: 0, schemes: [] };

async function getAmfiSchemes() {
  if (amfiCache.schemes.length && Date.now() - amfiCache.at < AMFI_TTL_MS) {
    return amfiCache.schemes;
  }

  const res = await fetch(AMFI_URL, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('AMFI returned ' + res.status);
  const text = await res.text();

  const schemes = [];
  for (const line of text.split('\n')) {
    // Data rows have 8 semicolon-separated fields. Category and fund-house
    // headers are plain lines with no semicolons, so this skips them.
    const p = line.split(';');
    if (p.length < 8) continue;
    const code = p[0].trim();
    const name = p[3].trim();
    const nav = parseFloat(p[6]);
    if (!/^\d+$/.test(code) || !name || !isFinite(nav)) continue;
    schemes.push({ code, name, plan: p[4].trim(), option: p[5].trim(), nav, date: p[7].trim() });
  }

  if (schemes.length) amfiCache = { at: Date.now(), schemes };
  return schemes;
}

// -------------------------------------------------------------- Yahoo (stock)
async function yahooSearch(q) {
  const url = `https://query1.finance.yahoo.com/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=15&newsCount=0`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Yahoo search returned ' + res.status);
  const data = await res.json();

  return (data.quotes || [])
    // Keep Indian listings and drop Yahoo's internal fund codes (0P0000....)
    .filter(q2 => q2.symbol && /\.(NS|BO)$/.test(q2.symbol) && !/^0P/.test(q2.symbol))
    .map(q2 => ({
      id: q2.symbol,
      label: q2.shortname || q2.longname || q2.symbol,
      sub: `${q2.symbol.endsWith('.NS') ? 'NSE' : 'BSE'} · ${q2.symbol.replace(/\.(NS|BO)$/, '')}`
    }))
    .slice(0, 10);
}

async function yahooQuote(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
  const res = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!res.ok) throw new Error('Yahoo quote returned ' + res.status);
  const meta = (await res.json())?.chart?.result?.[0]?.meta;
  if (!meta || typeof meta.regularMarketPrice !== 'number') throw new Error('No price for ' + symbol);

  return {
    id: symbol,
    name: meta.longName || meta.shortName || symbol,
    price: meta.regularMarketPrice,
    currency: meta.currency || 'INR'
  };
}

// ---------------------------------------------------------- CoinGecko (crypto)
async function cryptoSearch(q) {
  const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(q)}`, {
    headers: { 'User-Agent': UA }
  });
  if (!res.ok) throw new Error('CoinGecko search returned ' + res.status);
  const data = await res.json();

  return (data.coins || []).slice(0, 10).map(c => ({
    id: c.id,
    label: c.name,
    sub: (c.symbol || '').toUpperCase()
  }));
}

async function cryptoQuote(id) {
  const res = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=inr`,
    { headers: { 'User-Agent': UA } }
  );
  if (!res.ok) throw new Error('CoinGecko quote returned ' + res.status);
  const price = (await res.json())?.[id]?.inr;
  if (typeof price !== 'number') throw new Error('No price for ' + id);
  return { id, name: id, price, currency: 'INR' };
}

// ------------------------------------------------------------------- handler
export default async function handler(req, res) {
  const { action = 'search', type = 'stock', q = '', id = '' } = req.query || {};

  // Suggestions change slowly; let Vercel's CDN absorb repeat keystrokes.
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    if (action === 'search') {
      const term = String(q).trim();
      if (term.length < 2) return res.status(200).json({ results: [] });

      let results;
      if (type === 'crypto') {
        results = await cryptoSearch(term);
      } else if (type === 'mf') {
        const needle = term.toLowerCase();
        const seen = new Set();
        results = [];
        for (const s of await getAmfiSchemes()) {
          if (!s.name.toLowerCase().includes(needle)) continue;
          if (seen.has(s.name)) continue; // same scheme repeats per plan/option
          seen.add(s.name);
          results.push({ id: s.code, label: s.name, sub: `${s.plan} · NAV ₹${s.nav}` });
          if (results.length >= 10) break;
        }
      } else {
        results = await yahooSearch(term);
      }
      return res.status(200).json({ results });
    }

    // Batch refresh: items=stock:HDFCBANK.NS|mf:120503|crypto:bitcoin
    // One request for the whole portfolio instead of one per holding.
    if (action === 'quotes') {
      const items = String(req.query.items || '')
        .split('|')
        .filter(Boolean)
        .map(s => {
          const i = s.indexOf(':');
          return { key: s, type: s.slice(0, i), id: s.slice(i + 1) };
        })
        .slice(0, 60); // sanity cap

      const prices = {};

      // --- crypto: one call for every coin
      const cryptoItems = items.filter(i => i.type === 'crypto');
      if (cryptoItems.length) {
        // Older rows stored a ticker (BTC) rather than CoinGecko's slug.
        const resolved = await Promise.all(cryptoItems.map(async item => {
          if (/^[a-z0-9-]+$/.test(item.id) && item.id === item.id.toLowerCase()) return { item, cg: item.id };
          const hits = await cryptoSearch(item.id).catch(() => []);
          return { item, cg: hits[0] ? hits[0].id : null };
        }));

        const ids = [...new Set(resolved.map(r => r.cg).filter(Boolean))];
        if (ids.length) {
          const r = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(',')}&vs_currencies=inr`,
            { headers: { 'User-Agent': UA } }
          );
          const map = r.ok ? await r.json() : {};
          for (const { item, cg } of resolved) {
            const p = cg && map[cg] && map[cg].inr;
            if (typeof p === 'number') prices[item.key] = p;
          }
        }
      }

      // --- mutual funds: the AMFI file is already parsed and cached
      const mfItems = items.filter(i => i.type === 'mf');
      if (mfItems.length) {
        const schemes = await getAmfiSchemes().catch(() => []);
        for (const item of mfItems) {
          // Stored value may be the scheme code, or the scheme name for older rows.
          const hit = /^\d+$/.test(item.id)
            ? schemes.find(s => s.code === item.id)
            : schemes.find(s => s.name.toLowerCase() === item.id.toLowerCase());
          if (hit) prices[item.key] = hit.nav;
        }
      }

      // --- stocks: Yahoo has no reliable free batch endpoint, so fetch in parallel
      const stockItems = items.filter(i => i.type === 'stock');
      await Promise.all(stockItems.map(async item => {
        // Older rows stored a bare ticker; default it to the NSE listing.
        const symbol = /\.(NS|BO)$/.test(item.id) ? item.id : `${item.id}.NS`;
        try {
          const q = await yahooQuote(symbol);
          prices[item.key] = q.price;
        } catch {
          // one bad symbol must not sink the whole refresh
        }
      }));

      return res.status(200).json({ prices, at: new Date().toISOString() });
    }

    if (action === 'quote') {
      const key = String(id).trim();
      if (!key) return res.status(400).json({ error: 'id is required' });

      if (type === 'crypto') return res.status(200).json(await cryptoQuote(key));
      if (type === 'mf') {
        const hit = (await getAmfiSchemes()).find(s => s.code === key);
        if (!hit) return res.status(404).json({ error: 'Scheme not found' });
        return res.status(200).json({ id: hit.code, name: hit.name, price: hit.nav, currency: 'INR', asOf: hit.date });
      }
      return res.status(200).json(await yahooQuote(key));
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    // Upstream sources are free and unofficial; a failure here must not break
    // the form. The UI falls back to letting the user type values by hand.
    return res.status(502).json({ error: err.message || 'Upstream request failed' });
  }
}
