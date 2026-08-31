import { useState, useEffect, useRef } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

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
    setIsSharing(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1200;
      const ctx = canvas.getContext('2d');

      const bgGradient = ctx.createLinearGradient(0, 0, 1000, 1200);
      bgGradient.addColorStop(0, '#0f1115');
      bgGradient.addColorStop(0.5, '#15181d');
      bgGradient.addColorStop(1, '#1e1c15');
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1000, 1200);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold italic 36px sans-serif';
      ctx.fillText('MYWEALTH', 80, 100);

      ctx.fillStyle = '#2a2215';
      ctx.fillRect(80, 140, 160, 45);
      ctx.fillStyle = '#d6b069';
      ctx.font = 'bold 20px sans-serif';
      ctx.fillText(timeframe.toUpperCase(), 110, 170);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px sans-serif';
      ctx.fillText('My Portfolio', 80, 260);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px sans-serif';
      ctx.fillText('Return Rate', 80, 330);

      ctx.fillStyle = isPositive ? '#00b060' : '#ff3b30';
      ctx.font = 'bold 96px sans-serif';
      const returnText = (isPositive ? '+' : '') + formatPercent(stats.pctReturn);
      ctx.fillText(returnText, 80, 440);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '20px sans-serif';
      ctx.fillText('Total P&L', 80, 560);
      ctx.fillText('Total Invested', 540, 560);
      ctx.fillText('Net Value', 80, 680);

      ctx.fillStyle = isPositive ? '#00b060' : '#ff3b30';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText((isPositive ? '+' : '') + formatCurrency(stats.pl), 80, 600);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(formatCurrency(stats.invested), 540, 600);

      ctx.fillStyle = '#00b060';
      ctx.fillText(formatCurrency(stats.currentValue), 80, 720);

      ctx.strokeStyle = '#374151';
      ctx.lineWidth = 3;
      ctx.setLineDash([12, 12]);
      ctx.beginPath();
      ctx.moveTo(80, 840);
      ctx.lineTo(920, 840);
      ctx.stroke();

      ctx.fillStyle = '#9ca3af';
      ctx.font = '20px sans-serif';
      ctx.fillText('GENERATED ON', 540, 940);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 28px sans-serif';
      ctx.fillText(timestamp.split(' ')[0], 540, 980);
      ctx.fillStyle = '#6b7280';
      ctx.font = '18px monospace';
      ctx.fillText(timestamp.split(' ')[1] || '', 540, 1020);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setIsSharing(false);
          return;
        }
        const file = new File([blob], 'mywealth-portfolio.png', { type: 'image/png' });
        const shareData = {
          title: 'MYWEALTH Portfolio',
          text: `My portfolio is ${isPositive ? 'up' : 'down'} by ${Math.abs(stats.pctReturn).toFixed(2)}% (${timeframe})!`,
          files: [file]
        };

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share(shareData);
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'mywealth-portfolio.png';
          a.click();
          URL.revokeObjectURL(url);
          alert('Card image downloaded successfully!');
        }
        setIsSharing(false);
      }, 'image/png');

    } catch (err) {
      console.error(err);
      alert('Failed to generate image.');
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl relative overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-10">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="p-6 pb-2">
          <div ref={cardRef} className="w-full bg-gradient-to-br from-[#0f1115] via-[#15181d] to-[#1e1c15] rounded-2xl relative overflow-hidden shadow-lg mx-auto p-6" style={{ maxWidth: '340px' }}>
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-600/10 rounded-full blur-3xl"></div>
            
            <div className="pb-2">
              <div className="flex items-center gap-1 text-white font-black italic tracking-wider text-lg">
                <span className="material-symbols-outlined text-primary text-xl">insights</span>
                MYWEALTH
              </div>
              
              <div className="mt-4">
                <span className="inline-block bg-[#2a2215] text-[#d6b069] border border-[#d6b069]/30 text-[10px] px-2 py-0.5 rounded font-medium tracking-wide">
                  {timeframe.toUpperCase()}
                </span>
              </div>
              
              <h3 className="text-white font-bold mt-2 text-lg">My Portfolio</h3>
              
              <div className="mt-5">
                <p className="text-gray-400 text-xs">Return Rate</p>
                <h2 className={`text-[42px] font-bold leading-none mt-1 ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                  {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-6 mb-4">
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

            <div className="relative h-8 flex items-center w-full -mx-6 px-6">
              <div className="absolute -left-4 w-8 h-8 bg-white rounded-full"></div>
              <div className="w-full border-t border-dashed border-gray-700"></div>
              <div className="absolute -right-4 w-8 h-8 bg-white rounded-full"></div>
            </div>

            <div className="pt-2 flex justify-between items-end">
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex flex-wrap gap-[1px]">
                {[...Array(25)].map((_, i) => (
                  <div key={i} className={`w-[10px] h-[10px] ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                ))}
              </div>
              
              <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase tracking-wide">Generated On</p>
                <p className="text-white text-sm font-bold tracking-widest mt-1">{timestamp.split(' ')[0]}</p>
                <p className="text-gray-500 text-[10px] mt-1 font-mono">{timestamp.split(' ')[1]}</p>
              </div>
            </div>
          </div>
        </div>

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
        
        <div className="px-6 pb-6 pt-2">
          <button 
            onClick={handleShare} 
            disabled={isSharing}
            className="w-full bg-[#1e1e1e] text-white py-3.5 rounded-lg flex items-center justify-center gap-2 font-medium hover:bg-black transition-colors shadow-lg disabled:opacity-70"
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