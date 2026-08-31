import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_KEY || 'your-anonymous-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Authentication
export const authService = {
  async signup(email, password) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  },

  async signin(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  }
};

// Holdings CRUD
export const holdingsService = {
  async getHoldings(userId) {
    const { data, error } = await supabase
      .from('holdings')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async addHolding(userId, holding) {
    // .select() is required: without it supabase-js returns data: null on an
    // insert, so the caller got `undefined` and pushed it into the portfolio
    // list — which crashed the app on the next render (white screen).
    const { data, error } = await supabase
      .from('holdings')
      .insert([{ ...holding, user_id: userId }])
      .select();

    if (error) throw error;
    if (!data?.[0]) throw new Error('Holding was not saved. Please try again.');
    return data[0];
  },

  // Bulk insert for the import screen. Sent in batches so a large portfolio
  // does not arrive as one oversized request.
  async addHoldings(userId, holdings) {
    const saved = [];
    const BATCH = 50;

    for (let i = 0; i < holdings.length; i += BATCH) {
      const chunk = holdings.slice(i, i + BATCH).map(h => ({ ...h, user_id: userId }));
      const { data, error } = await supabase.from('holdings').insert(chunk).select();
      if (error) {
        // Report how far it got, so the user knows what is already saved.
        const e = new Error(`${error.message} (${saved.length} of ${holdings.length} saved)`);
        e.savedCount = saved.length;
        throw e;
      }
      saved.push(...(data || []));
    }
    return saved;
  },

  async updateHolding(id, updates) {
    const { data, error } = await supabase
      .from('holdings')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    return data?.[0];
  },

  async deleteHolding(id) {
    const { error } = await supabase
      .from('holdings')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};

// Subscriptions
export const subscriptionService = {
  async getSubscription(userId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async createSubscription(userId, planId) {
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([{
        user_id: userId,
        plan_id: planId,
        status: 'active',
        started_at: new Date(),
        next_billing_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }]);

    if (error) throw error;
    return data?.[0];
  }
};

// Price Alerts
export const priceAlertService = {
  async getPriceAlerts(userId) {
    const { data, error } = await supabase
      .from('price_alerts')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  },

  async addPriceAlert(userId, alert) {
    const { data, error } = await supabase
      .from('price_alerts')
      .insert([{ ...alert, user_id: userId }]);

    if (error) throw error;
    return data?.[0];
  },

  async deletePriceAlert(id) {
    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
