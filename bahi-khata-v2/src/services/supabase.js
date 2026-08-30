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
    const { data, error } = await supabase
      .from('holdings')
      .insert([{ ...holding, user_id: userId }]);

    if (error) throw error;
    return data?.[0];
  },

  async updateHolding(id, updates) {
    const { data, error } = await supabase
      .from('holdings')
      .update(updates)
      .eq('id', id);

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
