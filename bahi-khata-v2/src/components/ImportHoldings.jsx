import { useRef, useState } from 'react';
import { parseHoldingsTable, toHolding, validateRow } from '../utils/importParser';
import { assetTypeLabels } from '../utils/formSchemas';
import { formatCurrency } from '../utils/formatters';

// Bulk import. Nothing reaches the database until the user has seen every row
// in the preview and pressed Import — bringing money in silently is a good way
// to end up with a portfolio nobody trusts.

// Types we can look up online; the rest import fine but keep manual prices.
const LOOKUP = { stocks: 'stock', mf: 'mf', crypto: 'crypto' };

export default function ImportHoldings({ type, onImport, onClose }) {
  const [text, setText] = useState('');
  const [rows, setRows] = useState(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);

  const label = assetTypeLabels[type] || type;
  const isMF = type === 'mf';

  const readTable = raw => {
    setError('');
    const result = parseHoldingsTable(raw);
    if (result.error) {
      setRows(null);
      setError(result.error);
      return;
    }
    if (!result.rows.length) {
      setRows(null);
      setError('Found the headings but no usable rows underneath.');
      return;
    }
    setRows(result.rows.map((r, i) => ({ ...r, _id: i })));
    setNote(
      `${result.rows.length} row${result.rows.length === 1 ? '' : 's'} read` +
      (result.skipped ? ` · ${result.skipped} line${result.skipped === 1 ? '' : 's'} skipped (totals or blanks)` : '')
    );
  };

  const onFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      setError('Excel files can\'t be read directly. In Excel use File → Save As → CSV, or just select the rows and paste them below.');
      return;
    }
    readTable(await file.text());
  };

  const edit = (id, field, value) => {
    setRows(rs => rs.map(r => (r._id === id
      ? { ...r, [field]: field === 'name' ? value : (value === '' ? null : parseFloat(value)) }
      : r)));
  };

  const drop = id => setRows(rs => rs.filter(r => r._id !== id));

  // Ask the server for the provider's id and today's price for each row, so
  // imported holdings refresh like the ones added through search.
  const fetchPrices = async () => {
    const source = LOOKUP[type];
    if (!source || !rows) return;

    setBusy('Looking up prices…');
    setError('');
    try {
      const resolved = [];
      // Sequential on purpose: a burst of parallel lookups gets rate-limited.
      for (const row of rows) {
        try {
          const res = await fetch(`/api/market?action=search&type=${source}&q=${encodeURIComponent(row.name)}`);
          const hit = res.ok ? (await res.json()).results?.[0] : null;
          resolved.push(hit ? { ...row, quoteId: hit.id, matchedAs: hit.label } : { ...row });
        } catch {
          resolved.push({ ...row });
        }
      }

      const items = resolved.filter(r => r.quoteId).map(r => `${source}:${r.quoteId}`);
      let prices = {};
      if (items.length) {
        const res = await fetch(`/api/market?action=quotes&items=${encodeURIComponent(items.join('|'))}`);
        if (res.ok) ({ prices } = await res.json());
      }

      setRows(resolved.map(r => {
        const p = r.quoteId ? prices[`${source}:${r.quoteId}`] : undefined;
        return typeof p === 'number' ? { ...r, currentPrice: p } : r;
      }));

      const matched = resolved.filter(r => r.quoteId).length;
      setNote(`${matched} of ${resolved.length} matched to live prices`);
    } finally {
      setBusy('');
    }
  };

  const problems = (rows || []).map(r => ({ id: r._id, list: validateRow(r, type) }));
  const badCount = problems.filter(p => p.list.length).length;

  const save = async () => {
    if (badCount) {
      setError('Fix or remove the rows marked in red first.');
      return;
    }
    setBusy('Saving…');
    setError('');
    try {
      await onImport(rows.map(r => toHolding(r, type)));
      onClose();
    } catch (e) {
      setError(e.message || 'Import failed.');
    } finally {
      setBusy('');
    }
  };

  const total = (rows || []).reduce((sum, r) => sum + (r.quantity || 0) * (r.currentPrice || r.buyPrice || 0), 0);

  return (
    <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-start justify-center p-4 overflow-y-auto backdrop-blur-sm">
      <div className="rounded-2xl p-6 md:p-8 w-full max-w-3xl my-8">
        <div className="flex justify-between items-start mb-2">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Import {label}s</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {!rows && (
          <>
            <p className="text-on-surface-variant text-sm mb-6">
              Download your holdings from Zerodha, Groww, Upstox, Angel One or your fund house
              and drop the file here. Column names don’t need changing — headings like
              “Quantity Available” or “Avg. Buy Price” are understood.
            </p>

            <button
              onClick={() => fileRef.current?.click()}
              className="w-full py-4 rounded-lg border border-dashed border-outline text-on-surface-variant hover:text-on-surface hover:border-primary mb-4"
            >
              Choose a CSV file
            </button>
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={onFile} className="hidden" />

            <p className="text-on-surface-variant text-sm mb-2">…or paste straight from Excel:</p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder={isMF
                ? 'Scheme Name\tUnits\tAverage NAV\nAxis ELSS Tax Saver Fund\t2.33\t2145'
                : 'Symbol\tQuantity\tAverage Price\nHDFCBANK\t10\t769.55'}
              className="w-full rounded-lg px-4 py-3 text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={() => readTable(text)}
              disabled={!text.trim()}
              className="mt-4 px-6 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50"
            >
              Read this
            </button>
          </>
        )}

        {error && <div className="text-error text-sm p-3 rounded-lg bg-error/10 mt-4">{error}</div>}

        {rows && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3 my-4">
              <p className="text-on-surface-variant text-sm">{busy || note}</p>
              <div className="flex gap-2">
                {LOOKUP[type] && (
                  <button
                    onClick={fetchPrices}
                    disabled={!!busy}
                    className="px-4 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 disabled:opacity-50"
                  >
                    Fetch live prices
                  </button>
                )}
                <button
                  onClick={() => { setRows(null); setNote(''); setError(''); }}
                  className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container"
                >
                  Start over
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="text-on-surface-variant">
                  <tr className="border-b border-outline-variant">
                    <th className="text-left p-3">{isMF ? 'Scheme' : 'Name'}</th>
                    <th className="text-right p-3">{isMF ? 'Units' : 'Qty'}</th>
                    <th className="text-right p-3">{isMF ? 'Buy NAV' : 'Buy price'}</th>
                    <th className="text-right p-3">{isMF ? 'Current NAV' : 'Current'}</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const bad = problems.find(p => p.id === r._id)?.list || [];
                    return (
                      <tr key={r._id} className={`border-b border-outline-variant ${bad.length ? 'bg-error/5' : ''}`}>
                        <td className="p-2">
                          <input
                            value={r.name}
                            onChange={e => edit(r._id, 'name', e.target.value)}
                            className="w-full bg-transparent text-on-surface px-2 py-1 rounded focus:outline-none focus:bg-surface-container"
                          />
                          {r.matchedAs && r.matchedAs !== r.name && (
                            <span className="block text-on-surface-variant text-xs px-2">matched: {r.matchedAs}</span>
                          )}
                          {bad.length > 0 && (
                            <span className="block text-error text-xs px-2">{bad.join(', ')}</span>
                          )}
                        </td>
                        {['quantity', 'buyPrice', 'currentPrice'].map(f => (
                          <td className="p-2" key={f}>
                            <input
                              type="number"
                              step="any"
                              value={r[f] ?? ''}
                              onChange={e => edit(r._id, f, e.target.value)}
                              className="w-24 bg-transparent text-on-surface text-right px-2 py-1 rounded focus:outline-none focus:bg-surface-container"
                            />
                          </td>
                        ))}
                        <td className="p-2 text-right">
                          <button
                            onClick={() => drop(r._id)}
                            className="text-on-surface-variant hover:text-error"
                            title="Remove this row"
                          >
                            <span className="material-symbols-outlined text-base">close</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 mt-6">
              <p className="text-on-surface-variant text-sm">
                {rows.length} holding{rows.length === 1 ? '' : 's'} · {formatCurrency(Math.round(total))}
                {badCount > 0 && <span className="text-error"> · {badCount} need fixing</span>}
              </p>
              <button
                onClick={save}
                disabled={!!busy || !rows.length}
                className="px-6 py-3 rounded-lg bg-primary text-on-primary font-bold disabled:opacity-50"
              >
                {busy === 'Saving…' ? 'Saving…' : `Import ${rows.length}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
