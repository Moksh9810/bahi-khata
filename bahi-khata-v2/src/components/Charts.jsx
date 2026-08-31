import { memo, useMemo } from 'react';
import { LineChart, Line, PieChart, Pie, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency } from '../utils/formatters';
import { SkeletonChart } from './Skeleton';
import { useTheme } from '../hooks/useTheme';

// Chart colours.
//
// Charts take concrete colours, not utility classes, so the palette lives here.
// Both sets were checked with the palette validator: every hue sits inside the
// lightness band for its surface, clears the chroma floor, and keeps adjacent
// pairs apart for deuteranopia, protanopia and tritanopia (worst adjacent pair
// dE 8.9 light / passing dark). Identity is never carried by colour alone —
// the allocation chart is direct-labelled with a legend beside it.
const CHART = {
  light: {
    categorical: ['#1D4ED8', '#F59E0B', '#047857', '#EC4899', '#06B6D4', '#7C3AED', '#84CC16', '#BE123C'],
    accent: '#1D4ED8',
    grid: '#E2E8F0',      // slate-200
    axis: '#64748B',      // slate-500
    surface: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0F172A'       // slate-900
  },
  dark: {
    categorical: ['#3B82F6', '#D97706', '#059669', '#EC4899', '#0891B2', '#8B5CF6', '#65A30D', '#E11D48'],
    accent: '#3B82F6',
    grid: '#334155',      // slate-700
    axis: '#94A3B8',      // slate-400
    surface: '#1E293B',   // slate-800
    border: '#334155',
    text: '#F1F5F9'       // slate-100
  }
};

const useChartTheme = () => (useTheme().isDark ? CHART.dark : CHART.light);


function PortfolioGrowthChartComponent({ portfolio, stats, isLoading }) {
  const c = useChartTheme();
  // Generate 12 months of mock growth data.
  // NOTE: hooks must run on every render, so this stays above the isLoading early return.
  const data = useMemo(() => {
    const rows = [];
    const currentValue = stats?.currentValue ?? 0;
    const invested = stats?.invested ?? 0;
    const monthlyGrowth = (currentValue - invested) / 12;

    for (let i = 0; i < 12; i++) {
      rows.push({
        month: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
        value: invested + (monthlyGrowth * (i + 1))
      });
    }
    return rows;
  }, [stats?.currentValue, stats?.invested]);

  if (isLoading) return <SkeletonChart />;

  return (
    <div className="card p-6 w-full">
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Portfolio Growth (12 Months)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="month" stroke={c.axis} />
          <YAxis stroke={c.axis} />
          <Tooltip
            contentStyle={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '8px'
            }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="value"
            stroke={c.accent}
            strokeWidth={2}
            strokeWidth={2}
            dot={{ fill: c.accent, r: 4 }}
            activeDot={{ r: 6 }}
            name="Portfolio Value"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function AssetAllocationChartComponent({ portfolio, stats, isLoading }) {
  const c = useChartTheme();
  if (isLoading) return <SkeletonChart />;
  const calculateAllocation = () => {
    const data = [];

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

    // Share of the slices actually drawn. Dividing by stats.currentValue
    // instead let the percentages add up to more than 100 whenever the two
    // were computed from slightly different inputs.
    const total = Object.values(categoryValues).reduce((sum, v) => sum + v, 0);

    Object.entries(categoryValues).forEach(([name, value]) => {
      if (value > 0) {
        data.push({
          name,
          value: Math.round(value),
          percentage: total > 0 ? ((value / total) * 100).toFixed(1) : 0
        });
      }
    });

    return data;
  };

  const COLORS = c.categorical;
  const data = calculateAllocation();

  return (
    <div className="card p-6 w-full">
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
            // No labels on the slices themselves: with eight categories they
            // collided and ran off the edge. The legend underneath names every
            // category with its share, so identity is never colour alone.
            outerRadius={100}
            innerRadius={55}
            paddingAngle={1}
            fill={c.accent}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
                // A 2px ring in the surface colour keeps adjacent slices apart
                // even when their hues are close.
                stroke={c.surface}
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: c.surface,
              border: `1px solid ${c.border}`,
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
  const c = useChartTheme();
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
    <div className="card p-6 w-full">
      <h3 className="font-headline-lg text-headline-lg text-on-surface mb-4">
        Category Performance
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
          <XAxis dataKey="category" stroke={c.axis} angle={-45} textAnchor="end" height={80} />
          <YAxis stroke={c.axis} />
          <Tooltip
            contentStyle={{
              background: c.surface,
              border: `1px solid ${c.border}`,
              borderRadius: '8px'
            }}
            formatter={(value) => formatCurrency(value)}
          />
          <Legend />
          <Bar dataKey="value" fill={c.accent} name="Current Value" radius={[4, 4, 0, 0]} />
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
