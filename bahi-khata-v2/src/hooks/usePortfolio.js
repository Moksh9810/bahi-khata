import { useEffect, useRef, useState } from 'react';
import { holdingsService } from '../services/supabase';
import { usePortfolioStore } from '../store/portfolioStore';

export const usePortfolio = (userId) => {
  const portfolio = usePortfolioStore(state => state.portfolio);
  const setPortfolio = usePortfolioStore(state => state.setPortfolio);
  const setLoading = usePortfolioStore(state => state.setLoading);
  const setError = usePortfolioStore(state => state.setError);
  const error = usePortfolioStore(state => state.error);
  const addHolding = usePortfolioStore(state => state.addHolding);
  const removeHolding = usePortfolioStore(state => state.removeHolding);
  const updateHolding = usePortfolioStore(state => state.updateHolding);
  const getStats = usePortfolioStore(state => state.getStats);
  const [pricesUpdatedAt, setPricesUpdatedAt] = useState(null);

  // Load portfolio on mount or when userId changes
  useEffect(() => {
    if (userId) {
      loadPortfolio();
    }
  }, [userId]);

  const loadPortfolio = async () => {
    setLoading(true);
    try {
      const holdings = await holdingsService.getHoldings(userId);

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
    }
  };

  const addNewHolding = async (type, holdingData) => {
    try {
      const holding = await holdingsService.addHolding(userId, {
        type,
        ...holdingData
      });

      addHolding(type, holding);
      return holding;
    } catch (error) {
      setError(error.message);
      throw error;
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
  // Which buckets can be priced, and where the price belongs in each row.
  const PRICED = {
    stocks: { source: 'stock', field: 'current_price' },
    mf: { source: 'mf', field: 'current_nav' },
    crypto: { source: 'crypto', field: 'current_price' }
  };

  const refreshPrices = async () => {
    const current = usePortfolioStore.getState().portfolio;

    // Build one request key per holding: "stock:TCS.NS", "mf:120503", ...
    const items = [];
    for (const [bucket, cfg] of Object.entries(PRICED)) {
      for (const h of current[bucket] || []) {
        // quote_id is set when the holding is picked from search. Rows added
        // before that existed fall back to whatever name we have.
        const id = h.quote_id || h.symbol || h.scheme;
        if (id) items.push(`${cfg.source}:${id}`);
      }
    }
    if (!items.length) return;

    let prices;
    try {
      const res = await fetch(`/api/market?action=quotes&items=${encodeURIComponent(items.join('|'))}`);
      if (!res.ok) return;
      ({ prices } = await res.json());
    } catch {
      return; // offline or the feed is down — keep showing the last known prices
    }
    if (!prices || !Object.keys(prices).length) return;

    const updated = { ...current };
    for (const [bucket, cfg] of Object.entries(PRICED)) {
      updated[bucket] = (current[bucket] || []).map(h => {
        const id = h.quote_id || h.symbol || h.scheme;
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
    removeHolding: deleteHolding,
    updateHolding: updateHoldingData,
    loadPortfolio,
    refreshPrices,
    pricesUpdatedAt,
    error
  };
};
