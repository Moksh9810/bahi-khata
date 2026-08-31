// Capital gains estimation for Indian investors.
//
// Rates below are for AY 2026-27, checked against two independent tax
// references in August 2026. They change with almost every Union Budget —
// LTCG on equity moved from 10% to 12.5% and STCG from 15% to 20% on
// 23 July 2024, and the exemption from ₹1 lakh to ₹1.25 lakh. Whoever picks
// this up next should re-check RATES before a new financial year.
//
// THIS IS AN ESTIMATE, NOT A TAX RETURN. It cannot know the user's slab, their
// other income, surcharge, carried-forward losses, grandfathered pre-2018
// acquisition values, or indexation elections. Every screen using it must say
// so.

export const AY = '2026-27';

export const RATES = {
  // Listed equity and equity mutual funds, STT paid.
  equity: {
    label: 'Listed equity & equity funds',
    longTermAfterMonths: 12,
    shortTermRate: 20,        // section 111A
    longTermRate: 12.5,       // section 112A
    annualExemption: 125000,  // applies to long-term equity gains only
    section: '111A / 112A'
  },
  // Gold, property, unlisted shares: 24-month line, slab rate below it.
  slabBelow24m: {
    label: 'Gold, property, unlisted',
    longTermAfterMonths: 24,
    shortTermRate: null,      // taxed at the investor's slab
    longTermRate: 12.5,
    annualExemption: 0,
    section: '112'
  },
  // Debt funds bought after 31 Mar 2023: slab rate, no long-term concession.
  debt: {
    label: 'Debt funds & bonds',
    longTermAfterMonths: null,
    shortTermRate: null,
    longTermRate: null,
    annualExemption: 0,
    section: '50AA'
  },
  // Virtual digital assets: flat 30%, no set-off of losses against anything.
  crypto: {
    label: 'Crypto (VDA)',
    longTermAfterMonths: null,
    shortTermRate: 30,
    longTermRate: 30,
    annualExemption: 0,
    section: '115BBH'
  }
};

export const CESS_RATE = 4; // health and education cess, on the tax

// Which rate table each holding type falls under.
const BUCKET = {
  stocks: 'equity',
  mf: 'equity',        // assumed equity-oriented; debt funds differ, see note
  crypto: 'crypto',
  gold: 'slabBelow24m',
  properties: 'slabBelow24m',
  bonds: 'debt',
  fds: 'debt',
  loans: 'debt'
};

const MS_PER_DAY = 86400000;

/** Whole months between two dates, the way a holding period is counted. */
export function monthsHeld(from, to = new Date()) {
  const a = new Date(from);
  const b = new Date(to);
  if (Number.isNaN(a.getTime())) return null;
  let months = (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
  if (b.getDate() < a.getDate()) months -= 1;   // not yet a full month
  return months;
}

const num = v => (typeof v === 'number' ? v : parseFloat(v) || 0);

function costAndValue(h) {
  switch (h.type) {
    case 'mf':
      return { cost: num(h.units) * num(h.buy_nav), value: num(h.units) * (num(h.current_nav) || num(h.buy_nav)) };
    case 'stocks':
    case 'crypto':
    case 'gold':
      return { cost: num(h.quantity) * num(h.buy_price), value: num(h.quantity) * (num(h.current_price) || num(h.buy_price)) };
    case 'properties':
      return { cost: num(h.quantity), value: num(h.buy_price) };
    default:
      return { cost: num(h.quantity), value: num(h.quantity) };
  }
}

/**
 * Work out what selling everything today would look like, per holding.
 * Nothing is asserted for a holding with no purchase date — the short/long
 * split is the whole calculation, and guessing it would be worse than
 * admitting the gap.
 */
export function estimateGains(holdings, asOf = new Date()) {
  const rows = [];
  let undated = 0;

  for (const h of holdings || []) {
    const bucketKey = BUCKET[h.type] || 'debt';
    const rate = RATES[bucketKey];
    const { cost, value } = costAndValue(h);
    const gain = value - cost;

    const date = h.purchase_date || null;
    const months = date ? monthsHeld(date, asOf) : null;

    if (months === null) { undated++; }

    const isLong = rate.longTermAfterMonths !== null && months !== null
      ? months >= rate.longTermAfterMonths
      : null;

    rows.push({
      id: h.id,
      name: h.symbol || h.scheme || h.name || '—',
      type: h.type,
      bucket: bucketKey,
      bucketLabel: rate.label,
      section: rate.section,
      cost: Math.round(cost),
      value: Math.round(value),
      gain: Math.round(gain),
      purchaseDate: date,
      monthsHeld: months,
      term: isLong === null ? 'unknown' : isLong ? 'long' : 'short',
      // Crypto is flat-rate whatever the holding period.
      slabTaxed: rate.shortTermRate === null && isLong === false
    });
  }

  return { rows, undated };
}

/**
 * Roll the per-holding gains into a tax estimate.
 * `slabRate` is the user's own income-tax slab, needed for the buckets that
 * are taxed at slab rather than a fixed rate.
 */
export function estimateTax(holdings, { slabRate = 30, asOf = new Date() } = {}) {
  const { rows, undated } = estimateGains(holdings, asOf);

  const groups = {
    equityShort: { label: 'Equity — short term', rate: RATES.equity.shortTermRate, gain: 0, taxable: 0, tax: 0, note: '≤ 12 months, section 111A' },
    equityLong: { label: 'Equity — long term', rate: RATES.equity.longTermRate, gain: 0, taxable: 0, tax: 0, note: `> 12 months, first ₹${RATES.equity.annualExemption.toLocaleString('en-IN')} exempt` },
    crypto: { label: 'Crypto (VDA)', rate: RATES.crypto.shortTermRate, gain: 0, taxable: 0, tax: 0, note: 'flat 30%, losses cannot be set off' },
    otherLong: { label: 'Gold / property — long term', rate: RATES.slabBelow24m.longTermRate, gain: 0, taxable: 0, tax: 0, note: '> 24 months' },
    slab: { label: 'Taxed at your slab', rate: slabRate, gain: 0, taxable: 0, tax: 0, note: 'debt funds, and gold or property held under 24 months' }
  };

  // Crypto is added up separately: section 115BBH allows no set-off at all, so
  // a loss on one coin cannot reduce the gain on another. Netting them first —
  // which is what summing every gain would do — understates the tax.
  let cryptoGains = 0;
  let cryptoLosses = 0;

  for (const r of rows) {
    if (r.term === 'unknown' && r.bucket !== 'crypto' && r.bucket !== 'debt') continue; // cannot classify

    if (r.bucket === 'crypto') {
      if (r.gain > 0) cryptoGains += r.gain; else cryptoLosses += r.gain;
      groups.crypto.gain += r.gain;             // shown to the user as the real net
    }
    else if (r.bucket === 'equity') (r.term === 'long' ? groups.equityLong : groups.equityShort).gain += r.gain;
    else if (r.bucket === 'slabBelow24m') (r.term === 'long' ? groups.otherLong : groups.slab).gain += r.gain;
    else groups.slab.gain += r.gain;
  }

  // Equity long-term gets the annual exemption; a loss is not taxed.
  groups.equityLong.taxable = Math.max(0, groups.equityLong.gain - RATES.equity.annualExemption);
  groups.equityShort.taxable = Math.max(0, groups.equityShort.gain);
  groups.otherLong.taxable = Math.max(0, groups.otherLong.gain);
  groups.slab.taxable = Math.max(0, groups.slab.gain);
  // Only the gains are taxable; the losses beside them are simply lost.
  groups.crypto.taxable = cryptoGains;
  groups.crypto.disallowedLoss = Math.abs(cryptoLosses);

  let tax = 0;
  for (const g of Object.values(groups)) {
    g.tax = Math.round((g.taxable * g.rate) / 100);
    tax += g.tax;
  }

  const cess = Math.round((tax * CESS_RATE) / 100);

  return {
    assessmentYear: AY,
    groups,
    rows,
    undated,
    totalGain: Math.round(rows.reduce((s, r) => s + r.gain, 0)),
    taxBeforeCess: tax,
    cess,
    totalTax: tax + cess,
    exemptionUsed: Math.min(Math.max(0, groups.equityLong.gain), RATES.equity.annualExemption)
  };
}

/**
 * Holdings close to crossing from short to long term.
 * Waiting a few weeks can halve the rate on equity (20% → 12.5%), which is the
 * single most useful thing this screen can point out.
 */
export function nearingLongTerm(holdings, withinDays = 60, asOf = new Date()) {
  const out = [];

  for (const h of holdings || []) {
    const rate = RATES[BUCKET[h.type] || 'debt'];
    if (!rate.longTermAfterMonths || !h.purchase_date) continue;

    const bought = new Date(h.purchase_date);
    const crossover = new Date(bought);
    crossover.setMonth(crossover.getMonth() + rate.longTermAfterMonths);

    const daysAway = Math.ceil((crossover - asOf) / MS_PER_DAY);
    if (daysAway <= 0 || daysAway > withinDays) continue;

    const { cost, value } = costAndValue(h);
    const gain = value - cost;
    if (gain <= 0) continue;   // nothing to save on a loss

    const shortRate = rate.shortTermRate;
    const saving = shortRate === null ? null : Math.round((gain * (shortRate - rate.longTermRate)) / 100);

    out.push({
      name: h.symbol || h.scheme || h.name,
      daysAway,
      crossesOn: crossover.toISOString().slice(0, 10),
      gain: Math.round(gain),
      potentialSaving: saving
    });
  }

  return out.sort((a, b) => a.daysAway - b.daysAway);
}
