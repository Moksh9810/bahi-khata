import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function ShareCardModal({ stats, onClose }) {
  const isPositive = stats.pl >= 0;
  
  // Data Period state matching the image
  const [timeframe, setTimeframe] = useState('1 Year');
  const timeframes = ['1 Year', '7 Days', '30 Days', '60 Days', '90 Days', '180 Days'];
  
  // Timestamp generator for the bottom corner
  const [timestamp, setTimestamp] = useState('');
  useEffect(() => {
    const now = new Date();
    const formatted = now.getFullYear() + '/' + 
      String(now.getMonth() + 1).padStart(2, '0') + '/' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0') + ':' + 
      String(now.getSeconds()).padStart(2, '0');
    setTimestamp(formatted);
  }, []);

  const handleShare = async () => {
    const shareData = {
      title: 'MYWEALTH Portfolio',
      text: `My investment portfolio is ${isPositive ? 'up' : 'down'} by ${Math.abs(stats.pctReturn)}% (${timeframe})! 🚀 Track your net worth with MYWEALTH.`,
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
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      {/* Outer White Modal Container */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="p-6 pb-2">
          {/* Black Ticket Card */}
          <div className="w-full bg-gradient-to-br from-[#0f1115] via-[#15181d] to-[#1e1c15] rounded-2xl relative overflow-hidden shadow-lg mx-auto" style={{ maxWidth: '340px' }}>
            
            {/* Background Gold Accent Simulation */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 rounded-full blur-3xl"></div>
            
            {/* Top Section */}
            <div className="p-6 pb-2">
              <div className="flex items-center gap-1 text-white font-black italic tracking-wider text-lg">
                <span className="material-symbols-outlined text-primary text-xl">insights</span>
                MYWEALTH
              </div>
              
              <div className="mt-4">
                <span className="inline-block bg-[#2a2215] text-[#d6b069] border border-[#d6b069]/30 text-[10px] px-2 py-0.5 rounded">
                  {timeframe}
                </span>
              </div>
              
              <h3 className="text-white font-bold mt-2 text-lg">My Portfolio</h3>
              
              <div className="mt-5">
                <p className="text-gray-400 text-xs">Return Rate</p>
                <h2 className={`text-[42px] font-bold leading-none mt-1 ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                  {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6 mb-2">
                <div>
                  <p className="text-gray-400 text-[11px] mb-0.5">Total P&L</p>
                  <p className={`text-sm font-bold ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                    {isPositive ? '+' : ''}{formatCurrency(stats.pl)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] mb-0.5">Total Invested</p>
                  <p className="text-white text-sm font-bold">{formatCurrency(stats.invested)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-[11px] mb-0.5">Net Value</p>
                  <p className="text-[#00b060] text-sm font-bold">{formatCurrency(stats.currentValue)}</p>
                </div>
              </div>
            </div>

            {/* Ticket Cutout Divider */}
            <div className="relative h-8 flex items-center w-full">
              {/* Left Cutout */}
              <div className="absolute -left-4 w-8 h-8 bg-white rounded-full"></div>
              {/* Dashed Line */}
              <div className="w-full border-t border-dashed border-gray-700 mx-5"></div>
              {/* Right Cutout */}
              <div className="absolute -right-4 w-8 h-8 bg-white rounded-full"></div>
            </div>

            {/* Bottom Section */}
            <div className="px-6 pb-6 pt-1 flex justify-between items-end">
              {/* QR Code Placeholder */}
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex flex-wrap gap-[1px]">
                {/* Generating a dummy QR code pattern */}
                {[...Array(25)].map((_, i) => (
                  <div key={i} className={`w-[10px] h-[10px] ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                ))}
              </div>
              
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Invitation Code</p>
                <p className="text-white text-xl font-bold tracking-widest mt-0.5">849201</p>
                <p className="text-gray-500 text-[9px] mt-2 font-mono">{timestamp}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Period Selector */}
        <div className="px-6 py-4">
          <h4 className="text-black font-bold text-sm mb-3">Data Period</h4>
          <div className="flex flex-wrap gap-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-4 py-2 text-xs rounded border transition-colors ${
                  timeframe === tf 
                    ? 'border-black text-black font-medium' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Share Button Footer */}
        <div className="px-6 pb-6 pt-2">
          <button 
            onClick={handleShare} 
            className="w-full bg-[#1e1e1e] text-white py-3.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-black transition-colors shadow-lg"
          >
            <span className="material-symbols-outlined text-[20px]">share</span>
            Share Now
          </button>
        </div>
        
      </div>
    </div>
  );
}