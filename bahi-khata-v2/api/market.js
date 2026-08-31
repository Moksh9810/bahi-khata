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

// ------------------------------------------------------------ text matching
// Matching what somebody types against ~12,000 scheme names.
//
// The obvious approach — name.includes(query) — fails on nearly everything a
// real person types. "uti nifty next 50 index fund direct growth" never
// matches "UTI - Nifty Next 50 Index Fund": a hyphen sits where the space is,
// and the plan and option are separate columns, so "direct" and "growth" are
// not in the name at all. It also returned "Franklin India Liquid Fund-
// Institution" for the query "uti", because those three letters happen to sit
// inside "Institution".
//
// Instead: strip punctuation, split into words, and require every word typed
// to begin some word in the scheme.
const normalise = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

/** Levenshtein distance, abandoned as soon as it passes `max`. */
function within(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (row[j] < best) best = row[j];
    }
    if (best > max) return false;
    prev = row;
  }
  return prev[b.length] <= max;
}

// A word matches a typed token when it starts with it. Only if nothing matches
// at all do we retry allowing one wrong letter, so "utl nifty" still finds UTI
// without loosening every other search.
const hits = (words, token, typos) =>
  words.some(w => w.startsWith(token)) ||
  (typos > 0 && token.length >= 3 &&
    words.some(w => within(w.slice(0, token.length + 1), token, 1)));

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

    const plan = p[4].trim();
    const option = p[5].trim();
    // Normalise once here, not on every keystroke: search runs over the whole
    // file, and doing this per request would cost ~24,000 regex passes a time.
    schemes.push({
      code, name, plan, option, nav, date: p[7].trim(),
      nameWords: normalise(name).split(' '),
      allWords: normalise(`${name} ${plan} ${option}`).split(' ')
    });
  }

  if (schemes.length) amfiCache = { at: Date.now(), schemes };
  return schemes;
}

/**
 * Rank schemes against a typed query.
 *
 * Ranking matters as much as matching: AMFI's file lists long-dead segregated
 * side-pockets first, so taking the first ten matches in file order handed
 * back a screen of wound-up portfolios with a NAV of zero.
 */
function mfSearch(schemes, term, limit = 12) {
  const tokens = normalise(term).split(' ').filter(Boolean);
  // One letter matches thousands of schemes and tells the user nothing.
  if (!tokens.length || tokens.join('').length < 2) return [];
  const phrase = tokens.join(' ');

  const collect = typos => {
    const out = [];
    const seen = new Set();

    for (const s of schemes) {
      if (!tokens.every(t => hits(s.allWords, t, typos))) continue;

      // Direct and Regular hold different NAVs, so they are separate choices,
      // not duplicates. Collapsing by name alone hid one of them entirely.
      const key = `${s.name}|${s.plan}|${s.option}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const inName = tokens.every(t => hits(s.nameWords, t, typos));
      // Side-pockets and wound-up schemes: still findable for anyone who holds
      // one, but never ahead of a fund somebody can actually be invested in.
      const dead = /segregated|wound\s*up/i.test(s.name) || !(s.nav > 0);

      let score = 0;
      if (inName) score += 60;
      if (s.nameWords.join(' ').startsWith(phrase)) score += 40;
      if (dead) score -= 500;
      if (/direct/i.test(s.plan)) score += 8;
      if (/growth/i.test(s.option)) score += 4;
      score -= s.name.length / 25; // a shorter name is a closer fit

      out.push({ s, score });
    }
    return out;
  };

  let found = collect(0);
  if (!found.length) found = collect(1); // nothing at all matched — allow a typo

  return found
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ s }) => ({
      id: s.code,
      label: s.name,
      sub: [s.plan, s.option, s.nav > 0 ? `NAV ₹${s.nav}` : 'no NAV published']
        .filter(Boolean)
        .join(' · ')
    }));
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

// -------------------------------------------------------------------- gold
// There is no free feed for the Indian retail gold rate. Gold BeES is an
// NSE-listed ETF holding physical gold in India, so its price already carries
// import duty and the local premium — unlike international spot, which runs
// several per cent below what a buyer here actually pays. One unit is about a
// hundredth of a gram, so x100 gives rupees per gram.
//
// It is a market price, not a jeweller's quote: no making charges, and it can
// sit a per cent or so either side of the rate in a shop.
const GOLD_SYMBOL = 'GOLDBEES.NS';
const UNITS_PER_GRAM = 100;

// Purity as a fraction of pure gold: 22K is 22 parts in 24.
const PURITY = { '24k': 1, '22k': 0.916, '18k': 0.75 };

const purityKey = v => {
  const k = String(v || '').toLowerCase().replace(/[^0-9k]/g, '');
  return k in PURITY ? k : '24k';
};

async function goldQuote(purity) {
  const key = purityKey(purity);
  const base = await yahooQuote(GOLD_SYMBOL);
  return {
    id: key,
    name: `Gold ${key.toUpperCase()} (per gram)`,
    price: Math.round(base.price * UNITS_PER_GRAM * PURITY[key] * 100) / 100,
    currency: 'INR',
    basis: 'Nippon India ETF Gold BeES, NSE'
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

// Exported so the search ranking and the gold maths can be unit-tested without
// standing up the function. Vercel only ever calls the default export.
export const __test = { normalise, within, hits, mfSearch, purityKey, PURITY, UNITS_PER_GRAM };

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
        results = mfSearch(await getAmfiSchemes(), term);
      } else {
        results = await yahooSearch(term);
      }
      return res.status(200).json({ results });
    }

    // Index history for benchmark comparison.
    // /api/market?action=benchmark&index=nifty50&range=5y
    if (action === 'benchmark') {
      const INDEXES = {
        nifty50: { symbol: '^NSEI', label: 'NIFTY 50', currency: 'INR' },
        sensex: { symbol: '^BSESN', label: 'BSE SENSEX', currency: 'INR' },
        niftynext50: { symbol: '^NSMIDCP', label: 'NIFTY Midcap', currency: 'INR' },
        sp500: { symbol: '^GSPC', label: 'S&P 500', currency: 'USD' },
        nasdaq: { symbol: '^IXIC', label: 'NASDAQ Composite', currency: 'USD' }
      };

      const key = String(req.query.index || 'nifty50').toLowerCase();
      const idx = INDEXES[key];
      if (!idx) {
        return res.status(400).json({ error: `Unknown index. Try: ${Object.keys(INDEXES).join(', ')}` });
      }

      const range = ['1y', '2y', '5y', '10y', 'max'].includes(req.query.range) ? req.query.range : '5y';
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(idx.symbol)}?interval=1d&range=${range}`;
      const r = await fetch(url, { headers: { 'User-Agent': UA } });
      if (!r.ok) throw new Error(`Index feed returned ${r.status}`);

      const result = (await r.json())?.chart?.result?.[0];
      const stamps = result?.timestamp || [];
      const closes = result?.indicators?.quote?.[0]?.close || [];

      // Yahoo leaves nulls on non-trading days; drop them rather than carrying
      // a gap into the maths.
      const series = stamps
        .map((t, i) => ({ date: t * 1000, close: closes[i] }))
        .filter(p => typeof p.close === 'number');

      if (!series.length) throw new Error('Index feed returned no usable points');

      return res.status(200).json({
        index: key,
        label: idx.label,
        currency: idx.currency,
        latest: series[series.length - 1].close,
        series
      });
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

      // --- gold: one quote covers every row, scaled by each row's purity
      const goldItems = items.filter(i => i.type === 'gold');
      if (goldItems.length) {
        try {
          const base = await yahooQuote(GOLD_SYMBOL);
          for (const item of goldItems) {
            const key = purityKey(item.id);
            prices[item.key] = Math.round(base.price * UNITS_PER_GRAM * PURITY[key] * 100) / 100;
          }
        } catch {
          // leave gold showing its last known price
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
      // Gold needs no id: purity is optional and defaults to 24K.
      if (type === 'gold') return res.status(200).json(await goldQuote(id));

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
