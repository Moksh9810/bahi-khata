import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatters';
import { normalisePlan } from '../utils/plans';

const isPro = plan => normalisePlan(plan) === 'pro';

// Admin console. Every figure and every change goes through /api/admin, which
// runs on the server — the browser never holds a key that can read other
// people's data.

const STATUS_STYLE = {
  active: 'bg-success/10 text-success',
  suspended: 'bg-tertiary/10 text-tertiary',
  blocked: 'bg-error/10 text-error'
};

async function callAdmin(action, body) {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Session expired — please log in again.');

  const res = await fetch(body ? '/api/admin' : `/api/admin?action=${action}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {})
    },
    body: body ? JSON.stringify({ action, ...body }) : undefined
  });

  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

function Stat({ label, value, hint }) {
  return (
    <div className="card p-5">
      <p className="text-on-surface-variant text-sm">{label}</p>
      <p className="font-data-lg text-data-lg text-on-surface mt-1">{value}</p>
      {hint && <p className="text-on-surface-variant text-xs mt-1">{hint}</p>}
    </div>
  );
}

function RazorpaySettings({ status, canEdit, onSaved, onError }) {
  const [keyId, setKeyId] = useState('');
  const [keySecret, setKeySecret] = useState('');
  const [mode, setMode] = useState('test');
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState('');

  const save = async (clear = false) => {
    setBusy(true);
    setSaved('');
    onError('');
    try {
      await callAdmin('set_razorpay', clear
        ? { keyId: '', keySecret: '' }
        : { keyId: keyId.trim(), keySecret: keySecret.trim(), mode });
      // Never keep the secret in browser memory a moment longer than needed.
      setKeyId('');
      setKeySecret('');
      setSaved(clear ? 'Payments switched off.' : 'Saved. Checkout is live from now on.');
      await onSaved();
    } catch (e) {
      onError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">Razorpay</h3>
            <p className="text-on-surface-variant text-sm mt-1">
              Paste the keys from your Razorpay dashboard. Checkout starts working the moment
              you save — nothing needs redeploying.
            </p>
          </div>
          <span className={`badge ${status?.configured ? 'badge-credit' : 'badge-pending'}`}>
            {status?.configured ? `live · ${status.mode}` : 'not set up'}
          </span>
        </div>

        {status?.configured && (
          <p className="text-on-surface-variant text-sm mb-4">
            Currently using a key ending <span className="font-data-lg">…{status.keyIdLast4}</span> in{' '}
            <strong className="text-on-surface">{status.mode}</strong> mode.
            The secret cannot be shown again — save a new pair to replace it.
          </p>
        )}

        {!canEdit ? (
          <p className="text-on-surface-variant text-sm">
            Only a super admin can change payment settings.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <label className="text-sm">
              <span className="block text-on-surface-variant mb-1">Mode</span>
              <select value={mode} onChange={e => setMode(e.target.value)} className="input-field">
                <option value="test">Test — no real money</option>
                <option value="live">Live — real payments</option>
              </select>
            </label>

            <label className="text-sm">
              <span className="block text-on-surface-variant mb-1">Key ID</span>
              <input
                value={keyId}
                onChange={e => setKeyId(e.target.value)}
                placeholder="rzp_test_xxxxxxxxxxxx"
                autoComplete="off"
                className="input-field font-mono"
              />
            </label>

            <label className="text-sm">
              <span className="block text-on-surface-variant mb-1">Key Secret</span>
              <input
                type="password"
                value={keySecret}
                onChange={e => setKeySecret(e.target.value)}
                placeholder="never shown again once saved"
                autoComplete="new-password"
                className="input-field font-mono"
              />
            </label>

            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => save(false)}
                disabled={busy || !keyId.trim() || !keySecret.trim()}
                className="btn-primary"
              >
                {busy ? 'Saving…' : 'Save and switch on'}
              </button>
              {status?.configured && (
                <button onClick={() => save(true)} disabled={busy} className="btn-secondary">
                  Switch payments off
                </button>
              )}
            </div>

            {saved && <p className="text-success text-sm">{saved}</p>}
          </div>
        )}
      </div>

      <div className="card p-5">
        <p className="text-on-surface-variant text-sm">
          <strong className="text-on-surface">Where these are kept.</strong> The secret goes into a
          database table that no browser can read — not yours either. It is used only on the
          server, to check that a payment really happened. It is never sent back to any page,
          and never written to the audit log.
        </p>
      </div>
    </div>
  );
}

export default function AdminPanel({ myRole }) {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [audit, setAudit] = useState([]);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(null);

  const canChangePlan = ['manager', 'super_admin'].includes(myRole);
  const canChangeRole = myRole === 'super_admin';

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [u, m] = await Promise.all([callAdmin('users'), callAdmin('metrics')]);
      setUsers(u.users || []);
      setMetrics(m);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (tab !== 'audit') return;
    callAdmin('audit').then(r => setAudit(r.entries || [])).catch(e => setError(e.message));
  }, [tab]);

  useEffect(() => {
    if (tab !== 'settings') return;
    callAdmin('settings').then(setSettings).catch(e => setError(e.message));
  }, [tab]);

  const change = async (userId, action, value) => {
    setBusyId(userId + action);
    setError('');
    try {
      await callAdmin(action, { userId, value });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  };

  const shown = users.filter(u =>
    !search || (u.email || '').toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = d => (d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }) : '—');

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="font-headline-lg text-headline-lg text-on-surface">Admin</h2>
        <div className="flex gap-2">
          {['users', 'metrics', 'audit', 'settings'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize ${
                tab === t ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container'
              }`}
            >
              {t}
            </button>
          ))}
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-surface-container">
            Reload
          </button>
        </div>
      </div>

      {error && (
        <div className="text-error text-sm p-3 rounded-lg bg-error/10">{error}</div>
      )}

      {loading && <p className="text-on-surface-variant">Loading…</p>}

      {/* ------------------------------------------------------------ USERS */}
      {!loading && tab === 'users' && (
        <>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by email"
            className="w-full md:max-w-sm card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
          />

          <div className="overflow-x-auto rounded-xl">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="table-header">
                <tr>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Last login</th>
                  <th className="text-right p-4">Portfolio</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Plan</th>
                  <th className="text-left p-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {shown.map(u => (
                  <tr key={u.id} className="border-b border-outline-variant">
                    <td className="p-4 text-on-surface">
                      {u.email || u.id.slice(0, 8)}
                      <span className="block text-on-surface-variant text-xs">
                        {u.holdingsCount} holding{u.holdingsCount === 1 ? '' : 's'}
                      </span>
                    </td>
                    <td className="p-4 text-on-surface-variant">{fmtDate(u.created_at)}</td>
                    <td className="p-4 text-on-surface-variant">{fmtDate(u.lastSignInAt)}</td>
                    <td className="p-4 text-right font-data-lg text-on-surface">
                      {formatCurrency(u.portfolioValue)}
                    </td>

                    <td className="p-4">
                      <select
                        value={u.status}
                        disabled={!canChangePlan || busyId === u.id + 'set_status'}
                        onChange={e => change(u.id, 'set_status', e.target.value)}
                        className={`rounded-full px-3 py-1 text-xs ${STATUS_STYLE[u.status] || ''} disabled:opacity-50`}
                      >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <button
                        disabled={!canChangePlan || busyId === u.id + 'set_plan'}
                        onClick={() => change(u.id, 'set_plan', isPro(u.plan) ? 'free' : 'pro')}
                        className={`px-3 py-1 rounded-full text-xs disabled:opacity-50 ${
                          isPro(u.plan)
                            ? 'bg-primary/20 text-primary'
                            : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-highest'
                        }`}
                      >
                        {isPro(u.plan) ? 'Pro — remove' : 'Free — make Pro'}
                      </button>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        disabled={!canChangeRole || busyId === u.id + 'set_role'}
                        onChange={e => change(u.id, 'set_role', e.target.value)}
                        className="rounded-lg px-2 py-1 text-xs text-on-surface disabled:opacity-50"
                      >
                        <option value="user">user</option>
                        <option value="support">support</option>
                        <option value="manager">manager</option>
                        <option value="super_admin">super_admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {!shown.length && (
                  <tr><td colSpan="7" className="p-6 text-center text-on-surface-variant">No users found</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {!canChangePlan && (
            <p className="text-on-surface-variant text-xs">
              Your role is “{myRole}”, which can view but not change anything.
            </p>
          )}
        </>
      )}

      {/* ---------------------------------------------------------- METRICS */}
      {!loading && tab === 'metrics' && metrics && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Stat label="AUM" value={formatCurrency(metrics.aum)} hint={`${metrics.investorCount} investing`} />
            <Stat label="Total users" value={metrics.totalUsers} hint={`+${metrics.newUsers7d} this week`} />
            <Stat label="Premium" value={metrics.premiumUsers} hint={`${metrics.blockedUsers} restricted`} />
            <Stat label="Active users" value={`${metrics.dau} / ${metrics.mau}`} hint="today / 30 days" />
          </div>

          <div className="card p-6">
            <h3 className="text-on-surface mb-4">Where the money sits</h3>
            {Object.entries(metrics.allocation || {}).sort((a, b) => b[1] - a[1]).map(([type, value]) => {
              const pct = metrics.aum > 0 ? (value / metrics.aum) * 100 : 0;
              return (
                <div key={type} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface capitalize">{type}</span>
                    <span className="text-on-surface-variant">
                      {formatCurrency(value)} · {pct.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-surface-container overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {!Object.keys(metrics.allocation || {}).length && (
              <p className="text-on-surface-variant text-sm">No holdings on the platform yet.</p>
            )}
          </div>
        </>
      )}

      {/* --------------------------------------------------------- SETTINGS */}
      {!loading && tab === 'settings' && (
        <RazorpaySettings
          status={settings?.razorpay}
          canEdit={myRole === 'super_admin'}
          onSaved={() => callAdmin('settings').then(setSettings)}
          onError={setError}
        />
      )}

      {/* ------------------------------------------------------------ AUDIT */}
      {!loading && tab === 'audit' && (
        <div className="card p-2">
          {audit.map(e => (
            <div key={e.id} className="p-4 border-b border-outline-variant text-sm">
              <p className="text-on-surface">
                <span className="text-primary">{e.admin_email || 'admin'}</span>
                {' '}changed {e.details?.field} from{' '}
                <span className="text-on-surface-variant">{String(e.details?.from)}</span> to{' '}
                <span className="text-on-surface-variant">{String(e.details?.to)}</span>
                {e.details?.targetEmail ? ` for ${e.details.targetEmail}` : ''}
              </p>
              <p className="text-on-surface-variant text-xs mt-1">
                {new Date(e.created_at).toLocaleString('en-IN')}
              </p>
            </div>
          ))}
          {!audit.length && <p className="p-6 text-on-surface-variant text-sm">No admin actions recorded yet.</p>}
        </div>
      )}
    </div>
  );
}
