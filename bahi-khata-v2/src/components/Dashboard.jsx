import { memo } from 'react';
import { formatCurrency, formatPercent, getColorByValue } from '../utils/formatters';
import { PortfolioGrowthChart, AssetAllocationChart, CategoryPerformanceChart } from './Charts';
import { AdvancedAnalytics } from './Analytics';
import { SkeletonDashboard, SkeletonChart } from './Skeleton';
import { EmptyDashboard } from './EmptyState';
import { usePortfolioStats, useCategoryPerformance } from '../utils/performance';

function DashboardContent({ portfolio, stats, isLoading, onSelectTab }) {
  const portfolioStats = usePortfolioStats(portfolio);
  const categoryPerformance = useCategoryPerformance(portfolio);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  const hasHoldings = Object.values(portfolio || {}).some(
    arr => Array.isArray(arr) && arr.length > 0
  );

  if (!hasHoldings) {
    return <EmptyDashboard />;
  }
  return (
    <div className="space-y-8">
      {/* Summary Strip */}
      <div className="card p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sticky top-20 z-40">
        <div>
          <p className="text-on-surface-variant mb-1 uppercase tracking-wider text-xs">
            Total Net P/L
          </p>
          <div className="flex items-baseline gap-4">
            <h2 className={`font-display-lg text-display-lg ${stats.pl >= 0 ? 'text-success' : 'text-error'}`}>
              {formatCurrency(stats.pl)}
            </h2>
            <span className={`font-data-lg text-data-lg ${stats.pl >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} px-2 py-1 rounded`}>
              {formatPercent(stats.pctReturn)}
            </span>
          </div>
        </div>
        <div className="flex gap-8 w-full md:w-auto border-t border-outline-variant md:border-t-0 pt-4 md:pt-0">
          <div>
            <p className="text-on-surface-variant mb-1 text-sm">Invested</p>
            <p className="font-data-lg text-data-lg text-on-surface">{formatCurrency(stats.invested)}</p>
          </div>
          <div className="w-px bg-outline-variant h-10 self-center"></div>
          <div>
            <p className="text-on-surface-variant mb-1 text-sm">Current Value</p>
            <p className="font-data-lg text-data-lg text-on-surface">{formatCurrency(stats.currentValue)}</p>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Stocks', icon: 'show_chart', color: 'text-primary', data: 'stocks' },
          { label: 'Mutual Funds', icon: 'account_balance', color: 'text-secondary', data: 'mf' },
          { label: 'Bonds', icon: 'payments', color: 'text-tertiary', data: 'bonds' },
          { label: 'Loans', icon: 'real_estate_agent', color: 'text-error', data: 'loans' },
          { label: 'Crypto', icon: 'currency_bitcoin', color: 'text-yellow-500', data: 'crypto' },
          { label: 'Gold', icon: 'diamond', color: 'text-amber-500', data: 'gold' },
          { label: 'Properties', icon: 'apartment', color: 'text-green-500', data: 'properties' },
          { label: 'Fixed Deposits', icon: 'savings', color: 'text-blue-500', data: 'fds' }
        ].map((cat) => {
          // `data` is already the portfolio key. The old code appended an 's'
          // and read portfolio['stockss'] / portfolio['mfs'], so every card
          // showed zero however much was actually held.
          const holdings = portfolio[cat.data] || [];
          let invested = 0, current = 0;

          holdings.forEach(h => {
            if (cat.data === 'stocks') {
              invested += (h.quantity || 0) * (h.buy_price || 0);
              current += (h.quantity || 0) * (h.current_price || h.buy_price || 0);
            } else if (cat.data === 'mf') {
              invested += (h.units || 0) * (h.buy_nav || 0);
              current += (h.units || 0) * (h.current_nav || h.buy_nav || 0);
            } else if (cat.data === 'bonds' || cat.data === 'loans' || cat.data === 'fds') {
              invested += h.quantity || 0;
              current += h.quantity || 0;
            } else if (cat.data === 'crypto') {
              invested += (h.quantity || 0) * (h.buy_price || 0);
              current += (h.quantity || 0) * (h.current_price || h.buy_price || 0);
            } else if (cat.data === 'gold') {
              invested += (h.quantity || 0) * (h.buy_price || 0);
              current += (h.quantity || 0) * (h.current_price || h.buy_price || 0);
            } else if (cat.data === 'properties') {
              invested += h.quantity || 0;
              current += h.buy_price || 0;
            }
          });

          const pl = current - invested;
          const pct = invested > 0 ? ((pl / invested) * 100).toFixed(1) : 0;

          return (
            <button
              key={cat.data}
              type="button"
              onClick={() => onSelectTab && onSelectTab(cat.data)}
              className="card p-5 flex flex-col gap-3 text-left hover:ring-2 hover:ring-primary/40">
              <div className="flex justify-between items-center">
                <span className={`material-symbols-outlined text-3xl ${cat.color}`}>
                  {cat.icon}
                </span>
                <span className={`text-xs ${pct >= 0 ? 'text-success bg-success/10' : 'text-error bg-error/10'} px-2 py-0.5 rounded-full`}>
                  {pct >= 0 ? '+' : ''}{pct}%
                </span>
              </div>
              <div>
                <p className="text-on-surface-variant text-sm">{cat.label}</p>
                <p className="font-data-lg text-data-lg text-on-surface">{formatCurrency(current)}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mt-8">
          Portfolio Insights
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioGrowthChart portfolio={portfolio} stats={stats} />
          <AssetAllocationChart portfolio={portfolio} stats={stats} />
        </div>

        <CategoryPerformanceChart portfolio={portfolio} stats={stats} />
      </div>

      {/* Advanced Analytics */}
      <div className="mt-12">
        <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
          Advanced Analytics
        </h2>
        <AdvancedAnalytics portfolio={portfolio} stats={stats} />
      </div>
    </div>
  );
}

const Dashboard = memo(DashboardContent);

Dashboard.displayName = 'Dashboard';

export default Dashboard;
