// What each plan includes.
//
// One place decides this. Components ask `can(plan, 'feature')` rather than
// testing plan names themselves, so adding a tier later does not mean hunting
// through the UI for `plan === 'pro'` checks.
//
// Gating here is presentation only. Anything that must genuinely be withheld
// has to be enforced on the server too — a determined user can edit what the
// browser believes.

export const PLANS = {
  free: {
    id: 'free',
    label: 'Free',
    price: { monthly: 0, yearly: 0 },
    blurb: 'Track everything you own, in one place.',
    features: [
      'Unlimited holdings',
      'Live prices for stocks, mutual funds and crypto',
      'Dashboard, allocation and category charts',
      'Bulk import from broker files',
      'One portfolio'
    ]
  },
  pro: {
    id: 'pro',
    label: 'Pro',
    price: { monthly: 99, yearly: 799 },
    blurb: 'The numbers that actually tell you how you are doing.',
    features: [
      'Everything in Free',
      'XIRR and CAGR — the returns your broker quotes',
      'Compare against NIFTY 50, Sensex and S&P 500',
      'Capital gains estimator (STCG / LTCG)',
      'Multiple portfolios — Retirement, Family, and so on',
      'Export to CSV and PDF',
      'Priority support'
    ]
  }
};

// Capability → plans that have it.
const ENTITLEMENTS = {
  xirr: ['pro'],
  benchmark: ['pro'],
  taxEstimator: ['pro'],
  multiPortfolio: ['pro'],
  export: ['pro'],
  prioritySupport: ['pro']
};

export const FREE_PORTFOLIO_LIMIT = 1;

/** Older rows say 'premium'; treat it as 'pro'. */
export function normalisePlan(plan) {
  if (plan === 'premium' || plan === 'pro') return 'pro';
  return 'free';
}

export function can(plan, feature) {
  const allowed = ENTITLEMENTS[feature];
  // An unknown capability is open rather than locked: a typo in a feature name
  // should not silently hide something from paying users.
  if (!allowed) return true;
  return allowed.includes(normalisePlan(plan));
}

/** Yearly price expressed per month, and the saving against paying monthly. */
export function yearlySaving() {
  const { monthly, yearly } = PLANS.pro.price;
  const fullYear = monthly * 12;
  return {
    perMonth: Math.round(yearly / 12),
    saved: fullYear - yearly,
    percent: Math.round(((fullYear - yearly) / fullYear) * 100)
  };
}
