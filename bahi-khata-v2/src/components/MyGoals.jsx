import { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatters';

export default function MyGoals({ stats }) {
  const [goals, setGoals] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', target_amount: '', target_year: '' });

  // Load goals from local storage on initial render
  useEffect(() => {
    const savedGoals = localStorage.getItem('mywealth_goals');
    if (savedGoals) {
      setGoals(JSON.parse(savedGoals));
    }
  }, []);

  // Save goals to local storage whenever they change
  useEffect(() => {
    localStorage.setItem('mywealth_goals', JSON.stringify(goals));
  }, [goals]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) return;

    const newGoal = {
      id: Date.now().toString(),
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      target_year: formData.target_year || new Date().getFullYear() + 5,
      icon: getIconForGoal(formData.name)
    };

    setGoals([...goals, newGoal]);
    setShowModal(false);
    setFormData({ name: '', target_amount: '', target_year: '' });
  };

  const handleDelete = (id) => {
    setGoals(goals.filter(g => g.id !== id));
  };

  const getIconForGoal = (name) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('retire')) return 'self_improvement';
    if (lowerName.includes('house') || lowerName.includes('home')) return 'house';
    if (lowerName.includes('car') || lowerName.includes('vehicle')) return 'directions_car';
    if (lowerName.includes('kid') || lowerName.includes('child') || lowerName.includes('education')) return 'school';
    if (lowerName.includes('travel') || lowerName.includes('vacation')) return 'flight_takeoff';
    return 'flag';
  };

  // Calculate progress based on total current value of the portfolio
  const currentNetWorth = stats?.currentValue || 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">My Goals</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Track your financial milestones against your current net worth ({formatCurrency(currentNetWorth)})
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-blue-700 transition-all"
        >
          <span className="material-symbols-outlined">add</span> Add Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">account_balance_wallet</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No Goals Set</h3>
          <p className="text-on-surface-variant">Set a financial goal to see how close your portfolio is to achieving it.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {goals.map(goal => {
            const progressPct = Math.min((currentNetWorth / goal.target_amount) * 100, 100).toFixed(1);
            const isAchieved = currentNetWorth >= goal.target_amount;

            return (
              <div key={goal.id} className="card p-6 flex flex-col gap-4 relative overflow-hidden">
                {isAchieved && (
                  <div className="absolute top-0 right-0 bg-success text-on-primary text-xs font-bold px-3 py-1 rounded-bl-lg">
                    ACHIEVED
                  </div>
                )}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${isAchieved ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                      <span className="material-symbols-outlined text-2xl">{goal.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-headline-lg-mobile text-on-surface">{goal.name}</h3>
                      <p className="text-sm text-on-surface-variant">Target Year: {goal.target_year}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(goal.id)} className="text-on-surface-variant hover:text-error transition-colors">
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>

                <div className="mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-on-surface-variant">Progress</span>
                    <span className="font-bold text-on-surface">{progressPct}%</span>
                  </div>
                  <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-2.5 rounded-full ${isAchieved ? 'bg-success' : 'bg-primary'}`}
                      style={{ width: `${progressPct}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm">
                    <span className="text-on-surface font-medium">{formatCurrency(currentNetWorth)}</span>
                    <span className="text-on-surface-variant">{formatCurrency(goal.target_amount)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-full max-w-md">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Create New Goal</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <div>
                <label className="block text-sm text-on-surface-variant mb-1">Goal Name</label>
                <input
                  type="text"
                  placeholder="e.g., Retirement, Dream House"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-1">Target Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g., 50000000"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-on-surface-variant mb-1">Target Year (Optional)</label>
                <input
                  type="number"
                  placeholder="e.g., 2040"
                  value={formData.target_year}
                  onChange={(e) => setFormData({ ...formData, target_year: e.target.value })}
                  className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary py-3">Save Goal</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}