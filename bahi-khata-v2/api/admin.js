// Admin API — runs only on Vercel's servers, never in the browser.
//
// SECURITY NOTES (read before changing anything here):
//  * SUPABASE_SERVICE_ROLE_KEY bypasses every row-level security rule. It must
//    stay in a server-only env var. It must NEVER be given a VITE_ prefix,
//    because Vite bakes those into the browser bundle where anyone can read it.
//  * Every request is checked twice: the caller's own login token must be valid,
//    AND their profile row must carry an admin role. A token alone is not enough.
//  * Every change is written to admin_audit_log before the response is returned.
//  * There is deliberately no "delete user" action. Blocking is reversible;
//    deleting a person's account and holdings is not.

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ROLES = ['user', 'support', 'manager', 'super_admin'];
const STATUSES = ['active', 'suspended', 'blocked'];
const PLANS = ['free', 'premium'];

// Who may do what.
const CAN = {
  read: ['support', 'manager', 'super_admin'],
  changePlan: ['manager', 'super_admin'],
  changeStatus: ['manager', 'super_admin'],
  changeRole: ['super_admin']
};

const svcHeaders = (extra = {}) => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  ...extra
});

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: svcHeaders(options.headers)
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

// Confirm the caller is who they say they are, and that they are an admin.
async function authenticate(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return { error: 'Not signed in', code: 401 };

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return { error: 'Session is not valid', code: 401 };
  const user = await res.json();

  const rows = await rest(`profiles?id=eq.${user.id}&select=id,email,role,status`);
  const profile = rows && rows[0];
  if (!profile || !CAN.read.includes(profile.role)) {
    return { error: 'You do not have admin access', code: 403 };
  }
  if (profile.status !== 'active') return { error: 'Your admin account is not active', code: 403 };

  return { user, profile };
}

async function writeAudit(admin, action, targetUserId, details) {
  try {
    await rest('admin_audit_log', {
      method: 'POST',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify([{
        admin_id: admin.id,
        admin_email: admin.email,
        action,
        target_user_id: targetUserId || null,
        details: details || {}
      }])
    });
  } catch {
    // A failed audit write must not hide the real action's result, but it is
    // worth surfacing in logs.
    console.error('audit log write failed for action:', action);
  }
}

// Portfolio value per user, using the same rules as the app's own maths.
function valueOf(holding) {
  const n = v => (typeof v === 'number' ? v : parseFloat(v) || 0);
  switch (holding.type) {
    case 'stocks':
    case 'crypto':
    case 'gold':
      return n(holding.quantity) * (n(holding.current_price) || n(holding.buy_price));
    case 'mf':
      return n(holding.units) * (n(holding.current_nav) || n(holding.buy_nav));
    case 'properties':
      return n(holding.buy_price); // current valuation is stored here
    case 'bonds':
    case 'loans':
    case 'fds':
      return n(holding.quantity);
    default:
      return 0;
  }
}

async function listAuthUsers() {
  // Gives us last_sign_in_at, which profiles does not carry.
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: svcHeaders()
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.users || [];
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({
      error: 'Admin API is not configured. Set SUPABASE_SERVICE_ROLE_KEY in Vercel.'
    });
  }

  const auth = await authenticate(req).catch(e => ({ error: e.message, code: 500 }));
  if (auth.error) return res.status(auth.code).json({ error: auth.error });

  const me = auth.profile;
  const action = (req.method === 'POST' ? req.body?.action : req.query.action) || 'users';

  try {
    // ---------------------------------------------------------------- reads
    if (action === 'users') {
      const [profiles, holdings, authUsers] = await Promise.all([
        rest('profiles?select=id,email,role,status,plan,plan_expires_at,created_at&order=created_at.desc'),
        rest('holdings?select=user_id,type,quantity,units,buy_price,current_price,buy_nav,current_nav'),
        listAuthUsers()
      ]);

      const valueByUser = {};
      const countByUser = {};
      for (const h of holdings || []) {
        valueByUser[h.user_id] = (valueByUser[h.user_id] || 0) + valueOf(h);
        countByUser[h.user_id] = (countByUser[h.user_id] || 0) + 1;
      }
      const signInById = Object.fromEntries(authUsers.map(u => [u.id, u.last_sign_in_at]));

      return res.status(200).json({
        me: { id: me.id, email: me.email, role: me.role },
        users: (profiles || []).map(p => ({
          ...p,
          portfolioValue: Math.round(valueByUser[p.id] || 0),
          holdingsCount: countByUser[p.id] || 0,
          lastSignInAt: signInById[p.id] || null
        }))
      });
    }

    if (action === 'metrics') {
      const [profiles, holdings, authUsers] = await Promise.all([
        rest('profiles?select=id,plan,status,created_at'),
        rest('holdings?select=user_id,type,quantity,units,buy_price,current_price,buy_nav,current_nav'),
        listAuthUsers()
      ]);

      const now = Date.now();
      const since = days => now - days * 24 * 60 * 60 * 1000;

      const allocation = {};
      let aum = 0;
      for (const h of holdings || []) {
        const v = valueOf(h);
        aum += v;
        allocation[h.type] = (allocation[h.type] || 0) + v;
      }

      const activeSince = d => authUsers.filter(u => u.last_sign_in_at && new Date(u.last_sign_in_at).getTime() > since(d)).length;

      return res.status(200).json({
        totalUsers: (profiles || []).length,
        premiumUsers: (profiles || []).filter(p => p.plan === 'premium').length,
        blockedUsers: (profiles || []).filter(p => p.status !== 'active').length,
        newUsers7d: (profiles || []).filter(p => new Date(p.created_at).getTime() > since(7)).length,
        dau: activeSince(1),
        mau: activeSince(30),
        aum: Math.round(aum),
        investorCount: new Set((holdings || []).map(h => h.user_id)).size,
        allocation: Object.fromEntries(Object.entries(allocation).map(([k, v]) => [k, Math.round(v)]))
      });
    }

    if (action === 'audit') {
      const rows = await rest('admin_audit_log?select=*&order=created_at.desc&limit=100');
      return res.status(200).json({ entries: rows || [] });
    }

    // --------------------------------------------------------------- writes
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Changes must be sent as POST' });
    }

    const { userId, value } = req.body || {};
    if (!userId) return res.status(400).json({ error: 'userId is required' });
    if (userId === me.id && (action === 'set_status' || action === 'set_role')) {
      // Stops an admin locking themselves out of their own panel.
      return res.status(400).json({ error: 'You cannot change your own role or status' });
    }

    const field = { set_plan: 'plan', set_status: 'status', set_role: 'role' }[action];
    if (!field) return res.status(400).json({ error: 'Unknown action' });

    const allowed = { plan: PLANS, status: STATUSES, role: ROLES }[field];
    if (!allowed.includes(value)) {
      return res.status(400).json({ error: `${field} must be one of: ${allowed.join(', ')}` });
    }

    const permission = { plan: 'changePlan', status: 'changeStatus', role: 'changeRole' }[field];
    if (!CAN[permission].includes(me.role)) {
      return res.status(403).json({ error: `Your role (${me.role}) cannot change ${field}` });
    }

    const before = await rest(`profiles?id=eq.${userId}&select=${field},email`);
    if (!before || !before[0]) return res.status(404).json({ error: 'User not found' });

    const patch = { [field]: value };
    // Premium granted by hand has no expiry; going back to free clears it.
    if (field === 'plan') patch.plan_expires_at = null;

    await rest(`profiles?id=eq.${userId}`, {
      method: 'PATCH',
      headers: { Prefer: 'return=minimal' },
      body: JSON.stringify(patch)
    });

    await writeAudit(me, action, userId, {
      field,
      from: before[0][field],
      to: value,
      targetEmail: before[0].email
    });

    return res.status(200).json({ ok: true, userId, field, value });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Admin request failed' });
  }
}
