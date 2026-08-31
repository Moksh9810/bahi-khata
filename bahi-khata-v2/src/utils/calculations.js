// Portfolio calculations
export const calculatePortfolioStats = (portfolio) => {
  let invested = 0, currentValue = 0;

  // Stocks
  if (portfolio.stocks) {
    portfolio.stocks.forEach(s => {
      invested += s.quantity * s.buy_price;
      currentValue += s.quantity * (s.current_price || s.buy_price);
    });
  }

  // Mutual Funds
  if (portfolio.mf) {
    portfolio.mf.forEach(m => {
      invested += m.units * m.buy_nav;
      currentValue += m.units * (m.current_nav || m.buy_nav);
    });
  }

  // Bonds
  if (portfolio.bonds) {
    portfolio.bonds.forEach(b => {
      invested += b.quantity;
      currentValue += b.quantity; // Bonds typically stay at face value unless sold
    });
  }

  // Loans (negative - money lent out)
  if (portfolio.loans) {
    portfolio.loans.forEach(l => {
      invested += l.quantity; // Amount lent
      currentValue += l.quantity; // Assuming full recovery
    });
  }

  // Crypto
  if (portfolio.crypto) {
    portfolio.crypto.forEach(c => {
      invested += (c.quantity || 0) * (c.buy_price || 0);
      currentValue += (c.quantity || 0) * (c.current_price || c.buy_price || 0);
    });
  }

  // Gold
  if (portfolio.gold) {
    portfolio.gold.forEach(g => {
      invested += (g.quantity || 0) * (g.buy_price || 0);
      currentValue += (g.quantity || 0) * (g.current_price || g.buy_price || 0);
    });
  }

  // Properties
  if (portfolio.properties) {
    portfolio.properties.forEach(p => {
      invested += p.quantity; // Purchase price
      currentValue += p.buy_price; // Current value
    });
  }

  // FDs
  if (portfolio.fds) {
    portfolio.fds.forEach(f => {
      invested += f.quantity; // Deposit amount
      currentValue += f.quantity; // Assuming gets back principal
    });
  }

  const pl = currentValue - invested;
  const pctReturn = invested > 0 ? ((pl / invested) * 100).toFixed(2) : 0;

  return {
    invested: Math.round(invested),
    currentValue: Math.round(currentValue),
    pl: Math.round(pl),
    pctReturn: parseFloat(pctReturn),
    breakdown: {
      stocks: portfolio.stocks ? portfolio.stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.current_price || s.buy_price || 0)), 0) : 0,
      mf: portfolio.mf ? portfolio.mf.reduce((sum, m) => sum + ((m.units || 0) * (m.current_nav || m.buy_nav || 0)), 0) : 0,
      bonds: portfolio.bonds ? portfolio.bonds.reduce((sum, b) => sum + (b.quantity || 0), 0) : 0,
      crypto: portfolio.crypto ? portfolio.crypto.reduce((sum, c) => sum + ((c.quantity || 0) * (c.current_price || c.buy_price || 0)), 0) : 0,
      gold: portfolio.gold ? portfolio.gold.reduce((sum, g) => sum + ((g.quantity || 0) * (g.current_price || g.buy_price || 0)), 0) : 0,
      properties: portfolio.properties ? portfolio.properties.reduce((sum, p) => sum + (p.buy_price || 0), 0) : 0,
      fds: portfolio.fds ? portfolio.fds.reduce((sum, f) => sum + (f.quantity || 0), 0) : 0,
      loans: portfolio.loans ? portfolio.loans.reduce((sum, l) => sum + (l.quantity || 0), 0) : 0
    }
  };
};

// Calculate asset allocation percentages
export const calculateAllocation = (portfolio) => {
  const stats = calculatePortfolioStats(portfolio);
  const { breakdown, currentValue } = stats;

  return Object.keys(breakdown).reduce((acc, key) => {
    acc[key] = currentValue > 0 ? ((breakdown[key] / currentValue) * 100).toFixed(1) : 0;
    return acc;
  }, {});
};

// Calculate Sharpe Ratio (risk-adjusted return)
export const calculateSharpeRatio = (returns, riskFreeRate = 0.06) => {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  const annualReturn = mean * 252; // 252 trading days
  const annualStdDev = stdDev * Math.sqrt(252);

  return (annualReturn - riskFreeRate) / annualStdDev;
};

// Calculate Volatility
export const calculateVolatility = (returns) => {
  if (returns.length === 0) return 0;

  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);

  return (stdDev * Math.sqrt(252)).toFixed(4); // Annualized
};

// Tax loss harvesting suggestions
export const getTaxLossHarvestingOpportunities = (portfolio) => {
  const opportunities = [];

  if (portfolio.stocks) {
    portfolio.stocks.forEach(stock => {
      const loss = (stock.quantity * stock.buy_price) - (stock.quantity * stock.current_price);
      if (loss > 0) {
        opportunities.push({
          type: 'stock',
          asset: stock.symbol,
          loss: Math.round(loss),
          recommendation: `Consider selling to harvest ₹${Math.round(loss)} loss`
        });
      }
    });
  }

  return opportunities;
};

// Rebalancing suggestions
export const getRebalancingAdvice = (portfolio, targetAllocation) => {
  const current = calculateAllocation(portfolio);
  const stats = calculatePortfolioStats(portfolio);

  const advice = [];

  Object.keys(targetAllocation).forEach(asset => {
    const target = targetAllocation[asset];
    const curr = parseFloat(current[asset]) || 0;
    const diff = curr - target;

    if (Math.abs(diff) > 5) { // More than 5% deviation
      const amount = (Math.abs(diff) / 100) * stats.currentValue;
      advice.push({
        asset,
        current: curr,
        target,
        action: diff > 0 ? 'REDUCE' : 'INCREASE',
        amount: Math.round(amount),
        message: diff > 0
          ? `Sell ₹${Math.round(amount)} in ${asset}`
          : `Buy ₹${Math.round(amount)} in ${asset}`
      });
    }
  });

  return advice;
};

// Groups identical holdings (e.g. same stock bought on different dates) for display
export const groupHoldingsForDisplay = (holdingsArray, assetType) => {
  if (!holdingsArray || !Array.isArray(holdingsArray)) return [];
  const grouped = {};

  holdingsArray.forEach(h => {
    // Unique identifier fallback mapping
    const uniqueKey = h.symbol || h.scheme || h.name;
    const key = `${assetType}_${uniqueKey}`;

    if (!grouped[key]) {
      grouped[key] = { ...h };
    } else {
      // Dynamic fields to handle both Stocks (quantity/buy_price) and MF (units/buy_nav)
      const qtyField = h.units !== undefined ? 'units' : 'quantity';
      const buyPriceField = h.buy_nav !== undefined ? 'buy_nav' : 'buy_price';
      const currentPriceField = h.current_nav !== undefined ? 'current_nav' : 'current_price';

      const currentQty = grouped[key][qtyField] || 0;
      const newQty = h[qtyField] || 0;
      const currentBuyPrice = grouped[key][buyPriceField] || 0;
      const newBuyPrice = h[buyPriceField] || 0;

      // Calculate weighted average buy price
      const totalCost = (currentQty * currentBuyPrice) + (newQty * newBuyPrice);
      const totalUnits = currentQty + newQty;

      grouped[key][qtyField] = totalUnits;
      grouped[key][buyPriceField] = totalUnits > 0 ? (totalCost / totalUnits) : 0;

      // Update with the most recent current_price/nav if available
      if (h[currentPriceField]) {
        grouped[key][currentPriceField] = h[currentPriceField];
      }
    }
  });

  return Object.values(grouped);
};