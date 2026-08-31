export const calculateAssetCurrentValue = (h, type) => {
  const today = new Date();

  if (type === 'bonds') {
    const principal = h.quantity || 0;
    if (h.current_price) return h.current_price;
    if (!h.purchase_date) return principal;

    const days = Math.max(0, (today - new Date(h.purchase_date)) / (1000 * 60 * 60 * 24));
    const rate = h.interest_rate || h.coupon_rate || 0;
    return principal + (principal * (rate / 100) * (days / 365));
  }

  if (type === 'loans') {
    const principal = h.quantity || 0;
    if (!h.purchase_date) return principal;

    const days = Math.max(0, (today - new Date(h.purchase_date)) / (1000 * 60 * 60 * 24));
    const isFixed = h.payout_frequency?.includes('Fixed') || h.payout_frequency?.includes('EMI');

    if (isFixed && h.payout_amount) {
      const monthsElapsed = Math.floor(days / (365.25 / 12));
      return principal + (monthsElapsed * h.payout_amount);
    } else {
      const rate = h.interest_rate || h.buy_price || 0;
      return principal + (principal * (rate / 100) * (days / 365));
    }
  }
  return 0;
};

// Generate history for fixed payouts
export const generatePayoutHistory = (h) => {
  if (!h.purchase_date || !h.payout_amount) return [];

  const isFixed = h.payout_frequency?.includes('Fixed') || h.payout_frequency?.includes('EMI');
  if (!isFixed) return [];

  const history = [];
  const startDate = new Date(h.purchase_date);
  const today = new Date();

  let currentDate = new Date(startDate);
  currentDate.setMonth(currentDate.getMonth() + 1);

  while (currentDate <= today) {
    history.push({
      date: currentDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      amount: h.payout_amount
    });
    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return history.reverse(); // Show latest first
};

export const calculatePortfolioStats = (portfolio) => {
  let invested = 0, currentValue = 0;

  if (portfolio.stocks) portfolio.stocks.forEach(s => { invested += s.quantity * s.buy_price; currentValue += s.quantity * (s.current_price || s.buy_price); });
  if (portfolio.mf) portfolio.mf.forEach(m => { invested += m.units * m.buy_nav; currentValue += m.units * (m.current_nav || m.buy_nav); });
  if (portfolio.bonds) portfolio.bonds.forEach(b => { invested += b.quantity || 0; currentValue += calculateAssetCurrentValue(b, 'bonds'); });
  if (portfolio.loans) portfolio.loans.forEach(l => { invested += l.quantity || 0; currentValue += calculateAssetCurrentValue(l, 'loans'); });
  if (portfolio.crypto) portfolio.crypto.forEach(c => { invested += (c.quantity || 0) * (c.buy_price || 0); currentValue += (c.quantity || 0) * (c.current_price || c.buy_price || 0); });
  if (portfolio.gold) portfolio.gold.forEach(g => { invested += (g.quantity || 0) * (g.buy_price || 0); currentValue += (g.quantity || 0) * (g.current_price || g.buy_price || 0); });
  if (portfolio.properties) portfolio.properties.forEach(p => { invested += p.quantity; currentValue += p.buy_price; });
  if (portfolio.fds) portfolio.fds.forEach(f => { invested += f.quantity; currentValue += f.quantity; });

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
      bonds: portfolio.bonds ? portfolio.bonds.reduce((sum, b) => sum + calculateAssetCurrentValue(b, 'bonds'), 0) : 0,
      crypto: portfolio.crypto ? portfolio.crypto.reduce((sum, c) => sum + ((c.quantity || 0) * (c.current_price || c.buy_price || 0)), 0) : 0,
      gold: portfolio.gold ? portfolio.gold.reduce((sum, g) => sum + ((g.quantity || 0) * (g.current_price || g.buy_price || 0)), 0) : 0,
      properties: portfolio.properties ? portfolio.properties.reduce((sum, p) => sum + (p.buy_price || 0), 0) : 0,
      fds: portfolio.fds ? portfolio.fds.reduce((sum, f) => sum + (f.quantity || 0), 0) : 0,
      loans: portfolio.loans ? portfolio.loans.reduce((sum, l) => sum + calculateAssetCurrentValue(l, 'loans'), 0) : 0
    },
    investedBreakdown: {
      stocks: portfolio.stocks ? portfolio.stocks.reduce((sum, s) => sum + ((s.quantity || 0) * (s.buy_price || 0)), 0) : 0,
      mf: portfolio.mf ? portfolio.mf.reduce((sum, m) => sum + ((m.units || 0) * (m.buy_nav || 0)), 0) : 0,
      bonds: portfolio.bonds ? portfolio.bonds.reduce((sum, b) => sum + (b.quantity || 0), 0) : 0,
      crypto: portfolio.crypto ? portfolio.crypto.reduce((sum, c) => sum + ((c.quantity || 0) * (c.buy_price || 0)), 0) : 0,
      gold: portfolio.gold ? portfolio.gold.reduce((sum, g) => sum + ((g.quantity || 0) * (g.buy_price || 0)), 0) : 0,
      properties: portfolio.properties ? portfolio.properties.reduce((sum, p) => sum + (p.quantity || 0), 0) : 0,
      fds: portfolio.fds ? portfolio.fds.reduce((sum, f) => sum + (f.quantity || 0), 0) : 0,
      loans: portfolio.loans ? portfolio.loans.reduce((sum, l) => sum + (l.quantity || 0), 0) : 0
    }
  };
};

export const calculateAllocation = (portfolio) => {
  const stats = calculatePortfolioStats(portfolio);
  const { breakdown, currentValue } = stats;
  return Object.keys(breakdown).reduce((acc, key) => {
    acc[key] = currentValue > 0 ? ((breakdown[key] / currentValue) * 100).toFixed(1) : 0;
    return acc;
  }, {});
};

export const calculateSharpeRatio = (returns, riskFreeRate = 0.06) => {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  return ((mean * 252) - riskFreeRate) / (stdDev * Math.sqrt(252));
};

export const calculateVolatility = (returns) => {
  if (returns.length === 0) return 0;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returns.length;
  return (Math.sqrt(variance) * Math.sqrt(252)).toFixed(4);
};

export const getTaxLossHarvestingOpportunities = (portfolio) => {
  const opportunities = [];
  if (portfolio.stocks) {
    portfolio.stocks.forEach(stock => {
      const loss = (stock.quantity * stock.buy_price) - (stock.quantity * stock.current_price);
      if (loss > 0) opportunities.push({ type: 'stock', asset: stock.symbol, loss: Math.round(loss), recommendation: `Consider selling to harvest ₹${Math.round(loss)} loss` });
    });
  }
  return opportunities;
};

export const getRebalancingAdvice = (portfolio, targetAllocation) => {
  const current = calculateAllocation(portfolio);
  const stats = calculatePortfolioStats(portfolio);
  const advice = [];
  Object.keys(targetAllocation).forEach(asset => {
    const target = targetAllocation[asset];
    const curr = parseFloat(current[asset]) || 0;
    const diff = curr - target;
    if (Math.abs(diff) > 5) {
      const amount = (Math.abs(diff) / 100) * stats.currentValue;
      advice.push({ asset, current: curr, target, action: diff > 0 ? 'REDUCE' : 'INCREASE', amount: Math.round(amount), message: diff > 0 ? `Sell ₹${Math.round(amount)} in ${asset}` : `Buy ₹${Math.round(amount)} in ${asset}` });
    }
  });
  return advice;
};

export const groupHoldingsForDisplay = (holdingsArray, assetType) => {
  if (!holdingsArray || !Array.isArray(holdingsArray)) return [];
  const nonGroupableTypes = ['bonds', 'loans', 'fds', 'properties'];
  if (nonGroupableTypes.includes(assetType)) return holdingsArray;

  const grouped = {};
  holdingsArray.forEach(h => {
    const uniqueKey = h.symbol || h.scheme || h.name;
    const key = `${assetType}_${uniqueKey}`;
    if (!grouped[key]) {
      grouped[key] = { ...h };
    } else {
      const qtyField = h.units !== undefined ? 'units' : 'quantity';
      const buyPriceField = h.buy_nav !== undefined ? 'buy_nav' : 'buy_price';
      const currentPriceField = h.current_nav !== undefined ? 'current_nav' : 'current_price';
      const currentQty = grouped[key][qtyField] || 0;
      const newQty = h[qtyField] || 0;
      const currentBuyPrice = grouped[key][buyPriceField] || 0;
      const newBuyPrice = h[buyPriceField] || 0;
      const totalCost = (currentQty * currentBuyPrice) + (newQty * newBuyPrice);
      const totalUnits = currentQty + newQty;

      grouped[key][qtyField] = totalUnits;
      grouped[key][buyPriceField] = totalUnits > 0 ? (totalCost / totalUnits) : 0;
      if (h[currentPriceField]) grouped[key][currentPriceField] = h[currentPriceField];
    }
  });
  return Object.values(grouped);
};