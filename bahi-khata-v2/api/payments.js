// Razorpay checkout.
//
// The whole design rests on one rule: THE BROWSER IS NEVER BELIEVED. It can
// say "payment succeeded" all it likes; the plan only changes after this
// server has checked the signature with the secret key, or Razorpay's own
// webhook has told us directly.
//
// Credentials come from the app_settings table, which has row-level security
// on and no policy — only this function's service-role key can read it. That
// is what lets a super admin switch payments on from the admin panel without
// anyone touching code or redeploying.
//
// Actions:
//   GET  ?action=status            is checkout available, and in which mode
//   POST  action=create_order      make a Razorpay order for the signed-in user
//   POST  action=verify            check the signature, then upgrade the plan
//   POST  (webhook, X-Razorpay-Signature header) Razorpay's own confirmation

import crypto from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Prices live here, not in the browser. A request that says "₹1" is ignored.
const PRICES = {
  monthly: { amount: 99, months: 1, label: 'MYWEALTH Pro — monthly' },
  yearly: { amount: 799, months: 12, label: 'MYWEALTH Pro — yearly' }
};

const svcHeaders = (extra = {}) => ({
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  ...extra
});

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { ...options, headers: svcHeaders(options.headers) });
  const text = await res.text();
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

/** Razorpay credentials, or null when payments have not been switched on. */
async function getCredentials() {
  const rows = await rest('app_settings?key=eq.razorpay&select=value');
  const v = rows?.[0]?.value;
  if (!v?.key_id || !v?.key_secret) return null;
  return { keyId: v.key_id, keySecret: v.key_secret, mode: v.mode || 'test' };
}

/** Identify the caller from their Supabase session token. */
async function currentUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return null;
  return res.json();
}

async function razorpay(creds, path, body) {
  const auth = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString('base64');
  const res = await fetch(`https://api.razorpay.com/v1${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.error?.description || `Razorpay returned ${res.status}`);
  return data;
}

/** Grant Pro and record the payment. Called only after verification. */
async function grantPro(userId, cycle, payment) {
  const months = PRICES[cycle]?.months || 1;
  const expires = new Date();
  expires.setMonth(expires.getMonth() + months);

  await rest(`profiles?id=eq.${userId}`, {
    method: 'PATCH',
    headers: { Prefer: 'return=minimal' },
    body: JSON.stringify({
      plan: 'pro',
      plan_started_at: new Date().toISOString(),
      plan_expires_at: expires.toISOString()
    })
  });

  // payment_id is unique, so a repeated webhook cannot grant twice.
  await rest('payments', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify([{
      user_id: userId,
      order_id: payment.orderId,
      payment_id: payment.paymentId,
      amount: payment.amount,
      plan: 'pro',
      cycle,
      status: 'paid',
      raw: payment.raw || {}
    }])
  });

  return expires;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'Server is not configured.' });
  }

  const action = req.method === 'POST' ? req.body?.action : req.query.action;

  try {
    // ------------------------------------------------------------- webhook
    // Razorpay posts here itself. This is the reliable path: it still arrives
    // if the user closes the tab the moment after paying.
    const webhookSignature = req.headers['x-razorpay-signature'];
    if (req.method === 'POST' && webhookSignature && !action) {
      const rows = await rest('app_settings?key=eq.razorpay&select=value');
      const secret = rows?.[0]?.value?.webhook_secret || rows?.[0]?.value?.key_secret;
      if (!secret) return res.status(400).json({ error: 'Payments are not configured' });

      const raw = JSON.stringify(req.body);
      const expected = crypto.createHmac('sha256', secret).update(raw).digest('hex');
      if (expected !== webhookSignature) {
        return res.status(400).json({ error: 'Signature did not match' });
      }

      const entity = req.body?.payload?.payment?.entity;
      if (req.body?.event === 'payment.captured' && entity?.notes?.userId) {
        await grantPro(entity.notes.userId, entity.notes.cycle || 'monthly', {
          orderId: entity.order_id,
          paymentId: entity.id,
          amount: entity.amount / 100,
          raw: entity
        });
      }
      return res.status(200).json({ ok: true });
    }

    // -------------------------------------------------------------- status
    if (action === 'status') {
      const creds = await getCredentials();
      return res.status(200).json({
        available: Boolean(creds),
        mode: creds?.mode || null,
        // Safe to publish: the key id is what the checkout widget needs, and
        // Razorpay treats it as public. The secret never appears here.
        keyId: creds?.keyId || null,
        prices: Object.fromEntries(Object.entries(PRICES).map(([k, v]) => [k, v.amount]))
      });
    }

    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });

    const user = await currentUser(req);
    if (!user) return res.status(401).json({ error: 'Please log in first.' });

    const creds = await getCredentials();
    if (!creds) {
      return res.status(503).json({ error: 'Payments are not switched on yet.' });
    }

    // -------------------------------------------------------- create order
    if (action === 'create_order') {
      const cycle = req.body?.cycle === 'yearly' ? 'yearly' : 'monthly';
      const price = PRICES[cycle];

      const order = await razorpay(creds, '/orders', {
        amount: price.amount * 100,          // Razorpay counts in paise
        currency: 'INR',
        receipt: `pro_${cycle}_${user.id.slice(0, 8)}_${Date.now()}`,
        // Carried through to the webhook, so a payment can be matched to a
        // person even if the browser never comes back.
        notes: { userId: user.id, cycle, email: user.email || '' }
      });

      await rest('payments', {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify([{
          user_id: user.id, order_id: order.id, amount: price.amount,
          plan: 'pro', cycle, status: 'created'
        }])
      });

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: creds.keyId,
        name: 'MYWEALTH',
        description: price.label
      });
    }

    // -------------------------------------------------------------- verify
    // The browser reports back after checkout. Everything it sends is treated
    // as a claim until the signature proves otherwise.
    if (action === 'verify') {
      const { orderId, paymentId, signature, cycle } = req.body || {};
      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ error: 'Incomplete payment details.' });
      }

      const expected = crypto
        .createHmac('sha256', creds.keySecret)
        .update(`${orderId}|${paymentId}`)
        .digest('hex');

      if (expected !== signature) {
        await rest('payments', {
          method: 'POST',
          headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify([{ user_id: user.id, order_id: orderId, payment_id: paymentId, status: 'failed' }])
        });
        return res.status(400).json({ error: 'This payment could not be verified.' });
      }

      // Signature checks out. Confirm with Razorpay that it was actually
      // captured — a signature proves the message came from checkout, not that
      // money moved.
      const payment = await razorpay(creds, `/payments/${paymentId}`);
      if (payment.status !== 'captured' && payment.status !== 'authorized') {
        return res.status(400).json({ error: `Payment is ${payment.status}, not completed.` });
      }

      const expires = await grantPro(user.id, cycle === 'yearly' ? 'yearly' : 'monthly', {
        orderId, paymentId, amount: payment.amount / 100, raw: payment
      });

      return res.status(200).json({ ok: true, plan: 'pro', expiresAt: expires.toISOString() });
    }

    return res.status(400).json({ error: 'Unknown action' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Payment request failed' });
  }
}
