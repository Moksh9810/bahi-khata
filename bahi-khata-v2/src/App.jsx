import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { usePortfolio } from './hooks/usePortfolio';
import { useTheme } from './hooks/useTheme';
import AuthScreen from './components/AuthScreen';
import AppScreen from './components/AppScreen';
import Onboarding from './components/Onboarding';
import { getOnboardingState, setOnboardingComplete } from './utils/onboarding-store';
import './index.css';

export default function App() {
  const { user, loading: authLoading, signin, signup, logout } = useAuth();
  const {
    portfolio, stats, addHolding, removeHolding, updateHolding,
    refreshPrices, pricesUpdatedAt
  } = usePortfolio(user?.id);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      const onboarding = getOnboardingState();
      setShowOnboarding(!onboarding.completed);
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onSignup={signup} onSignin={signin} />;
  }

  if (showOnboarding) {
    return (
      <Onboarding
        onComplete={() => {
          setOnboardingComplete({ portfolioName: 'My Portfolio', categories: [] });
          setShowOnboarding(false);
        }}
      />
    );
  }

  return (
    <AppScreen
      user={user}
      portfolio={portfolio}
      stats={stats}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onAddHolding={addHolding}
      onRemoveHolding={removeHolding}
      onUpdateHolding={updateHolding}
      onRefreshPrices={refreshPrices}
      pricesUpdatedAt={pricesUpdatedAt}
      onLogout={logout}
    />
  );
}
