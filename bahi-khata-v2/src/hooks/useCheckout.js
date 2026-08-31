import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Razorpay checkout, driven entirely by what the server says is configured.
//
// Nothing here decides whether the user is now Pro. The browser reports what
// checkout handed it; the server checks the signature against the secret and
// only then changes the plan. If this file were rewritten by an attacker, the
// worst it could do is lie to itself.

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise(resolve => {
    const existing = document.querySelector(`script[src="${CHECKOUT_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const s = document.createElement('script');
    s.src = CHECKOUT_SCRIPT;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Please log in again.');
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function post(action, body) {
  const res = await fetch('/api/payments', {
    method: 'POST',
    headers: await authHeaders(),
    body: JSON.stringify({ action, ...body })
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { throw new Error('The payment service is not responding properly.'); }
  if (!res.ok) throw new Error(data.error || 'Payment request failed.');
  return data;
}

export function useCheckout({ user, onUpgraded } = {}) {
  const [available, setAvailable] = useState(null);   // null = still asking
  const [mode, setMode] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/payments?action=status')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setAvailable(Boolean(d.available));
        setMode(d.mode || null);
      })
      .catch(() => !cancelled && setAvailable(false));
    return () => { cancelled = true; };
  }, []);

  const checkout = useCallback(async cycle => {
    if (available === false) {
      throw new Error('Payments are not switched on yet. Please try again later.');
    }

    const ready = await loadRazorpay();
    if (!ready) throw new Error('Could not reach the payment window. Check your connection and try again.');

    const order = await post('create_order', { cycle });

    // The promise settles on the outcome, so the button can show progress.
    return new Promise((resolve, reject) => {
      const rzp = new window.Razorpay({
        key: order.keyId,
        order_id: order.orderId,
        amount: order.amount,
        currency: order.currency,
        name: order.name,
        description: order.description,
        prefill: { email: user?.email || '' },
        theme: { color: '#2563EB' },
        handler: async response => {
          try {
            // Everything below is only a claim until the server says otherwise.
            const result = await post('verify', {
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
              signature: response.razorpay_signature,
              cycle
            });
            await onUpgraded?.();
            resolve(result);
          } catch (e) {
            reject(new Error(
              `${e.message} If money has left your account, it will be confirmed automatically within a few minutes — please refresh.`
            ));
          }
        },
        modal: {
          ondismiss: () => reject(new Error('Payment cancelled.'))
        }
      });

      rzp.on('payment.failed', r => {
        reject(new Error(r?.error?.description || 'The payment did not go through.'));
      });

      rzp.open();
    });
  }, [available, user, onUpgraded]);

  return { checkout, paymentsAvailable: available, mode };
}
