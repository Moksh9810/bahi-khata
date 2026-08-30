import { useMemo, useCallback } from 'react';

/**
 * Hook to calculate portfolio statistics with memoization
 * Prevents recalculation unless portfolio data changes
 */
export function usePortfolioStats(portfolio) {
  return useMemo(() => {
    if (!portfolio) return null;

    const allHoldings = Object.values(portfolio).flat();
    const totalValue = allHoldings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
    const totalInvested = allHoldings.reduce((sum, h) => sum + (h.invested || 0), 0);
    const totalGain = totalValue - totalInvested;
    const gainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    return {
      totalValue,
      totalInvested,
      totalGain,
      gainPercent,
      holdingsCount: allHoldings.length,
      diversification: calculateDiversification(portfolio)
    };
  }, [portfolio]);
}

/**
 * Hook to calculate asset allocation with memoization
 * Only recalculates when portfolio changes
 */
export function useAssetAllocation(portfolio) {
  return useMemo(() => {
    if (!portfolio) return [];

    const assets = {};
    Object.entries(portfolio).forEach(([type, holdings]) => {
      const total = Array.isArray(holdings)
        ? holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0)
        : 0;
      if (total > 0) {
        assets[type] = total;
      }
    });

    return Object.entries(assets).map(([type, value]) => ({
      type,
      value,
      percentage: 0 // Will be calculated by consumer
    }));
  }, [portfolio]);
}

/**
 * Hook to calculate category performance with memoization
 */
export function useCategoryPerformance(portfolio) {
  return useMemo(() => {
    if (!portfolio) return [];

    return Object.entries(portfolio)
      .map(([type, holdings]) => {
        const data = Array.isArray(holdings) ? holdings : [];
        const currentValue = data.reduce((sum, h) => sum + (h.currentValue || 0), 0);
        const invested = data.reduce((sum, h) => sum + (h.invested || 0), 0);
        const gain = currentValue - invested;

        return {
          category: type,
          currentValue,
          invested,
          gain,
          gainPercent: invested > 0 ? (gain / invested) * 100 : 0
        };
      })
      .sort((a, b) => b.currentValue - a.currentValue);
  }, [portfolio]);
}

/**
 * Helper function to calculate portfolio diversification
 */
function calculateDiversification(portfolio) {
  const types = Object.keys(portfolio).length;
  const hasHoldings = Object.values(portfolio).some(
    h => Array.isArray(h) ? h.length > 0 : false
  );

  if (!hasHoldings) return 0;

  // More asset types = better diversification
  return Math.min((types / 8) * 100, 100);
}

/**
 * Hook for debounced callbacks
 */
export function useDebouncedCallback(callback, delay) {
  return useCallback((...args) => {
    const timer = setTimeout(() => callback(...args), delay);
    return () => clearTimeout(timer);
  }, [callback, delay]);
}

/**
 * Hook to throttle function calls
 */
export function useThrottledCallback(callback, delay) {
  const lastRun = React.useRef(Date.now());

  return useCallback((...args) => {
    const now = Date.now();
    if (now - lastRun.current >= delay) {
      callback(...args);
      lastRun.current = now;
    }
  }, [callback, delay]);
}

/**
 * Calculate if data is stale and needs refresh
 */
export function useIsDataStale(lastUpdated, stallThreshold = 5 * 60 * 1000) {
  return useMemo(() => {
    if (!lastUpdated) return true;
    return Date.now() - lastUpdated > stallThreshold;
  }, [lastUpdated, stallThreshold]);
}

/**
 * Format currency with memoization
 */
export function useMemoizedCurrency(value) {
  return useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(value);
  }, [value]);
}

/**
 * Calculate chart data with memoization
 */
export function useChartData(portfolio, stats, timePeriod = '1y') {
  return useMemo(() => {
    if (!stats) return null;

    // Generate monthly data based on time period
    const months = {
      '1m': 1,
      '3m': 3,
      '6m': 6,
      '1y': 12,
      'all': 24
    }[timePeriod] || 12;

    const data = [];
    const currentValue = stats.currentValue;
    const monthlyGrowth = currentValue / months / 100; // Estimated monthly growth

    for (let i = 0; i < months; i++) {
      const value = stats.invested + monthlyGrowth * i;
      data.push({
        month: new Date(Date.now() - (months - i) * 30 * 24 * 60 * 60 * 1000)
          .toLocaleDateString('en-IN', { month: 'short' }),
        value: Math.round(value)
      });
    }

    return data;
  }, [portfolio, stats, timePeriod]);
}
