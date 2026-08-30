import { create } from 'zustand';

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
  getStats: () => {
    const state = get();
    const { portfolio } = state;

    let invested = 0, currentValue = 0;

    Object.keys(portfolio).forEach(key => {
      portfolio[key].forEach(h => {
        if (key === 'stocks' || key === 'mf') {
          invested += h.quantity * h.buy_price;
          currentValue += h.quantity * (h.current_price || h.buy_price);
        } else if (key === 'bonds' || key === 'fds') {
          invested += h.principal;
          currentValue += h.principal + (h.accrued_interest || 0);
        } else if (key === 'loans') {
          invested -= h.amount;
          currentValue -= h.remaining_balance || h.amount;
        } else if (key === 'crypto' || key === 'gold') {
          invested += h.quantity * h.buy_price;
          currentValue += h.quantity * h.current_price;
        } else if (key === 'properties') {
          invested += h.purchase_price;
          currentValue += h.current_valuation;
        }
      });
    });

    const pl = currentValue - invested;
    const pct = invested > 0 ? ((pl / invested) * 100).toFixed(2) : 0;

    return { invested, currentValue, pl, pct };
  }
}));
