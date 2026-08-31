import { useEffect, useState } from 'react';
import { performanceSummary, benchmarkEquivalent, costOf } from '../utils/finance';
import { formatCurrency } from '../utils/formatters';
import { LockedPanel } from './Paywall';

// Real return figures: XIRR, CAGR, and what the same money would have done in
// an index. Pro only.

const INDEXES = [
  { id: 'nifty50', label: 'NIFTY 50' },
  { id: 'sensex', label: 'Sensex' },
  { id: 'sp500', label: 'S&P 500' }
];

const valueOf = h => {
  const n = v => (typeof v === 'number' ? v : parseFloat(v) || 0);
  switch (h.type) {
    case 'mf': return n(h.units) * (n(h.current_nav) || n(h.buy_nav));
    case 'stocks':
    case 'crypto':
    case 'gold': return n(h.quantity) * (n(h.current_price) || n(h.buy_price));
    case 'properties': return n(h.buy_price);
    default: return n(h.quantity);
  }
};

const pct = v => (v === null || v === undefined ? '—' : `${v >= 0 ? '+' : ''}${v.toFixed(2)}%`);
const tone = v => (v === null || v === undefined ? 'text-on-surface-variant' : v >= 0 ? 'text-success' : 'text-error');

function Figure({ label, value, hint, valueClass = 'text-on-surface' }) {
  return (
    <div className="card p-5">
      <p className="text-on-surface-variant text-sm">{label}</p>
      <p className={`font-data-lg text-data-lg mt-1 ${valueClass}`}>{value}</p>
      {hint && <p className="text-on-surface-variant text-xs mt-1">{hint}</p>}
    </div>
  );
}

export default function Performance({ portfolio, isPro, onUpgrade }) {
  const [indexId, setIndexId] = useState('nifty50');
  const [benchmark, setBenchmark] = useState(null);
  const [loadingIndex, setLoadingIndex] = useState(false);
  const [indexError, setIndexError] = useState('');

  const holdings = Object.values(portfolio || {}).flat().filter(Boolean);
  const summary = performanceSummary(holdings, valueOf);

  useEffect(() => {
    if (!isPro || !summary.flows.length) return undefined;

    let cancelled = false;
    setLoadingIndex(true);
    setIndexError('');

    fetch(`/api/market?action=benchmark&index=${indexId}&range=5y`)
      .then(async r => {
        // A failing endpoint often replies with an HTML error page, and letting
        // JSON.parse choke on it surfaced "Unexpected token '<'" to the user.
        const body = await r.text();
        let data;
        try {
          data = JSON.parse(body);
        } catch {
          throw new Error('Index data is unavailable right now. Please try again shortly.');
        }
        if (!r.ok) throw new Error(data.error || 'Index data is unavailable right now.');
        return data;
      })
      .then(data => {
        if (cancelled) return;
        setBenchmark({ label: data.label, ...benchmarkEquivalent(summary.flows, data.series) });
      })
      .catch(e => !cancelled && setIndexError(e.message))
      .finally(() => !cancelled && setLoadingIndex(false));

    return () => { cancelled = true; };
    // summary.flows is rebuilt each render; its length is the stable signal.
  }, [isPro, indexId, summary.flows.length]);

  if (!isPro) {
    return (
      <LockedPanel
        title="Returns and benchmarks"
        description="See your XIRR — the same figure your broker quotes — and what the identical money would be worth had it gone into the NIFTY 50 instead."
        onUnlock={onUpgrade}
      />
    );
  }

  if (!holdings.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-on-surface-variant">Add a holding first — there is nothing to measure yet.</p>
      </div>
    );
  }

  const noDates = summary.xirr === null;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="font-headline-lg text-headline-lg text-on-surface">Performance</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Figure label="Invested" value={formatCurrency(summary.invested)} />
        <Figure label="Current value" value={formatCurrency(summary.currentValue)} />
        <Figure
          label="Absolute return"
          value={pct(summary.absolute)}
          valueClass={tone(summary.absolute)}
          hint="ignores how long the money was in"
        />
        <Figure
          label="XIRR"
          value={pct(summary.xirr)}
          valueClass={tone(summary.xirr)}
          hint={noDates ? 'needs purchase dates' : 'annualised, date-weighted'}
        />
      </div>

      {noDates && (
        <div className="card p-4 border-l-4 border-tertiary">
          <p className="text-on-surface text-sm">
            None of your holdings carry a purchase date, so XIRR cannot be worked out.
            Absolute return above is real; anything annualised would be a guess.
          </p>
        </div>
      )}

      {summary.undatedCount > 0 && !noDates && (
        <p className="text-on-surface-variant text-sm">
          {summary.undatedCount} holding{summary.undatedCount === 1 ? '' : 's'} left out of the
          XIRR calculation for want of a purchase date.
        </p>
      )}

      {/* ------------------------------------------------------- benchmark */}
      <div className="card p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            Against the market
          </h3>
          <div className="flex gap-1 rounded-lg p-1 bg-surface-container">
            {INDEXES.map(i => (
              <button
                key={i.id}
                onClick={() => setIndexId(i.id)}
                aria-pressed={indexId === i.id}
                className={`px-3 py-1.5 rounded-md text-sm ${
                  indexId === i.id ? 'bg-surface text-on-surface font-semibold shadow-sm' : 'text-on-surface-variant'
                }`}
              >
                {i.label}
              </button>
            ))}
          </div>
        </div>

        {loadingIndex && <p className="text-on-surface-variant text-sm">Fetching index history…</p>}
        {indexError && <p className="text-error text-sm">{indexError}</p>}

        {!loadingIndex && !indexError && benchmark && (
          <>
            <p className="text-on-surface-variant text-sm mb-4">
              Had the same amounts gone into {benchmark.label} on the same dates:
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <Figure label="You have" value={formatCurrency(summary.currentValue)} valueClass={tone(summary.absolute)} />
              <Figure label={`${benchmark.label} would give`} value={formatCurrency(benchmark.wouldBeWorth)} />
              <Figure
                label="Difference"
                value={formatCurrency(summary.currentValue - benchmark.wouldBeWorth)}
                valueClass={tone(summary.currentValue - benchmark.wouldBeWorth)}
                hint={summary.currentValue >= benchmark.wouldBeWorth ? 'ahead of the index' : 'behind the index'}
              />
            </div>
          </>
        )}

        {!loadingIndex && !indexError && !benchmark && (
          <p className="text-on-surface-variant text-sm">
            A comparison needs purchase dates, so the same money can be placed on the same days.
          </p>
        )}
      </div>
    </div>
  );
}
