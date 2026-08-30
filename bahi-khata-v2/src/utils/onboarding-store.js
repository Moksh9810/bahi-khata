// Simple onboarding state management
export function getOnboardingState() {
  const stored = localStorage.getItem('bahi-khata-onboarded');
  return stored ? JSON.parse(stored) : {
    completed: false,
    portfolioName: '',
    categories: []
  };
}

export function setOnboardingComplete(data) {
  const state = {
    completed: true,
    portfolioName: data.portfolioName || 'My Portfolio',
    categories: data.categories || [],
    completedAt: new Date().toISOString()
  };
  localStorage.setItem('bahi-khata-onboarded', JSON.stringify(state));
  return state;
}

export function resetOnboarding() {
  localStorage.removeItem('bahi-khata-onboarded');
}
