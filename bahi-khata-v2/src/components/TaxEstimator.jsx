import { useMemo, useState } from 'react';
import { estimateTax, nearingLongTerm, AY, RATES } from '../utils/tax';
import { formatCurrency } from '../utils/formatters';
import { LockedPanel } from './Paywall';

// Capital gains estimator.
//
// It answers one question: if everything were sold today, roughly what tax
// would fall due? Every screen here says "estimate" because it genuinely is —
// the app does not know the user's other income, carried-forward losses,
// grandfathered 2018 values, or surcharge.

const SLABS = [5, 10, 15, 20, 30];

export default function TaxEstimator({ portfolio, isPro, onUpgrade }) {
  const [slab, setSlab] = useState(30);

  const holdings = useMemo(
    () => Object.values(portfolio || {}).flat().filter(Boolean),
    [portfolio]
  );

  const result = useMemo(() => estimateTax(holdings, { slabRate: slab }), [holdings, slab]);
  const soon = useMemo(() => nearingLongTerm(holdings, 60), [holdings]);

  if (!isPro) {
    return (
      <LockedPanel
        title="Capital gains estimator"
        description="See what selling today would cost in tax — short and long term split out, with the holdings that are weeks away from the lower rate."
        onUnlock={onUpgrade}
      />
    );
  }

  if (!holdings.length) {
    return (
      <div className="card p-8 text-center">
        <p className="text-on-surface-variant">Nothing to estimate yet — add a holding first.</p>
      </div>
    );
  }

  const groups = Object.entries(result.groups).filter(([, g]) => g.gain !== 0);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Capital gains</h2>
          <p className="text-on-surface-variant text-sm mt-1">
            If you sold everything today · AY {AY}
          </p>
        </div>

        <label className="text-sm">
          <span className="block text-on-surface-variant mb-1">Your income tax slab</span>
          <select
            value={slab}
            onChange={e => setSlab(Number(e.target.value))}
            className="input-field w-auto"
          >
            {SLABS.map(s => <option key={s} value={s}>{s}%</option>)}
          </select>
        </label>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="card p-5">
          <p className="text-on-surface-variant text-sm">Total gain</p>
          <p className={`font-data-lg text-data-lg mt-1 ${result.totalGain >= 0 ? 'text-success' : 'text-error'}`}>
            {formatCurrency(result.totalGain)}
          </p>
        </div>
        <div className="card p-5">
          <p className="text-on-surface-variant text-sm">Estimated tax</p>
          <p className="font-data-lg text-data-lg text-on-surface mt-1">{formatCurrency(result.totalTax)}</p>
          <p className="text-on-surface-variant text-xs mt-1">includes 4% cess</p>
        </div>
        <div className="card p-5">
          <p className="text-on-surface-variant text-sm">Exemption used</p>
          <p className="font-data-lg text-data-lg text-on-surface mt-1">{formatCurrency(result.exemptionUsed)}</p>
          <p className="text-on-surface-variant text-xs mt-1">
            of ₹{RATES.equity.annualExemption.toLocaleString('en-IN')} on equity
          </p>
        </div>
      </div>

      {/* Breakdown */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[640px]">
          <thead className="table-header">
            <tr>
              <th className="text-left p-4">Bucket</th>
              <th className="text-right p-4">Gain</th>
              <th className="text-right p-4">Taxable</th>
              <th className="text-right p-4">Rate</th>
              <th className="text-right p-4">Tax</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(([key, g]) => (
              <tr key={key} className="table-row">
                <td className="p-4">
                  <span className="text-on-surface">{g.label}</span>
                  <span className="block text-on-surface-variant text-xs">{g.note}</span>
                </td>
                <td className={`p-4 text-right font-data-lg ${g.gain >= 0 ? 'text-success' : 'text-error'}`}>
                  {formatCurrency(g.gain)}
                </td>
                <td className="p-4 text-right text-on-surface">{formatCurrency(g.taxable)}</td>
                <td className="p-4 text-right text-on-surface-variant">{g.rate}%</td>
                <td className="p-4 text-right font-data-lg text-on-surface">{formatCurrency(g.tax)}</td>
              </tr>
            ))}
            <tr className="table-row">
              <td className="p-4 text-on-surface-variant" colSpan="4">Health &amp; education cess (4%)</td>
              <td className="p-4 text-right font-data-lg text-on-surface">{formatCurrency(result.cess)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {result.groups.crypto.disallowedLoss > 0 && (
        <div className="card p-4 border-l-4 border-tertiary">
          <p className="text-on-surface text-sm">
            {formatCurrency(result.groups.crypto.disallowedLoss)} of crypto losses cannot be
            set off against anything — not even your other crypto gains. That is section 115BBH,
            not an error in the sums.
          </p>
        </div>
      )}

      {/* Holdings about to turn long-term */}
      {soon.length > 0 && (
        <div className="card p-6">
          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-1">
            Nearly long term
          </h3>
          <p className="text-on-surface-variant text-sm mb-4">
            Holding these a little longer moves them to the lower rate.
          </p>
          <div className="space-y-3">
            {soon.map(s => (
              <div key={s.name} className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-outline-variant last:border-0">
                <div>
                  <p className="text-on-surface">{s.name}</p>
                  <p className="text-on-surface-variant text-xs">
                    crosses on {new Date(s.crossesOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <span className="badge badge-pending">{s.daysAway} days</span>
                  {s.potentialSaving > 0 && (
                    <p className="text-success text-xs mt-1">saves about {formatCurrency(s.potentialSaving)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.undated > 0 && (
        <div className="card p-4 border-l-4 border-error">
          <p className="text-on-surface text-sm">
            {result.undated} holding{result.undated === 1 ? '' : 's'} could not be included:
            without a purchase date there is no way to tell short term from long, and the two
            are taxed very differently. Add the date on the holding to bring it in.
          </p>
        </div>
      )}

      {/* The honest caveat */}
      <div className="card p-5">
        <p className="text-on-surface-variant text-sm">
          <strong className="text-on-surface">This is an estimate, not tax advice.</strong> It assumes
          equity funds are equity-oriented, ignores your other income, surcharge, carried-forward
          losses, and the grandfathered value of anything bought before 31 January 2018. Rates
          shown are for AY {AY} and change with the Budget. Please check with a chartered
          accountant before acting on it.
        </p>
      </div>
    </div>
  );
}
