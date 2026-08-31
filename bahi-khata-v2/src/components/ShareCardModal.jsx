import { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import html2canvas from 'html2canvas';

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
      // Force high-scale canvas capture of the exact DOM ticket card
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: null,
        scale: 3,
        useCORS: true,
        logging: false
      });

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }
        
        const file = new File([blob], 'mywealth-portfolio.png', { type: 'image/png' });

        // Try native file sharing first if supported
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
            console.log('Native share cancelled or failed', err);
          }
        }

        // Fallback or Direct Action: Download the image automatically so user can share anywhere instantly
        if (!sharedSuccessfully) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mywealth-portfolio-${timeframe.toLowerCase().replace(' ', '-')}.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setSuccessMsg('Card image downloaded successfully! You can now share it on WhatsApp/Instagram.');
        }

        setIsSharing(false);
      }, 'image/png');
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
          {/* Exact Ticket Card matching reference */}
          <div 
            ref={cardRef} 
            className="w-full bg-gradient-to-br from-[#0f1115] via-[#15181d] to-[#1e1c15] rounded-3xl relative overflow-hidden shadow-2xl p-6 text-white" 
            style={{ width: '340px' }}
          >
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none"></div>
            
            <div>
              <div className="flex items-center gap-1.5 font-black italic tracking-wider text-lg text-white">
                <span className="material-symbols-outlined text-primary text-2xl">insights</span>
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

            {/* Ticket Cutout Divider with Side Holes */}
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
        
        {/* Share Button Footer */}
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