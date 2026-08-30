import { useEffect } from 'react';
import { holdingsService } from '../services/supabase';
import { usePortfolioStore } from '../store/portfolioStore';

export const usePortfolio = (userId) => {
  const portfolio = usePortfolioStore(state => state.portfolio);
  const setPortfolio = usePortfolioStore(state => state.setPortfolio);
  const setLoading = usePortfolioStore(state => state.setLoading);
  const setError = usePortfolioStore(state => state.setError);
  const addHolding = usePortfolioStore(state => state.addHolding);
  const removeHolding = usePortfolioStore(state => state.removeHolding);
  const updateHolding = usePortfolioStore(state => state.updateHolding);
  const getStats = usePortfolioStore(state => state.getStats);

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

  const stats = getStats();

  return {
    portfolio,
    stats,
    addHolding: addNewHolding,
    removeHolding: deleteHolding,
    updateHolding: updateHoldingData,
    loadPortfolio,
    error
  };
};
