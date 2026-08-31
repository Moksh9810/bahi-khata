// Return calculations.
//
// Three different numbers get loosely called "return", and they answer
// different questions:
//
//   Absolute  — how much did it grow, ignoring time. Useless for comparing a
//               3-month holding against a 5-year one.
//   CAGR      — the steady annual rate that turns the opening amount into the
//               closing one. Correct only for a SINGLE lump sum.
//   XIRR      — the annual rate that makes a series of dated cashflows balance.
//               This is the one to use for SIPs, top-ups and partial exits;
//               it is what every broker statement quotes.
//
// Using CAGR on a SIP overstates returns badly, because money added in the
// final month is credited with the whole period's growth. Where dates exist,
// prefer XIRR.

const MS_PER_DAY = 86400000;
const DAYS_PER_YEAR = 365;

const toDate = d => (d instanceof Date ? d : new Date(d));
const yearsBetween = (a, b) => (toDate(b) - toDate(a)) / (MS_PER_DAY * DAYS_PER_YEAR);

/** Growth ignoring time. Returns a percentage. */
export function absoluteReturn(invested, currentValue) {
  if (!invested || invested <= 0) return null;
  return ((currentValue - invested) / invested) * 100;
}

/**
 * Compound annual growth rate for one lump sum, as a percentage.
 * Undefined for a negative start or a wiped-out holding, and meaningless over
 * very short periods — a 3% gain in nine days annualises to a nonsense figure,
 * so anything under a month returns null.
 */
export function cagr(invested, currentValue, startDate, endDate = new Date()) {
  if (!invested || invested <= 0 || currentValue <= 0) return null;
  const years = yearsBetween(startDate, endDate);
  if (!Number.isFinite(years) || years < 1 / 12) return null;
  return (Math.pow(currentValue / invested, 1 / years) - 1) * 100;
}

/** Net present value of dated cashflows at annual rate `rate` (as a fraction). */
function npv(rate, flows, t0) {
  let total = 0;
  for (const f of flows) {
    const years = (toDate(f.date) - t0) / (MS_PER_DAY * DAYS_PER_YEAR);
    // (1 + rate) can go non-positive during the search; guard the power.
    const base = 1 + rate;
    if (base <= 0) return NaN;
    total += f.amount / Math.pow(base, years);
  }
  return total;
}

/**
 * XIRR — annualised return of irregular, dated cashflows, as a percentage.
 *
 * Sign convention: money leaving the investor is negative (a purchase or SIP
 * instalment), money coming back is positive (a sale, a dividend, and the
 * current value as a final inflow dated today).
 *
 * Newton-Raphson converges in a few steps for well-behaved series but can run
 * off for volatile ones, so a bracketed bisection backs it up. Returns null
 * when no rate exists — for instance if every flow points the same way.
 *
 * @param {{date: Date|string, amount: number}[]} flows
 * @returns {number|null} percentage, e.g. 14.3
 */
export function xirr(flows, { guess = 0.1, tolerance = 1e-7, maxIterations = 100 } = {}) {
  if (!Array.isArray(flows) || flows.length < 2) return null;

  const clean = flows
    .filter(f => f && Number.isFinite(f.amount) && !Number.isNaN(toDate(f.date).getTime()))
    .sort((a, b) => toDate(a.date) - toDate(b.date));

  if (clean.length < 2) return null;

  // A solution needs money going both ways.
  const hasOutflow = clean.some(f => f.amount < 0);
  const hasInflow = clean.some(f => f.amount > 0);
  if (!hasOutflow || !hasInflow) return null;

  const t0 = toDate(clean[0].date);

  // --- Newton-Raphson
  let rate = guess;
  for (let i = 0; i < maxIterations; i++) {
    const value = npv(rate, clean, t0);
    if (!Number.isFinite(value)) break;
    if (Math.abs(value) < tolerance) return rate * 100;

    // Numerical derivative: cheaper to trust than an analytic one here, and
    // accurate enough since we only need a search direction.
    const step = 1e-6;
    const slope = (npv(rate + step, clean, t0) - value) / step;
    if (!Number.isFinite(slope) || slope === 0) break;

    const next = rate - value / slope;
    if (!Number.isFinite(next)) break;
    if (Math.abs(next - rate) < tolerance) return next * 100;
    rate = next;
  }

  // --- Bisection fallback over a wide but finite band (-99.99% to +1000%)
  let low = -0.9999;
  let high = 10;
  let fLow = npv(low, clean, t0);
  let fHigh = npv(high, clean, t0);
  if (!Number.isFinite(fLow) || !Number.isFinite(fHigh) || fLow * fHigh > 0) return null;

  for (let i = 0; i < 200; i++) {
    const mid = (low + high) / 2;
    const fMid = npv(mid, clean, t0);
    if (!Number.isFinite(fMid)) return null;
    if (Math.abs(fMid) < tolerance || (high - low) / 2 < tolerance) return mid * 100;
    if (fLow * fMid < 0) { high = mid; fHigh = fMid; } else { low = mid; fLow = fMid; }
  }
  return null;
}

/**
 * Build the cashflow series for a set of holdings.
 * Each purchase is an outflow on its date; today's total value is one inflow.
 * Holdings with no usable date are skipped and reported, rather than being
 * quietly dated today — that would flatter the result.
 */
export function holdingsToCashflows(holdings, valueOf, asOf = new Date()) {
  const flows = [];
  let skipped = 0;
  let currentTotal = 0;

  for (const h of holdings || []) {
    const value = valueOf(h);
    currentTotal += value;

    const date = h.purchase_date || h.created_at;
    const cost = costOf(h);
    if (!date || !cost) { skipped++; continue; }

    flows.push({ date, amount: -cost });
  }

  if (flows.length && currentTotal > 0) flows.push({ date: asOf, amount: currentTotal });
  return { flows, skipped, currentTotal };
}

/** What was actually paid for a holding. */
export function costOf(h) {
  const n = v => (typeof v === 'number' ? v : parseFloat(v) || 0);
  switch (h.type) {
    case 'mf':
      return n(h.units) * n(h.buy_nav);
    case 'stocks':
    case 'crypto':
    case 'gold':
      return n(h.quantity) * n(h.buy_price);
    case 'properties':
    case 'bonds':
    case 'loans':
    case 'fds':
      return n(h.quantity);
    default:
      return 0;
  }
}

/**
 * Compare a portfolio against an index over the same window.
 *
 * The honest comparison is not "my portfolio grew 18%, the index grew 12%".
 * It is: had the same money gone into the index on the same dates, what would
 * it be worth now? That is what this computes, so a portfolio built through a
 * rising market is not credited with the market's own climb.
 *
 * @param {{date, amount}[]} flows  negative outflows, as for xirr()
 * @param {{date: number|string, close: number}[]} series index history, ascending
 */
export function benchmarkEquivalent(flows, series) {
  if (!flows?.length || !series?.length) return null;

  const points = series
    .filter(p => Number.isFinite(p.close))
    .map(p => ({ t: toDate(p.date).getTime(), close: p.close }))
    .sort((a, b) => a.t - b.t);
  if (!points.length) return null;

  // Index level on (or immediately before) a given date.
  const levelOn = when => {
    const t = toDate(when).getTime();
    let chosen = null;
    for (const p of points) {
      if (p.t <= t) chosen = p; else break;
    }
    return (chosen || points[0]).close;
  };

  const latest = points[points.length - 1].close;
  let units = 0;
  let invested = 0;

  for (const f of flows) {
    if (f.amount >= 0) continue;           // only purchases are mirrored
    const spent = -f.amount;
    const level = levelOn(f.date);
    if (!level) continue;
    units += spent / level;
    invested += spent;
  }

  if (!invested) return null;
  const wouldBeWorth = units * latest;

  return {
    invested: Math.round(invested),
    wouldBeWorth: Math.round(wouldBeWorth),
    returnPct: ((wouldBeWorth - invested) / invested) * 100,
    xirr: xirr([...flows.filter(f => f.amount < 0), { date: new Date(), amount: wouldBeWorth }])
  };
}

/**
 * Everything the UI needs about a set of holdings in one call.
 * `xirr` is null when the holdings carry no dates — the caller should say so
 * rather than showing a zero.
 */
export function performanceSummary(holdings, valueOf, asOf = new Date()) {
  const invested = (holdings || []).reduce((sum, h) => sum + costOf(h), 0);
  const currentValue = (holdings || []).reduce((sum, h) => sum + valueOf(h), 0);
  const { flows, skipped } = holdingsToCashflows(holdings, valueOf, asOf);

  // A single dated purchase is the one case where CAGR is exactly right.
  const dated = (holdings || [])
    .map(h => h.purchase_date || h.created_at)
    .filter(Boolean)
    .map(d => toDate(d))
    .sort((a, b) => a - b);

  return {
    invested: Math.round(invested),
    currentValue: Math.round(currentValue),
    absolute: absoluteReturn(invested, currentValue),
    xirr: xirr(flows),
    cagr: dated.length ? cagr(invested, currentValue, dated[0], asOf) : null,
    since: dated[0] || null,
    undatedCount: skipped,
    flows
  };
}
