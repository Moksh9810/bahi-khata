import { useState } from 'react';
import Dashboard from './Dashboard';
import Portfolio from './Portfolio';
import Navigation from './Navigation';
import AnalyticsPage from './AnalyticsPage';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { useTheme } from '../hooks/useTheme';

export default function AppScreen({
  user,
  portfolio,
  stats,
  activeTab,
  setActiveTab,
  onAddHolding,
  onRemoveHolding,
  onUpdateHolding,
  onLogout
}) {
  const [navOpen, setNavOpen] = useState(false);
  const { theme, toggleTheme, isDark } = useTheme();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: 'monitoring' },
    { id: 'stocks', label: 'Stocks', icon: 'show_chart' },
    { id: 'mf', label: 'Mutual Funds', icon: 'account_balance' },
    { id: 'bonds', label: 'Bonds', icon: 'payments' },
    { id: 'loans', label: 'Loans', icon: 'real_estate_agent' },
    { id: 'crypto', label: 'Crypto', icon: 'currency_bitcoin' },
    { id: 'gold', label: 'Gold', icon: 'diamond' },
    { id: 'properties', label: 'Properties', icon: 'apartment' },
    { id: 'fds', label: 'Fixed Deposits', icon: 'savings' },
    { id: 'analytics', label: 'Analytics', icon: 'analytics' }
  ];

  return (
    <div className="min-h-screen bg-background text-on-surface">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>

      {/* HEADER */}
      <header className="fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/20 shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setNavOpen(!navOpen)}
            className="text-primary p-2 hover:bg-on-surface/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary">
            Bahi-Khata
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="text-primary p-2 hover:bg-on-surface/10 rounded-full transition-colors"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          >
            <span className="material-symbols-outlined">
              {isDark ? 'light_mode' : 'dark_mode'}
            </span>
          </button>
          <button
            onClick={onLogout}
            className="text-on-surface-variant p-2 hover:bg-on-surface/10 rounded-full transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
          </button>
        </div>
      </header>

      {/* NAVIGATION */}
      <Navigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setNavOpen(false);
        }}
        isOpen={navOpen}
        onClose={() => setNavOpen(false)}
      />

      {/* OVERLAY */}
      {navOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
          onClick={() => setNavOpen(false)}
        ></div>
      )}

      {/* MAIN CONTENT */}
      <main className="pt-20 px-5 md:ml-72 pb-24 md:px-8 max-w-7xl mx-auto flex flex-col gap-8">
        {activeTab === 'dashboard' && (
          <Dashboard portfolio={portfolio} stats={stats} />
        )}

        {['stocks', 'mf', 'bonds', 'loans', 'crypto', 'gold', 'properties', 'fds'].includes(activeTab) && (
          <Portfolio
            type={activeTab}
            holdings={
              activeTab === 'properties' || activeTab === 'fds' || activeTab === 'crypto' || activeTab === 'gold'
                ? portfolio[activeTab] || []
                : portfolio[activeTab + 's'] || []
            }
            stats={stats}
            onAdd={onAddHolding}
            onRemove={onRemoveHolding}
            onUpdate={onUpdateHolding}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage portfolio={portfolio} stats={stats} isPremium={true} />
        )}
      </main>
    </div>
  );
}
