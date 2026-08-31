import { PLANS, yearlySaving } from '../utils/plans';

// Shown when a free user reaches a Pro feature.
//
// It names the specific thing they were reaching for rather than a generic
// "upgrade" nag, and it does not block the way out — a locked feature the user
// cannot escape is how people leave rather than pay.

export function UpgradeModal({ feature, description, onClose, onSeePlans }) {
  const saving = yearlySaving();

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="card p-8 w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start mb-4">
          <span className="badge badge-pending">Pro</span>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">{feature}</h2>
        <p className="text-on-surface-variant mb-6">{description}</p>

        <ul className="space-y-2 mb-6">
          {PLANS.pro.features.slice(1, 5).map(f => (
            <li key={f} className="flex items-start gap-2 text-sm text-on-surface">
              <span className="material-symbols-outlined text-success text-base leading-5">check</span>
              {f}
            </li>
          ))}
        </ul>

        <p className="text-on-surface-variant text-sm mb-4">
          ₹{PLANS.pro.price.monthly} a month, or ₹{PLANS.pro.price.yearly} a year
          — that works out to ₹{saving.perMonth} a month.
        </p>

        <div className="flex gap-3">
          <button onClick={onSeePlans} className="btn-primary flex-1">See plans</button>
          <button onClick={onClose} className="btn-secondary">Not now</button>
        </div>
      </div>
    </div>
  );
}

/**
 * A blurred stand-in for a Pro-only panel. The user sees the shape of what
 * they are missing without being shown fabricated numbers — the preview
 * underneath must be real content or an obvious placeholder, never invented
 * figures dressed up as theirs.
 */
export function LockedPanel({ title, description, onUnlock, children }) {
  return (
    <div className="relative card overflow-hidden">
      {children && (
        <div className="pointer-events-none select-none blur-sm opacity-40 p-6" aria-hidden="true">
          {children}
        </div>
      )}

      <div className={`${children ? 'absolute inset-0' : ''} flex flex-col items-center justify-center text-center p-8 gap-3`}>
        <span className="material-symbols-outlined text-tertiary text-3xl">lock</span>
        <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">{title}</h3>
        <p className="text-on-surface-variant text-sm max-w-sm">{description}</p>
        <button onClick={onUnlock} className="btn-primary mt-2">Upgrade to Pro</button>
      </div>
    </div>
  );
}

/** Small inline marker for a Pro control sitting among free ones. */
export function ProBadge({ className = '' }) {
  return <span className={`badge badge-pending ${className}`}>Pro</span>;
}
