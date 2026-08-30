import { useState } from 'react';
import { PortfolioGrowthChart, AssetAllocationChart, CategoryPerformanceChart } from './Charts';
import { AdvancedAnalytics } from './Analytics';

export default function AnalyticsPage({ portfolio, stats, isPremium = true }) {
  const [timePeriod, setTimePeriod] = useState('1y'); // 1m, 3m, 6m, 1y, all

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">
            Portfolio Analytics
          </h2>
          <p className="text-on-surface-variant">
            Deep dive into your portfolio performance and risk metrics
          </p>
        </div>

        {/* Time Period Selector */}
        <div className="flex gap-2 flex-wrap">
          {[
            { value: '1m', label: '1 Month' },
            { value: '3m', label: '3 Months' },
            { value: '6m', label: '6 Months' },
            { value: '1y', label: '1 Year' },
            { value: 'all', label: 'All Time' }
          ].map(period => (
            <button
              key={period.value}
              onClick={() => setTimePeriod(period.value)}
              className={`px-4 py-2 rounded-lg font-label-sm transition-all ${
                timePeriod === period.value
                  ? 'bg-primary text-on-primary'
                  : 'bg-white/10 text-on-surface-variant hover:bg-white/20'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-6">
        <h3 className="font-headline-md text-headline-md text-on-surface mt-8">
          Portfolio Visualization
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <PortfolioGrowthChart portfolio={portfolio} stats={stats} />
          <AssetAllocationChart portfolio={portfolio} stats={stats} />
        </div>

        <CategoryPerformanceChart portfolio={portfolio} stats={stats} />
      </div>

      {/* Advanced Analytics Section */}
      <div className="space-y-6">
        <h3 className="font-headline-md text-headline-md text-on-surface mt-12">
          Advanced Metrics
        </h3>

        {isPremium ? (
          <AdvancedAnalytics portfolio={portfolio} stats={stats} isPremium={true} />
        ) : (
          <div className="glass-panel rounded-xl p-8 text-center" style={{
            background: 'rgba(31,31,41,0.4)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            borderLeft: '1px solid rgba(255,255,255,0.1)'
          }}>
            <p className="material-symbols-outlined text-5xl text-primary mb-4" style={{ fontSize: '3rem' }}>
              lock
            </p>
            <h3 className="font-headline-lg text-headline-lg text-on-surface mb-2">
              Unlock Advanced Analytics
            </h3>
            <p className="text-on-surface-variant mb-6 max-w-md mx-auto">
              Get Sharpe Ratio, Volatility Analysis, Tax Loss Harvesting Suggestions, and Portfolio Health Scores with Premium.
            </p>
            <button className="px-8 py-3 rounded-lg bg-primary text-on-primary font-bold hover:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all inline-block">
              Upgrade to Premium - ₹100/Month
            </button>
          </div>
        )}
      </div>

      {/* Performance Summary */}
      <div className="glass-panel rounded-xl p-6" style={{
        background: 'rgba(31,31,41,0.4)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        borderLeft: '1px solid rgba(255,255,255,0.1)'
      }}>
        <h3 className="font-headline-lg text-headline-lg text-on-surface mb-6">
          Performance Summary ({timePeriod === '1m' ? 'Last Month' : timePeriod === '3m' ? 'Last 3 Months' : timePeriod === '6m' ? 'Last 6 Months' : timePeriod === '1y' ? 'Last Year' : 'All Time'})
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <p className="text-on-surface-variant text-sm mb-2">Total Return</p>
            <p className="font-display-lg text-display-lg text-success mb-1">
              {stats.pctReturn}%
            </p>
            <p className="text-on-surface-variant text-xs">
              {stats.pl >= 0 ? '📈' : '📉'} {stats.pl >= 0 ? 'Gain' : 'Loss'}: ₹{Math.abs(Math.round(stats.pl)).toLocaleString('en-IN')}
            </p>
          </div>

          <div>
            <p className="text-on-surface-variant text-sm mb-2">Current Value</p>
            <p className="font-display-lg text-display-lg text-primary mb-1">
              ₹{stats.currentValue.toLocaleString('en-IN')}
            </p>
            <p className="text-on-surface-variant text-xs">
              From ₹{stats.invested.toLocaleString('en-IN')} invested
            </p>
          </div>

          <div>
            <p className="text-on-surface-variant text-sm mb-2">Holdings</p>
            <p className="font-display-lg text-display-lg text-secondary mb-1">
              {Object.values(portfolio).flat().length}
            </p>
            <p className="text-on-surface-variant text-xs">
              Across 8 asset types
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
