import { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { toPng } from 'html-to-image';

export default function ShareCardModal({ stats, onClose }) {
  const isPositive = stats.pl >= 0;
  
  const [timeframe, setTimeframe] = useState('1 Year');
  const timeframes = ['1 Year', '7 Days', '30 Days', '60 Days', '90 Days', '180 Days'];
  
  const [timestamp, setTimestamp] = useState('');
  const cardRef = useRef(null);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    const now = new Date();
    const formatted = now.getFullYear() + '/' + 
      String(now.getMonth() + 1).padStart(2, '0') + '/' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0');
    setTimestamp(formatted);
  }, []);

  const handleShare = async () => {
    if (!cardRef.current) return;
    setIsSharing(true);

    try {
      // Taking high-quality snapshot of the entire white container
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3, 
        cacheBust: true,
      });

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], 'mywealth-portfolio.png', { type: 'image/png' });

      let sharedSuccessfully = false;
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'MYWEALTH Portfolio',
            text: `My portfolio is ${isPositive ? 'up' : 'down'} by ${Math.abs(stats.pctReturn).toFixed(2)}% (${timeframe})!`,
            files: [file]
          });
          sharedSuccessfully = true;
        } catch (err) {
          console.log('User cancelled share');
        }
      }

      // If native share fails or is desktop, download the exact image
      if (!sharedSuccessfully) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `mywealth-portfolio-${timeframe.toLowerCase().replace(' ', '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      setIsSharing(false);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image. Please try taking a screenshot.');
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-20">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* --- EXPORT CONTAINER: This entire white div is converted to the image --- */}
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div 
            ref={cardRef} 
            className="w-full bg-white px-6 py-10 flex justify-center"
          >
            {/* EXACT TICKET CARD */}
            <div 
              className="w-full rounded-[24px] relative p-7 text-white shadow-2xl" 
              style={{ 
                maxWidth: '340px',
                background: 'linear-gradient(135deg, #0f1115 0%, #15181d 50%, #1a1814 100%)',
                fontFamily: 'Inter, system-ui, sans-serif'
              }}
            >
              {/* Golden Glow */}
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle at top right, rgba(202, 138, 4, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}></div>
              
              {/* Top Details */}
              <div className="relative z-10">
                <div className="flex items-center gap-2 font-black italic tracking-wider text-xl text-white">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                  </svg>
                  MYWEALTH
                </div>
                
                <div className="mt-5">
                  <span className="inline-block bg-[#2a2215] text-[#d6b069] border border-[#d6b069]/30 text-[10px] px-3 py-1 rounded font-bold tracking-wider">
                    {timeframe.toUpperCase()}
                  </span>
                </div>
                
                <h3 className="font-bold mt-3 text-xl text-white">My Portfolio</h3>
                
                <div className="mt-5">
                  <p className="text-gray-400 text-xs">Return Rate</p>
                  <h2 className={`text-[44px] font-black leading-none mt-1 ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                    {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
                  </h2>
                </div>
                
                <div className="grid grid-cols-2 gap-5 mt-6 mb-2">
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
                  <div className="col-span-2">
                    <p className="text-gray-400 text-[11px] mb-0.5">Net Value</p>
                    <p className="text-[#00b060] text-sm font-bold">{formatCurrency(stats.currentValue)}</p>
                  </div>
                </div>
              </div>

              {/* Ticket Cutout Divider */}
              <div className="relative h-6 flex items-center w-full -mx-7 px-7 my-5 z-10">
                <div className="absolute -left-4 w-8 h-8 bg-white rounded-full"></div>
                <div className="w-full border-t border-dashed border-gray-600"></div>
                <div className="absolute -right-4 w-8 h-8 bg-white rounded-full"></div>
              </div>

              {/* Bottom Details */}
              <div className="flex justify-between items-end pt-1 relative z-10">
                <div className="w-16 h-16 bg-white p-1 rounded-lg flex flex-wrap gap-[1px]">
                  {[...Array(25)].map((_, i) => (
                    <div key={i} className={`w-[10px] h-[10px] ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                  ))}
                </div>
                
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest">Generated On</p>
                  <p className="text-white text-sm font-bold tracking-widest mt-1">{timestamp.split(' ')[0]}</p>
                  <p className="text-gray-500 text-[10px] font-mono mt-0.5">{timestamp.split(' ')[1]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* --- EXPORT CONTAINER ENDS --- */}

        {/* Data Period Selector (Not included in image) */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white">
          <h4 className="text-black font-bold text-sm mb-3">Data Period</h4>
          <div className="flex flex-wrap gap-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  timeframe === tf 
                    ? 'border-black text-black font-bold bg-gray-50 shadow-sm' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {/* Share Button */}
        <div className="px-6 pb-6 pt-2 bg-white">
          <button 
            onClick={handleShare} 
            disabled={isSharing}
            className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-70"
          >
            {isSharing ? (
              <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-[20px]">share</span>
            )}
            {isSharing ? 'Generating Image...' : 'Share Now'}
          </button>
        </div>
        
      </div>
    </div>
  );
}