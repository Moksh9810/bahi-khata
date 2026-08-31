import { useState } from 'react';
import { PLANS, normalisePlan, yearlySaving } from '../utils/plans';

// Pricing. Two columns, no dark patterns: the yearly saving is stated in
// rupees as well as a percentage, and the current plan is marked so nobody
// pays twice for what they already have.

export default function PricingPage({ plan, onCheckout }) {
  const [cycle, setCycle] = useState('yearly');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const current = normalisePlan(plan);
  const saving = yearlySaving();
  const proPrice = PLANS.pro.price[cycle];

  const start = async () => {
    setBusy(true);
    setError('');
    try {
      await onCheckout?.(cycle);
    } catch (e) {
      setError(e.message || 'Could not start checkout. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Plans</h2>
        <p className="text-on-surface-variant">
          Tracking is free, always. Pro adds the analysis.
        </p>
      </div>

      {/* Billing cycle */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-lg p-1 bg-surface-container" role="group" aria-label="Billing cycle">
          {['monthly', 'yearly'].map(c => (
            <button
              key={c}
              onClick={() => setCycle(c)}
              aria-pressed={cycle === c}
              className={`px-4 py-2 rounded-md text-sm capitalize transition-colors ${
                cycle === c ? 'bg-surface text-on-surface font-semibold shadow-sm' : 'text-on-surface-variant'
              }`}
            >
              {c}
              {c === 'yearly' && (
                <span className="badge badge-credit ml-2">save {saving.percent}%</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
        {/* ---------------------------------------------------------- FREE */}
        <div className="card p-6 flex flex-col">
          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {PLANS.free.label}
          </h3>
          <p className="text-on-surface-variant text-sm mt-1 mb-4">{PLANS.free.blurb}</p>

          <p className="mb-6">
            <span className="font-display-lg text-display-md text-on-surface">₹0</span>
            <span className="text-on-surface-variant"> forever</span>
          </p>

          <ul className="space-y-3 flex-1">
            {PLANS.free.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-on-surface-variant text-base leading-5">check</span>
                {f}
              </li>
            ))}
          </ul>

          <button
            disabled
            className="btn-secondary w-full mt-6 disabled:opacity-100"
          >
            {current === 'free' ? 'Your current plan' : 'Included in Pro'}
          </button>
        </div>

        {/* ----------------------------------------------------------- PRO */}
        <div className="card p-6 flex flex-col ring-2 ring-primary relative">
          <span className="badge badge-credit absolute -top-3 left-6">Recommended</span>

          <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
            {PLANS.pro.label}
          </h3>
          <p className="text-on-surface-variant text-sm mt-1 mb-4">{PLANS.pro.blurb}</p>

          <p className="mb-1">
            <span className="font-display-lg text-display-md text-on-surface">₹{proPrice}</span>
            <span className="text-on-surface-variant"> / {cycle === 'yearly' ? 'year' : 'month'}</span>
          </p>
          <p className="text-on-surface-variant text-sm mb-6">
            {cycle === 'yearly'
              ? `₹${saving.perMonth} a month — you save ₹${saving.saved} against paying monthly.`
              : `₹${PLANS.pro.price.yearly} a year saves ₹${saving.saved}.`}
          </p>

          <ul className="space-y-3 flex-1">
            {PLANS.pro.features.map(f => (
              <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
                <span className="material-symbols-outlined text-success text-base leading-5">check</span>
                {f}
              </li>
            ))}
          </ul>

          {current === 'pro' ? (
            <button disabled className="btn-secondary w-full mt-6 disabled:opacity-100">
              Your current plan
            </button>
          ) : (
            <button onClick={start} disabled={busy} className="btn-primary w-full mt-6">
              {busy ? 'Opening checkout…' : `Upgrade — ₹${proPrice}`}
            </button>
          )}

          {error && <p className="text-error text-sm mt-3">{error}</p>}
        </div>
      </div>

      <p className="text-on-surface-variant text-xs text-center max-w-lg mx-auto">
        Cancel whenever you like — your holdings stay, and the app keeps working on the
        free plan. Prices include GST.
      </p>
    </div>
  );
}
