import { useState } from 'react';
import { downloadCsv, printStatement } from '../utils/exporters';
import { ProBadge } from './Paywall';

// The strip above the dashboard: which portfolio you are looking at, and the
// export buttons. Both are Pro features, so a free user sees them but is told
// what they are rather than finding them missing.

export default function PortfolioBar({
  portfolios, activeId, active, isPro,
  onSelect, onCreate, onRename, onRemove,
  holdings, userEmail, onUpgrade
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const act = async fn => {
    setBusy(true);
    setError('');
    try {
      await fn();
      setAdding(false);
      setRenaming(false);
      setName('');
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const exportCsv = () => {
    if (!isPro) return onUpgrade('Export your holdings', 'Download everything as CSV, or save a clean PDF statement.');
    try { downloadCsv(holdings, active?.name || 'Portfolio'); }
    catch (e) { setError(e.message); }
  };

  const exportPdf = () => {
    if (!isPro) return onUpgrade('Export your holdings', 'Download everything as CSV, or save a clean PDF statement.');
    try { printStatement(holdings, { portfolioName: active?.name || 'Portfolio', ownerEmail: userEmail }); }
    catch (e) { setError(e.message); }
  };

  const addPortfolio = () => {
    if (!isPro && portfolios.length >= 1) {
      return onUpgrade('More than one portfolio', 'Keep Retirement, Family and anything else apart, each with its own returns.');
    }
    setAdding(true);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Portfolio picker */}
        <div className="flex items-center gap-2 flex-wrap">
          {portfolios.length > 1 ? (
            <select
              value={activeId || ''}
              onChange={e => onSelect(e.target.value)}
              className="input-field w-auto font-semibold"
              aria-label="Portfolio"
            >
              {portfolios.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          ) : (
            <span className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
              {active?.name || 'My Portfolio'}
            </span>
          )}

          <button
            onClick={addPortfolio}
            className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container"
            title="New portfolio"
          >
            <span className="material-symbols-outlined">add</span>
          </button>

          {active && (
            <button
              onClick={() => { setName(active.name); setRenaming(true); }}
              className="text-on-surface-variant hover:text-primary p-2 rounded-full hover:bg-surface-container"
              title="Rename"
            >
              <span className="material-symbols-outlined">edit</span>
            </button>
          )}

          {portfolios.length > 1 && active && (
            <button
              onClick={() => {
                // Deleting a portfolio takes its holdings with it, so the count
                // is spelled out rather than left to a vague "are you sure".
                const n = holdings.length;
                const ok = window.confirm(
                  `Delete "${active.name}"? Its ${n} holding${n === 1 ? '' : 's'} will be removed too. This cannot be undone.`
                );
                if (ok) act(() => onRemove(active.id));
              }}
              className="text-on-surface-variant hover:text-error p-2 rounded-full hover:bg-surface-container"
              title="Delete portfolio"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          )}

          {!isPro && <ProBadge className="ml-1" />}
        </div>

        {/* Export */}
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="btn-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-base">download</span>
            CSV
            {!isPro && <ProBadge />}
          </button>
          <button onClick={exportPdf} className="btn-secondary flex items-center gap-2">
            <span className="material-symbols-outlined text-base">print</span>
            PDF
            {!isPro && <ProBadge />}
          </button>
        </div>
      </div>

      {(adding || renaming) && (
        <div className="card p-4 flex items-center gap-3 flex-wrap">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={adding ? 'Retirement, Family, High risk…' : 'New name'}
            className="input-field w-auto flex-1 min-w-[200px]"
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter' && name.trim()) {
                act(() => (adding ? onCreate(name) : onRename(active.id, name)));
              }
              if (e.key === 'Escape') { setAdding(false); setRenaming(false); }
            }}
          />
          <button
            onClick={() => act(() => (adding ? onCreate(name) : onRename(active.id, name)))}
            disabled={busy || !name.trim()}
            className="btn-primary"
          >
            {busy ? 'Saving…' : adding ? 'Create' : 'Rename'}
          </button>
          <button onClick={() => { setAdding(false); setRenaming(false); }} className="btn-secondary">
            Cancel
          </button>
        </div>
      )}

      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
