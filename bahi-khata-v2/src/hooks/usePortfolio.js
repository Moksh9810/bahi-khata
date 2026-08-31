import { useEffect, useRef, useState } from 'react';
import { holdingsService } from '../services/supabase';
import { usePortfolioStore } from '../store/portfolioStore';

/** "22K chain" -> "22k". Unmarked gold is taken as 24K. */
const purityOf = name => {
  const m = String(name || '').match(/\b(24|22|18)\s*k\b/i);
  return m ? `${m[1]}k` : '24k';
};

export const usePortfolio = (userId, portfolioId = null) => {
  const portfolio = usePortfolioStore(state => state.portfolio);
  const setPortfolio = usePortfolioStore(state => state.setPortfolio);
  const setLoading = usePortfolioStore(state => state.setLoading);
  // The store's `loading` starts false, so it cannot tell "not started yet"
  // apart from "finished". This flag flips only once the first load is done.
  const [loaded, setLoaded] = useState(false);
  const setError = usePortfolioStore(state => state.setError);
  const error = usePortfolioStore(state => state.error);
  const addHolding = usePortfolioStore(state => state.addHolding);
  const removeHolding = usePortfolioStore(state => state.removeHolding);
  const updateHolding = usePortfolioStore(state => state.updateHolding);
  const getStats = usePortfolioStore(state => state.getStats);
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState(null);

  // Load portfolio on mount or when userId changes
  useEffect(() => {
    // Reloads when the user switches portfolio, not only on sign-in.
    if (userId) {
      loadPortfolio();
    }
  }, [userId, portfolioId]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const holdings = await holdingsService.getHoldings(userId, portfolioId);

      // Group holdings by type
      const grouped = {
        stocks: [],
        mf: [],
        bonds: [],
        loans: [],
        crypto: [],
        gold: [],
        properties: [],
        fds: []
      };

      holdings.forEach(h => {
        const type = h.type || 'stock';
        let key;

        // Map type to portfolio key
        switch(type) {
          case 'stock': key = 'stocks'; break;
          case 'mf': key = 'mf'; break;
          case 'bond': key = 'bonds'; break;
          case 'loan': key = 'loans'; break;
          case 'crypto': key = 'crypto'; break;
          case 'gold': key = 'gold'; break;
          case 'property': key = 'properties'; break;
          case 'fd': key = 'fds'; break;
          default: key = type.endsWith('s') ? type : type + 's';
        }

        if (grouped[key]) {
          grouped[key].push(h);
        }
      });

      setPortfolio(grouped);
      setError(null);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
      setLoaded(true);
    }
  };

  const addNewHolding = async (type, holdingData) => {
    try {
      const holding = await holdingsService.addHolding(userId, {
        type,
        ...holdingData
      }, portfolioId);

      addHolding(type, holding);
      return holding;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const importHoldings = async (holdings) => {
    try {
      const saved = await holdingsService.addHoldings(userId, holdings, portfolioId);
      // Reload rather than patching the store by hand: the rows come back with
      // their database ids and any server-side defaults applied.
      await loadPortfolio();
      return saved;
    } catch (err) {
      setError(err.message);
      if (err.savedCount) await loadPortfolio(); // show whatever did get through
      throw err;
    }
  };

  const deleteHolding = async (id, type) => {
    try {
      await holdingsService.deleteHolding(id);
      removeHolding(type, id);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  const updateHoldingData = async (id, type, updates) => {
    try {
      await holdingsService.updateHolding(id, updates);
      updateHolding(type, id, updates);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // ---- live prices -------------------------------------------------------
  // Which buckets can be priced, where the price belongs in each row, and how
  // to work out what to ask the feed for.
  //
  // quote_id is set when the holding is picked from search. Rows added before
  // that existed fall back to whatever name we have.
  const PRICED = {
    stocks: { source: 'stock', field: 'current_price', idOf: h => h.quote_id || h.symbol },
    mf: { source: 'mf', field: 'current_nav', idOf: h => h.quote_id || h.scheme },
    crypto: { source: 'crypto', field: 'current_price', idOf: h => h.quote_id || h.symbol },
    // Gold is priced per gram, so the only thing the feed needs is the purity.
    // "22K chain" gives 22k; anything unmarked is treated as 24K, which is how
    // bullion, coins and sovereign bonds are quoted.
    gold: { source: 'gold', field: 'current_price', idOf: h => purityOf(h.name) }
  };

  const refreshPrices = async () => {
    const current = usePortfolioStore.getState().portfolio;

    // Build one request key per holding: "stock:TCS.NS", "mf:120503", ...
    const items = new Set();
    for (const [bucket, cfg] of Object.entries(PRICED)) {
      for (const h of current[bucket] || []) {
        const id = cfg.idOf(h);
        // A Set, because every 24K gold row asks the feed the same question.
        if (id) items.add(`${cfg.source}:${id}`);
      }
    }
    if (!items.size) return;

    let prices;
    try {
      const res = await fetch(`/api/market?action=quotes&items=${encodeURIComponent([...items].join('|'))}`);
      if (!res.ok) return;
      ({ prices } = await res.json());
    } catch {
      return; // offline or the feed is down — keep showing the last known prices
    }
    if (!prices || !Object.keys(prices).length) return;

    const updated = { ...current };
    for (const [bucket, cfg] of Object.entries(PRICED)) {
      updated[bucket] = (current[bucket] || []).map(h => {
        const id = cfg.idOf(h);
        const p = prices[`${cfg.source}:${id}`];
        return typeof p === 'number' ? { ...h, [cfg.field]: p } : h;
      });
    }

    setPortfolio(updated);
    setPricesUpdatedAt(new Date());
  };

  // Keep a ref so the interval below always calls the latest version.
  const refreshRef = useRef(refreshPrices);
  refreshRef.current = refreshPrices;

  useEffect(() => {
    if (!userId) return undefined;
    const tick = () => refreshRef.current();
    // Once shortly after the portfolio has loaded, then every minute while open.
    const first = setTimeout(tick, 1500);
    const timer = setInterval(tick, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [userId]);

  const stats = getStats();

  return {
    portfolio,
    stats,
    addHolding: addNewHolding,
    importHoldings,
    removeHolding: deleteHolding,
    updateHolding: updateHoldingData,
    loadPortfolio,
    refreshPrices,
    pricesUpdatedAt,
    loaded,
    error
  };
};
