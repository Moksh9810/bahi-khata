import { calculateSharpeRatio, calculateVolatility, getTaxLossHarvestingOpportunities, getRebalancingAdvice } from '../utils/calculations';
import { formatCurrency } from '../utils/formatters';

export function AdvancedAnalytics({ portfolio, stats, isPremium = true }) {
  // Generate mock daily returns for demonstration
  const generateReturns = () => {
    const returns = [];
    for (let i = 0; i < 30; i++) {
      returns.push((Math.random() - 0.48) * 0.02); // Random returns between -1% and 1%
    }
    return returns;
  };

  const returns = generateReturns();
  const sharpeRatio = calculateSharpeRatio(returns);
  const volatility = calculateVolatility(returns);
  const taxOpportunities = getTaxLossHarvestingOpportunities(portfolio);

  return (
    <div className="space-y-6">
      {/* Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card p-6">
          <p className="text-on-surface-variant text-sm mb-2">Sharpe Ratio</p>
          <h3 className="font-display-lg text-display-lg text-primary mb-2">
            {sharpeRatio.toFixed(2)}
          </h3>
          <p className="text-on-surface-variant text-xs">
            {sharpeRatio > 1 ? '✅ Excellent risk-adjusted returns' : sharpeRatio > 0.5 ? '⚠️ Good risk profile' : '⚠️ Consider diversification'}
          </p>
        </div>

        <div className="card p-6">
          <p className="text-on-surface-variant text-sm mb-2">Volatility (Annualized)</p>
          <h3 className="font-display-lg text-display-lg text-tertiary mb-2">
            {(volatility * 100).toFixed(2)}%
          </h3>
          <p className="text-on-surface-variant text-xs">
            {volatility < 0.15 ? '✅ Low volatility' : volatility < 0.25 ? '⚠️ Moderate volatility' : '🔴 High volatility'}
          </p>
        </div>
      </div>

      {/* Tax Loss Harvesting Opportunities */}
      {taxOpportunities.length > 0 && (
        <div className="card p-6">
          <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
            Tax Loss Harvesting Opportunities
          </h3>
          <div className="space-y-3">
            {taxOpportunities.map((opp, idx) => (
              <div key={idx} className="border-l-4 border-error pl-4 py-2">
                <p className="font-label-sm text-on-surface mb-1">
                  {opp.asset} ({opp.type})
                </p>
                <p className="text-on-surface-variant text-sm">
                  Loss: {formatCurrency(opp.loss)}
                </p>
                <p className="text-error text-xs mt-1">
                  💡 {opp.recommendation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Portfolio Health */}
      <div className="card p-6">
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
          Portfolio Health Score
        </h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between mb-2">
              <span className="text-on-surface-variant text-sm">Diversification</span>
              <span className="text-on-surface font-label-sm">75%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-on-surface-variant text-sm">Balance</span>
              <span className="text-on-surface font-label-sm">82%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div className="bg-secondary h-2 rounded-full" style={{ width: '82%' }}></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-on-surface-variant text-sm">Risk Management</span>
              <span className="text-on-surface font-label-sm">65%</span>
            </div>
            <div className="w-full bg-surface-container rounded-full h-2">
              <div className="bg-tertiary h-2 rounded-full" style={{ width: '65%' }}></div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-outline-variant">
          <p className="text-on-surface-variant text-sm">
            💡 <strong>Recommendation:</strong> Your portfolio is well-diversified with good balance across asset classes. Consider reducing concentration in high-volatility assets.
          </p>
        </div>
      </div>

      {/* Rebalancing Suggestions */}
      <div className="card p-6">
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
          Suggested Allocation (60-30-10 Rule)
        </h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="border border-outline-variant rounded-lg p-4 text-center">
            <p className="text-on-surface-variant text-xs mb-2">Growth</p>
            <p className="font-display-md text-primary">60%</p>
            <p className="text-on-surface-variant text-xs mt-2">Stocks, Crypto, MF</p>
          </div>
          <div className="border border-outline-variant rounded-lg p-4 text-center">
            <p className="text-on-surface-variant text-xs mb-2">Balance</p>
            <p className="font-display-md text-secondary">30%</p>
            <p className="text-on-surface-variant text-xs mt-2">Bonds, FDs, Gold</p>
          </div>
          <div className="border border-outline-variant rounded-lg p-4 text-center">
            <p className="text-on-surface-variant text-xs mb-2">Reserve</p>
            <p className="font-display-md text-tertiary">10%</p>
            <p className="text-on-surface-variant text-xs mt-2">Cash, Loans</p>
          </div>
        </div>
        <button className="w-full mt-4 btn-primary w-full py-3">
          Create Rebalancing Plan
        </button>
      </div>
    </div>
  );
}

export function AnalyticsTab() {
  return (
    <div className="card p-6">
      <h2 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Advanced Analytics
      </h2>
      <p className="text-on-surface-variant mb-4">
        Unlock powerful insights about your portfolio with premium analytics.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="border border-primary rounded-lg p-4">
          <p className="font-label-sm text-primary mb-2">📊 Sharpe Ratio</p>
          <p className="text-on-surface-variant text-sm">Risk-adjusted return analysis</p>
        </div>
        <div className="border border-secondary rounded-lg p-4">
          <p className="font-label-sm text-secondary mb-2">📈 Volatility</p>
          <p className="text-on-surface-variant text-sm">Portfolio fluctuation tracking</p>
        </div>
        <div className="border border-tertiary rounded-lg p-4">
          <p className="font-label-sm text-tertiary mb-2">💰 Tax Optimization</p>
          <p className="text-on-surface-variant text-sm">Tax loss harvesting suggestions</p>
        </div>
      </div>
      <button className="w-full btn-primary w-full py-3">
        Upgrade to Premium
      </button>
    </div>
  );
}
