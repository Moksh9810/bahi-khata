import { useState } from 'react';
import { formatPercent } from '../utils/formatters';

export default function ShareCardModal({ stats, onClose }) {
  const isPositive = stats.pctReturn >= 0;
  
  // Timeframe state
  const [timeframe, setTimeframe] = useState('All Time');
  const timeframes = ['Today', 'This Week', 'This Month', 'This Year', 'All Time'];

  const handleShare = async () => {
    const shareData = {
      title: 'MYWEALTH Portfolio',
      text: `My investment portfolio is ${isPositive ? 'up' : 'down'} by ${Math.abs(stats.pctReturn)}% (${timeframe})! 🚀 Track your net worth and goals with MYWEALTH.`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share cancelled or failed', err);
      }
    } else {
      alert('Web Share is not supported on this browser. You can take a screenshot of this card to share!');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/70 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-sm flex flex-col items-center">
        
        {/* Timeframe Selector (Only visible in UI, won't look like part of the card screenshot) */}
        <div className="w-full mb-6">
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-wider mb-2 text-center">Select Timeframe</p>
          <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 justify-center">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 text-xs font-bold rounded-full whitespace-nowrap transition-all ${
                  timeframe === tf 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/30' 
                    : 'bg-surface text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Shareable Card UI (The part users will screenshot) */}
        <div className="w-full bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 border border-outline-variant/30 shadow-2xl relative overflow-hidden text-center">
          {/* Top highlight bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-primary via-blue-400 to-emerald-400"></div>
          
          <h3 className="text-on-surface-variant font-bold text-xs tracking-[0.2em] uppercase mb-6">
            Portfolio Update
          </h3>
          
          <div className="flex justify-center mb-4">
            <span className={`material-symbols-outlined text-5xl p-4 rounded-full bg-slate-800 border ${isPositive ? 'text-success border-success/20 shadow-[0_0_15px_rgba(34,197,94,0.2)]' : 'text-error border-error/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]'}`}>
              {isPositive ? 'trending_up' : 'trending_down'}
            </span>
          </div>

          <p className="text-on-surface/80 text-lg mb-1">My investments are</p>
          
          <h2 className={`text-6xl font-black mb-3 tracking-tight ${isPositive ? 'text-success' : 'text-error'}`}>
            {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
          </h2>

          {/* Selected Timeframe Badge inside card */}
          <div className="inline-flex items-center justify-center bg-slate-800 border border-slate-700 px-4 py-1.5 rounded-full mb-6 shadow-inner">
             <p className="text-primary text-sm font-bold tracking-wide">{timeframe}</p>
          </div>
          
          <div className="mt-6 pt-6 border-t border-slate-700/50 flex items-center justify-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">insights</span>
            <span className="text-on-surface font-black tracking-widest text-lg">MYWEALTH</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 w-full">
          <button onClick={handleShare} className="flex-1 btn-primary py-3.5 flex items-center justify-center gap-2 rounded-xl text-sm font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
            <span className="material-symbols-outlined text-lg">share</span>
            Share Link
          </button>
          <button onClick={onClose} className="px-6 py-3.5 rounded-xl border border-outline-variant text-on-surface font-bold hover:bg-surface-container transition-all text-sm">
            Close
          </button>
        </div>
        
        <p className="text-on-surface-variant text-xs mt-5 text-center px-4 leading-relaxed">
          Take a screenshot to post on your story, or use the share button to send a link!
        </p>
      </div>
    </div>
  );
}