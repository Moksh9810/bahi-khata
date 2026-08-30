import { useEffect, useRef, useState } from 'react';

// Type-ahead search box for stocks / mutual funds / crypto.
// Talks to /api/market (a Vercel function) because the upstream data sources
// do not allow direct browser calls.
//
// onSelect({ id, name, price, currency }) fires once a suggestion is picked and
// its live price has been fetched.
export default function AssetSearch({ type, value, onSelect, placeholder }) {
  const [term, setTerm] = useState(value || '');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  const boxRef = useRef(null);
  // Guards against a slow earlier request overwriting a newer one.
  const reqId = useRef(0);

  // Close the dropdown when clicking outside.
  useEffect(() => {
    const onDocClick = e => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  // Debounced search: wait for a pause in typing so we don't fire per keystroke.
  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      const mine = ++reqId.current;
      setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`/api/market?action=search&type=${type}&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (mine !== reqId.current) return; // a newer keystroke won
        setResults(data.results || []);
        setOpen(true);
      } catch {
        if (mine === reqId.current) setFailed(true);
      } finally {
        if (mine === reqId.current) setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [term, type]);

  const pick = async item => {
    setTerm(item.label);
    setOpen(false);
    setLoading(true);
    try {
      const res = await fetch(`/api/market?action=quote&type=${type}&id=${encodeURIComponent(item.id)}`);
      const quote = res.ok ? await res.json() : null;
      onSelect({
        id: item.id,
        name: item.label,
        sub: item.sub,
        price: quote && typeof quote.price === 'number' ? quote.price : null,
        currency: (quote && quote.currency) || 'INR'
      });
    } catch {
      // Price lookup failed — still record the name so the user can type the
      // price by hand rather than losing what they picked.
      onSelect({ id: item.id, name: item.label, sub: item.sub, price: null, currency: 'INR' });
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = {
    background: 'rgba(31,31,41,0.4)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)'
  };

  return (
    <div className="relative" ref={boxRef}>
      <input
        type="text"
        value={term}
        onChange={e => setTerm(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full glass-panel rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
        style={fieldStyle}
      />

      {loading && (
        <span className="absolute right-3 top-3.5 text-xs text-on-surface-variant">…</span>
      )}

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 mt-1 w-full max-h-60 overflow-y-auto rounded-lg border border-outline-variant"
          style={{ background: 'rgb(31,31,41)' }}
        >
          {results.map(item => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => pick(item)}
                className="w-full text-left px-4 py-2 hover:bg-primary/10"
              >
                <span className="block text-on-surface text-sm">{item.label}</span>
                {item.sub && (
                  <span className="block text-on-surface-variant text-xs">{item.sub}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {failed && (
        <p className="text-on-surface-variant text-xs mt-1">
          Search unavailable right now — type the name and price by hand.
        </p>
      )}
    </div>
  );
}
