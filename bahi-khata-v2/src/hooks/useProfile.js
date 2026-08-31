import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

// Reads the signed-in user's own profile row (role, status, plan).
// Row-level security means this can only ever return the caller's own row —
// asking for someone else's returns nothing, whatever the client sends.
export function useProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!userId) {
      setProfile(null);
      setLoaded(false);
      return undefined;
    }

    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id,email,role,status,plan,plan_expires_at')
        .eq('id', userId)
        .maybeSingle();

      if (cancelled) return;
      // A missing row is not an error worth blocking on: the app simply treats
      // them as an ordinary free user until the profile trigger catches up.
      if (error) console.error('profile load failed:', error.message);
      setProfile(data || null);
      setLoaded(true);
    })();

    return () => { cancelled = true; };
  }, [userId]);

  const role = profile?.role || 'user';

  return {
    profile,
    loaded,
    role,
    isAdmin: ['support', 'manager', 'super_admin'].includes(role),
    isPremium: profile?.plan === 'premium',
    isRestricted: profile ? profile.status !== 'active' : false
  };
}
