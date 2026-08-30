import { memo, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { SkeletonChart } from './Skeleton';

function PortfolioGrowthChartComponent({ portfolio, stats, isLoading }) {
  if (isLoading) return <SkeletonChart />;
  // Generate 12 months of mock growth data
  const generateGrowthData = () => {
    const data = [];
    const currentValue = stats.currentValue;
    const invested = stats.invested;
    const monthlyGrowth = (currentValue - invested) / 12;

    for (let i = 0; i < 12; i++) {
      data.push({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        value: invested + (monthlyGrowth * (i + 1))
      });
    }
    return data;
  };

  const data = useMemo(() => generateGrowthData(), [stats.currentValue, stats.invested]);

  return (
    <div className="glass-panel rounded-xl p-6 w-full" style={{
      background: 'rgba(31,31,41,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderLeft: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Portfolio Growth (12 Months)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              background: 'rgba(31,31,41,0.95)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#D0BCFF"
            strokeWidth={2}
            dot={{ fill: '#D0BCFF', r: 4 }}
            activeDot={{ r: 6 }}
            name="Portfolio Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AssetAllocationChartComponent({ portfolio, stats, isLoading }) {
  if (isLoading) return <SkeletonChart />;
  const calculateAllocation = () => {
    const data = [];
    const { currentValue } = stats;

    const categoryValues = {
      Stocks: portfolio.stocks?.reduce((sum, s) => sum + ((s.quantity || 0) * (s.current_price || s.buy_price || 0)), 0) || 0,
      'Mutual Funds': portfolio.mf?.reduce((sum, m) => sum + ((m.units || 0) * (m.current_nav || m.buy_nav || 0)), 0) || 0,
      Bonds: portfolio.bonds?.reduce((sum, b) => sum + (b.quantity || 0), 0) || 0,
      Crypto: portfolio.crypto?.reduce((sum, c) => sum + ((c.quantity || 0) * (c.current_price || c.buy_price || 0)), 0) || 0,
      Gold: portfolio.gold?.reduce((sum, g) => sum + ((g.quantity || 0) * (g.current_price || g.buy_price || 0)), 0) || 0,
      Properties: portfolio.properties?.reduce((sum, p) => sum + (p.buy_price || 0), 0) || 0,
      'Fixed Deposits': portfolio.fds?.reduce((sum, f) => sum + (f.quantity || 0), 0) || 0,
      Loans: portfolio.loans?.reduce((sum, l) => sum + (l.quantity || 0), 0) || 0
    };

    Object.entries(categoryValues).forEach(([name, value]) => {
      if (value > 0) {
        data.push({
          name,
          value: Math.round(value),
          percentage: currentValue > 0 ? ((value / currentValue) * 100).toFixed(1) : 0
        });
      }
    });

    return data;
  };

  const COLORS = ['#D0BCFF', '#4ADE80', '#60A5FA', '#FBBF24', '#F87171', '#A78BFA', '#34D399', '#FB923C'];
  const data = calculateAllocation();

  return (
    <div className="glass-panel rounded-xl p-6 w-full" style={{
      background: 'rgba(31,31,41,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderLeft: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Asset Allocation
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} ${percentage}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: 'rgba(31,31,41,0.95)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            formatter={(value) => formatCurrency(value)}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2">
        {data.map((item, index) => (
          <div key={item.name} className="text-xs">
            <div className="flex items-center gap-2 mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              ></div>
              <span className="text-on-surface-variant">{item.name}</span>
            </div>
            <p className="text-on-surface font-data-lg">{item.percentage}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoryPerformanceChartComponent({ portfolio, stats, isLoading }) {
  if (isLoading) return <SkeletonChart />;
  const calculateCategoryPerformance = () => {
    const data = [];

    const categories = [
      { key: 'stocks', label: 'Stocks' },
      { key: 'mf', label: 'Mutual Funds' },
      { key: 'bonds', label: 'Bonds' },
      { key: 'crypto', label: 'Crypto' },
      { key: 'gold', label: 'Gold' },
      { key: 'properties', label: 'Properties' },
      { key: 'fds', label: 'FDs' },
      { key: 'loans', label: 'Loans' }
    ];

    categories.forEach(cat => {
      let invested = 0, current = 0;

      if (cat.key === 'stocks') {
        portfolio.stocks?.forEach(s => {
          invested += (s.quantity || 0) * (s.buy_price || 0);
          current += (s.quantity || 0) * (s.current_price || s.buy_price || 0);
        });
      } else if (cat.key === 'mf') {
        portfolio.mf?.forEach(m => {
          invested += (m.units || 0) * (m.buy_nav || 0);
          current += (m.units || 0) * (m.current_nav || m.buy_nav || 0);
        });
      } else if (cat.key === 'bonds' || cat.key === 'fds') {
        const arr = portfolio[cat.key] || [];
        arr.forEach(item => {
          invested += item.quantity || 0;
          current += item.quantity || 0;
        });
      } else if (cat.key === 'crypto' || cat.key === 'gold') {
        const arr = portfolio[cat.key] || [];
        arr.forEach(item => {
          invested += (item.quantity || 0) * (item.buy_price || 0);
          current += (item.quantity || 0) * (item.current_price || item.buy_price || 0);
        });
      } else if (cat.key === 'properties') {
        portfolio.properties?.forEach(p => {
          invested += p.quantity || 0;
          current += p.buy_price || 0;
        });
      } else if (cat.key === 'loans') {
        portfolio.loans?.forEach(l => {
          invested += l.quantity || 0;
          current += l.quantity || 0;
        });
      }

      if (invested > 0) {
        const pl = current - invested;
        const pct = ((pl / invested) * 100).toFixed(1);
        data.push({
          category: cat.label,
          value: Math.round(current),
          pl: Math.round(pl),
          pct: parseFloat(pct)
        });
      }
    });

    return data;
  };

  const data = calculateCategoryPerformance();

  return (
    <div className="glass-panel rounded-xl p-6 w-full" style={{
      background: 'rgba(31,31,41,0.4)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(255,255,255,0.1)',
      borderLeft: '1px solid rgba(255,255,255,0.1)'
    }}>
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Category Performance
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="category" stroke="rgba(255,255,255,0.5)" angle={-45} textAnchor="end" height={80} />
          <YAxis stroke="rgba(255,255,255,0.5)" />
          <Tooltip
            contentStyle={{
              background: 'rgba(31,31,41,0.95)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Bar dataKey="value" fill="#D0BCFF" name="Current Value" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Export memoized components to prevent unnecessary re-renders
export const PortfolioGrowthChart = memo(PortfolioGrowthChartComponent);
export const AssetAllocationChart = memo(AssetAllocationChartComponent);
export const CategoryPerformanceChart = memo(CategoryPerformanceChartComponent);

PortfolioGrowthChart.displayName = 'PortfolioGrowthChart';
AssetAllocationChart.displayName = 'AssetAllocationChart';
CategoryPerformanceChart.displayName = 'CategoryPerformanceChart';
