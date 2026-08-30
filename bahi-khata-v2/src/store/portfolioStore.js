import { create } from 'zustand';
import { calculatePortfolioStats } from '../utils/calculations';

export const usePortfolioStore = create((set, get) => ({
  portfolio: {
    stocks: [],
    mf: [],
    bonds: [],
    loans: [],
    crypto: [],
    gold: [],
    properties: [],
    fds: []
  },

  currentUser: null,
  loading: false,
  error: null,

  // Setters
  setPortfolio: (portfolio) => set({ portfolio }),
  setCurrentUser: (user) => set({ currentUser: user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  // The UI already passes the portfolio key itself ('stocks', 'mf', 'fds' ...),
  // so nothing needs pluralising. The old version appended an 's' and produced
  // 'stockss' / 'bondss' — a bucket nothing ever read, so freshly added
  // holdings vanished until a page reload.
  getPortfolioKey: (type) => type,

  // Add holding
  addHolding: (type, holding) => {
    if (!holding) return; // never let an empty row into the list
    const key = get().getPortfolioKey(type);
    set((state) => ({
      portfolio: {
        ...state.portfolio,
        [key]: [...(state.portfolio[key] || []), holding]
      }
    }));
  },

  // Remove holding
  removeHolding: (type, id) => {
    const key = get().getPortfolioKey(type);
    set((state) => ({
      portfolio: {
        ...state.portfolio,
        [key]: (state.portfolio[key] || []).filter(h => h.id !== id)
      }
    }));
  },

  // Update holding
  updateHolding: (type, id, updates) => {
    const key = get().getPortfolioKey(type);
    set((state) => ({
      portfolio: {
        ...state.portfolio,
        [key]: (state.portfolio[key] || []).map(h =>
          h.id === id ? { ...h, ...updates } : h
        )
      }
    }));
  },

  // Get portfolio stats
  //
  // This used to carry its own copy of the maths, and it read columns that do
  // not exist in the database: MF was totalled as quantity x buy_price (MF rows
  // store units and buy_nav), bonds/FDs read `principal`, loans read `amount`,
  // properties read `purchase_price`. Everything but stocks silently added zero.
  // calculations.js already has the correct version, so defer to it.
  getStats: () => {
    const stats = calculatePortfolioStats(get().portfolio);
    // `pct` is kept as an alias so any older caller keeps working.
    return { ...stats, pct: stats.pctReturn };
  }
}));
