import { useState } from 'react';

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [portfolioName, setPortfolioName] = useState('');

  const steps = [
    {
      title: 'Welcome to MYWEALTH',
      description: 'Your personal investment portfolio tracker',
      icon: 'trending_up',
      content: (
        <div className="space-y-6">
          <p className="text-on-surface-variant text-lg">
            Track all your investments in one place - Stocks, Mutual Funds, Bonds, Crypto, Gold, Properties, and more.
          </p>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: 'show_chart', label: 'Real-time Analytics' },
              { icon: 'security', label: 'Secure & Private' },
              { icon: 'trending_up', label: 'Growth Tracking' },
              { icon: 'notifications', label: 'Smart Alerts' }
            ].map((item, idx) => (
              <div key={idx} className="text-center">
                <p className="text-3xl mb-2">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </p>
                <p className="text-sm text-on-surface-variant">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      title: 'What\'s Your Portfolio Name?',
      description: 'Give your portfolio a memorable name',
      icon: 'folder_special',
      content: (
        <div className="space-y-4">
          <input
            type="text"
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="e.g., My Investments, Retirement Fund"
            className="w-full px-4 py-3 rounded-lg bg-surface-container-highest text-on-surface border border-outline-variant focus:border-primary focus:outline-none transition-colors"
            autoFocus
          />
          <p className="text-sm text-on-surface-variant">
            Don't worry, you can change this anytime in settings.
          </p>
        </div>
      )
    },
    {
      title: 'Choose Your Asset Categories',
      description: 'Which of these do you invest in?',
      icon: 'category',
      content: (
        <div className="space-y-3">
          {[
            { id: 'stocks', label: 'Stocks', description: 'Individual company shares' },
            { id: 'mf', label: 'Mutual Funds', description: 'Diversified funds' },
            { id: 'crypto', label: 'Cryptocurrency', description: 'Digital assets' },
            { id: 'gold', label: 'Gold & Precious Metals', description: 'Physical or digital' },
            { id: 'bonds', label: 'Bonds & Fixed Income', description: 'Government, corporate' },
            { id: 'properties', label: 'Real Estate', description: 'Residential, commercial' }
          ].map((cat) => (
            <label key={cat.id} className="flex items-center gap-3 p-3 rounded-lg bg-surface-container-highest hover:bg-surface-container-high cursor-pointer transition-colors">
              <input type="checkbox" className="w-5 h-5 cursor-pointer" defaultChecked />
              <div>
                <p className="font-label-sm text-on-surface">{cat.label}</p>
                <p className="text-xs text-on-surface-variant">{cat.description}</p>
              </div>
            </label>
          ))}
        </div>
      )
    },
    {
      title: 'You\'re All Set! 🎉',
      description: 'Start tracking your investments',
      icon: 'check_circle',
      content: (
        <div className="space-y-6 text-center">
          <div className="inline-flex h-20 w-20 rounded-full bg-success/20 items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-success">check_circle</span>
          </div>
          <div>
            <p className="text-on-surface-variant mb-4">
              Your portfolio is ready to go. Start by adding your first investment.
            </p>
            <div className="space-y-2 text-sm text-on-surface-variant">
              <p>✓ Add holdings to each category</p>
              <p>✓ Track your portfolio growth</p>
              <p>✓ Get personalized insights</p>
            </div>
          </div>
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet"/>

      <div className="w-full max-w-md">
        {/* Progress Indicator */}
        <div className="flex gap-1 mb-8">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx <= step ? 'bg-primary' : 'bg-surface-container-high'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Icon */}
          <div className="text-center">
            <div className="text-5xl mb-4">
              <span className="material-symbols-outlined">{currentStep.icon}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div className="text-center space-y-2">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">
              {currentStep.title}
            </h1>
            <p className="text-on-surface-variant">
              {currentStep.description}
            </p>
          </div>

          {/* Step Content */}
          <div className="bg-surface-container rounded-xl p-6">
            {currentStep.content}
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 px-4 py-3 rounded-lg bg-surface-container text-on-surface font-label-sm hover:bg-surface-container-high transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                } else {
                  setStep(step + 1);
                }
              }}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-on-primary font-label-sm hover:bg-blue-700 transition-all disabled:opacity-50"
              disabled={step === 1 && !portfolioName}
            >
              {isLastStep ? 'Start Investing' : 'Next'}
            </button>
          </div>

          {/* Skip Option */}
          {step < steps.length - 1 && (
            <button
              onClick={onComplete}
              className="w-full text-on-surface-variant text-sm hover:text-on-surface transition-colors"
            >
              Skip for now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
