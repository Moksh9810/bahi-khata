import { useEffect, useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { useProfile } from './hooks/useProfile';
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
    portfolio, stats, addHolding, importHoldings, removeHolding, updateHolding,
    refreshPrices, pricesUpdatedAt, loaded: portfolioLoaded
  } = usePortfolio(user?.id);
  const { role, isAdmin, isRestricted, loaded: profileLoaded } = useProfile(user?.id);
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const hasHoldings = Object.values(portfolio || {}).some(list => Array.isArray(list) && list.length > 0);

  useEffect(() => {
    // Wait for the first load to finish, otherwise an existing user would see
    // onboarding flash before their holdings arrive.
    if (!user || authLoading || !portfolioLoaded) return;

    // The "have you finished onboarding" flag lives in localStorage, which is
    // per browser. On a second device that flag is missing, so a returning user
    // was sent back through onboarding and could not see the portfolio they
    // already had. Anyone with holdings has clearly onboarded already.
    if (hasHoldings) {
      setShowOnboarding(false);
      setOnboardingComplete({ portfolioName: 'My Portfolio', categories: [] });
      return;
    }

    setShowOnboarding(!getOnboardingState().completed);
  }, [user, authLoading, portfolioLoaded, hasHoldings]);

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

  // A suspended or blocked account gets a plain message instead of the app.
  // The database enforces this too — this screen just explains what happened.
  if (profileLoaded && isRestricted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 dark">
        <div className="max-w-md text-center">
          <h1 className="font-headline-lg text-headline-lg text-on-surface mb-3">Account paused</h1>
          <p className="text-on-surface-variant mb-6">
            Your account has been put on hold by an administrator. Your holdings are safe.
            Please get in touch if you think this is a mistake.
          </p>
          <button onClick={logout} className="px-6 py-3 rounded-lg bg-primary text-on-primary font-bold">
            Log out
          </button>
        </div>
      </div>
    );
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
      onImportHoldings={importHoldings}
      onRemoveHolding={removeHolding}
      onUpdateHolding={updateHolding}
      onRefreshPrices={refreshPrices}
      pricesUpdatedAt={pricesUpdatedAt}
      isAdmin={isAdmin}
      myRole={role}
      onLogout={logout}
    />
  );
}
