import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { formatCurrency } from '../utils/formatters';

// Admin console. Every figure and every change goes through /api/admin, which
// runs on the server — the browser never holds a key that can read other
// people's data.

const panel = {
  background: 'rgba(31,31,41,0.4)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255,255,255,0.1)',
  borderLeft: '1px solid rgba(255,255,255,0.1)'
};

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
    <div className="glass-panel rounded-xl p-5" style={panel}>
      <p className="text-on-surface-variant text-sm">{label}</p>
      <p className="font-data-lg text-data-lg text-on-surface mt-1">{value}</p>
      {hint && <p className="text-on-surface-variant text-xs mt-1">{hint}</p>}
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
          {['users', 'metrics', 'audit'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm capitalize ${
                tab === t ? 'bg-primary text-on-primary font-bold' : 'text-on-surface-variant hover:bg-white/5'
              }`}
            >
              {t}
            </button>
          ))}
          <button onClick={load} className="px-4 py-2 rounded-lg text-sm text-on-surface-variant hover:bg-white/5">
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
            className="w-full md:max-w-sm glass-panel rounded-lg px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
            style={panel}
          />

          <div className="overflow-x-auto rounded-xl" style={panel}>
            <table className="w-full text-sm min-w-[860px]">
              <thead className="text-on-surface-variant">
                <tr className="border-b border-white/10">
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
                  <tr key={u.id} className="border-b border-white/5">
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
                        style={{ background: 'rgba(31,31,41,0.8)' }}
                      >
                        <option value="active">active</option>
                        <option value="suspended">suspended</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </td>

                    <td className="p-4">
                      <button
                        disabled={!canChangePlan || busyId === u.id + 'set_plan'}
                        onClick={() => change(u.id, 'set_plan', u.plan === 'premium' ? 'free' : 'premium')}
                        className={`px-3 py-1 rounded-full text-xs disabled:opacity-50 ${
                          u.plan === 'premium'
                            ? 'bg-primary/20 text-primary'
                            : 'bg-white/5 text-on-surface-variant hover:bg-white/10'
                        }`}
                      >
                        {u.plan === 'premium' ? 'Premium — remove' : 'Free — make premium'}
                      </button>
                    </td>

                    <td className="p-4">
                      <select
                        value={u.role}
                        disabled={!canChangeRole || busyId === u.id + 'set_role'}
                        onChange={e => change(u.id, 'set_role', e.target.value)}
                        className="rounded-lg px-2 py-1 text-xs text-on-surface disabled:opacity-50"
                        style={{ background: 'rgba(31,31,41,0.8)' }}
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

          <div className="glass-panel rounded-xl p-6" style={panel}>
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
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
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

      {/* ------------------------------------------------------------ AUDIT */}
      {!loading && tab === 'audit' && (
        <div className="glass-panel rounded-xl p-2" style={panel}>
          {audit.map(e => (
            <div key={e.id} className="p-4 border-b border-white/5 text-sm">
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
