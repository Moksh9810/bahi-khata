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
  const [successMsg, setSuccessMsg] = useState('');

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
    setSuccessMsg('');

    try {
      // FIX 1: Prime the canvas cache (Fixes missing fonts/styles on first click)
      await toPng(cardRef.current, { cacheBust: true, style: { margin: 0 } });

      // FIX 2: Generate the actual high-res image
      const dataUrl = await toPng(cardRef.current, {
        quality: 1,
        pixelRatio: 3,
        cacheBust: true,
        style: { margin: '0' }
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
          console.log('Native share cancelled', err);
        }
      }

      if (!sharedSuccessfully) {
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `mywealth-portfolio-${timeframe.toLowerCase().replace(' ', '-')}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setSuccessMsg('Card downloaded exactly as shown! You can now share it.');
      }

      setIsSharing(false);
    } catch (err) {
      console.error('Error generating image:', err);
      alert('Failed to generate image. Please try taking a screenshot.');
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-[70] flex items-center justify-center p-4 backdrop-blur-md">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="p-6 pb-2 flex justify-center">
          {/* EXACT TICKET PREVIEW */}
          <div 
            ref={cardRef} 
            className="w-full rounded-3xl relative overflow-hidden shadow-2xl p-6 text-white" 
            style={{ 
              width: '340px',
              background: 'linear-gradient(135deg, #0f1115 0%, #15181d 50%, #1e1c15 100%)',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            
            {/* FIX 3: Replaced CSS Blur with Native Radial Gradient for 100% Image Compatibility */}
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle at top right, rgba(202, 138, 4, 0.12) 0%, transparent 60%)',
              pointerEvents: 'none'
            }}></div>
            
            <div>
              <div className="flex items-center gap-1.5 font-black italic tracking-wider text-lg text-white">
                {/* FIX 4: Replaced Icon Font with Inline SVG */}
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
                </svg>
                MYWEALTH
              </div>
              
              <div className="mt-4">
                <span className="inline-block bg-[#2a2215] text-[#d6b069] border border-[#d6b069]/30 text-[10px] px-2.5 py-0.5 rounded font-bold tracking-wider">
                  {timeframe.toUpperCase()}
                </span>
              </div>
              
              <h3 className="font-bold mt-2 text-lg text-white">My Portfolio</h3>
              
              <div className="mt-4">
                <p className="text-gray-400 text-xs">Return Rate</p>
                <h2 className={`text-4xl font-black leading-none mt-1 ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                  {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-5 mb-2">
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
            <div className="relative h-6 flex items-center w-full -mx-6 px-6 my-2">
              <div className="absolute -left-3.5 w-7 h-7 bg-white rounded-full"></div>
              <div className="w-full border-t border-dashed border-gray-700"></div>
              <div className="absolute -right-3.5 w-7 h-7 bg-white rounded-full"></div>
            </div>

            {/* Bottom Section */}
            <div className="flex justify-between items-end pt-1">
              <div className="w-14 h-14 bg-white p-1 rounded-lg flex flex-wrap gap-[1px]">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className={`w-[9px] h-[9px] ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                ))}
              </div>
              
              <div className="text-right">
                <p className="text-gray-400 text-[9px] uppercase tracking-wider">Generated On</p>
                <p className="text-white text-xs font-bold tracking-widest mt-0.5">{timestamp.split(' ')[0]}</p>
                <p className="text-gray-500 text-[9px] font-mono">{timestamp.split(' ')[1]}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Data Period Selector */}
        <div className="px-6 py-3">
          <h4 className="text-black font-bold text-sm mb-2">Data Period</h4>
          <div className="flex flex-wrap gap-2">
            {timeframes.map(tf => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  timeframe === tf 
                    ? 'border-black text-black font-medium bg-gray-50' 
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        {successMsg && (
          <div className="px-6 pb-2">
            <p className="text-xs text-success bg-success/10 p-2.5 rounded-lg text-center font-medium">{successMsg}</p>
          </div>
        )}
        
        {/* Share Button */}
        <div className="px-6 pb-6 pt-2">
          <button 
            onClick={handleShare} 
            disabled={isSharing}
            className="w-full bg-[#1e1e1e] text-white py-3.5 rounded-xl flex items-center justify-center gap-2 font-medium hover:bg-black transition-colors shadow-lg disabled:opacity-70"
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