import { useState, useEffect } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';

export default function ShareCardModal({ stats, onClose }) {
  const isPositive = stats.pl >= 0;
  
  const [timeframe, setTimeframe] = useState('1 Year');
  const timeframes = ['1 Year', '7 Days', '30 Days', '60 Days', '90 Days', '180 Days'];
  
  const [timestamp, setTimestamp] = useState('');
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
    setIsSharing(true);
    setSuccessMsg('');

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 1400;
      const ctx = canvas.getContext('2d');

      // Polyfill for older browsers
      if (!ctx.roundRect) {
        ctx.roundRect = function (x, y, w, h, r) {
          this.beginPath(); this.moveTo(x + r, y); this.arcTo(x + w, y, x + w, y + h, r);
          this.arcTo(x + w, y + h, x, y + h, r); this.arcTo(x, y + h, x, y, r);
          this.arcTo(x, y, x + w, y, r); this.closePath(); return this;
        };
      }

      // 1. Draw Outer White Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 1200, 1400);

      // 2. Draw Dark Ticket Box
      const gradient = ctx.createLinearGradient(100, 100, 1100, 1300);
      gradient.addColorStop(0, '#0f1115');
      gradient.addColorStop(0.5, '#15181d');
      gradient.addColorStop(1, '#1a1814');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(100, 100, 1000, 1200, 40);
      ctx.fill();

      // 3. Draw Ticket Side Cutouts (Holes)
      ctx.fillStyle = '#ffffff'; // White circles to create holes
      ctx.beginPath();
      ctx.arc(100, 950, 40, 0, Math.PI * 2); // Left hole
      ctx.fill();
      ctx.beginPath();
      ctx.arc(1100, 950, 40, 0, Math.PI * 2); // Right hole
      ctx.fill();

      // 4. Draw Dashed Line
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 15]);
      ctx.beginPath();
      ctx.moveTo(160, 950);
      ctx.lineTo(1040, 950);
      ctx.stroke();
      ctx.setLineDash([]); // Reset dash

      // 5. Add Text & Details
      ctx.fillStyle = '#ffffff';
      ctx.font = 'italic 900 48px sans-serif';
      ctx.fillText('MYWEALTH', 200, 220);
      
      // Draw Chart Icon
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(140, 220); ctx.lineTo(160, 190); ctx.lineTo(180, 210); ctx.lineTo(200, 170);
      ctx.stroke();

      // Timeframe Badge
      ctx.fillStyle = '#2a2215';
      ctx.beginPath(); ctx.roundRect(140, 280, 160, 50, 10); ctx.fill();
      ctx.fillStyle = '#d6b069';
      ctx.font = 'bold 24px sans-serif';
      ctx.fillText(timeframe.toUpperCase(), 165, 315);

      // Title & Returns
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 56px sans-serif';
      ctx.fillText('My Portfolio', 140, 420);

      ctx.fillStyle = '#9ca3af';
      ctx.font = '28px sans-serif';
      ctx.fillText('Return Rate', 140, 520);

      ctx.fillStyle = isPositive ? '#00b060' : '#ff3b30';
      ctx.font = '900 120px sans-serif';
      ctx.fillText((isPositive ? '+' : '') + formatPercent(stats.pctReturn), 140, 640);

      // Stats Grid
      ctx.fillStyle = '#9ca3af';
      ctx.font = '24px sans-serif';
      ctx.fillText('Total P&L', 140, 750);
      ctx.fillText('Total Invested', 600, 750);
      ctx.fillText('Net Value', 140, 860);

      ctx.fillStyle = isPositive ? '#00b060' : '#ff3b30';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText((isPositive ? '+' : '') + formatCurrency(stats.pl), 140, 795);

      ctx.fillStyle = '#ffffff';
      ctx.fillText(formatCurrency(stats.invested), 600, 795);

      ctx.fillStyle = '#00b060';
      ctx.fillText(formatCurrency(stats.currentValue), 140, 905);

      // Bottom Section (QR Placeholder & Time)
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.roundRect(140, 1020, 140, 140, 16); ctx.fill();
      ctx.fillStyle = '#000000';
      for(let i=0; i<4; i++) {
        for(let j=0; j<4; j++) {
          if(Math.random() > 0.3) ctx.fillRect(150 + i*30, 1030 + j*30, 25, 25);
        }
      }

      ctx.textAlign = 'right';
      ctx.fillStyle = '#9ca3af';
      ctx.font = '22px sans-serif';
      ctx.fillText('GENERATED ON', 1060, 1060);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 32px sans-serif';
      ctx.fillText(timestamp.split(' ')[0], 1060, 1105);
      ctx.fillStyle = '#6b7280';
      ctx.font = '24px monospace';
      ctx.fillText(timestamp.split(' ')[1] || '', 1060, 1145);

      // Convert and Share
      canvas.toBlob(async (blob) => {
        if (!blob) { setIsSharing(false); return; }
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
          } catch (err) { console.log('Share cancelled'); }
        }

        if (!sharedSuccessfully) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `mywealth-portfolio-${timeframe.toLowerCase().replace(' ', '-')}.png`;
          a.click();
          URL.revokeObjectURL(url);
          setSuccessMsg('Exact Ticket downloaded successfully!');
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
    <div className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 transition-colors z-20">
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        <div className="overflow-y-auto custom-scrollbar flex-1">
          <div className="w-full bg-white px-6 py-10 flex justify-center">
            {/* Visual Preview */}
            <div className="w-full rounded-[24px] relative p-7 text-white shadow-2xl" 
                 style={{ maxWidth: '340px', background: 'linear-gradient(135deg, #0f1115 0%, #15181d 50%, #1a1814 100%)' }}>
              <div className="relative z-10">
                <div className="flex items-center gap-2 font-black italic tracking-wider text-xl">
                  <span className="material-symbols-outlined text-primary">insights</span> MYWEALTH
                </div>
                <div className="mt-5">
                  <span className="inline-block bg-[#2a2215] text-[#d6b069] border border-[#d6b069]/30 text-[10px] px-3 py-1 rounded font-bold">{timeframe.toUpperCase()}</span>
                </div>
                <h3 className="font-bold mt-3 text-xl">My Portfolio</h3>
                <div className="mt-5">
                  <p className="text-gray-400 text-xs">Return Rate</p>
                  <h2 className={`text-[44px] font-black mt-1 ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>
                    {isPositive ? '+' : ''}{formatPercent(stats.pctReturn)}
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-5 mt-6 mb-2">
                  <div>
                    <p className="text-gray-400 text-[11px] mb-0.5">Total P&L</p>
                    <p className={`text-sm font-bold ${isPositive ? 'text-[#00b060]' : 'text-[#ff3b30]'}`}>{isPositive ? '+' : ''}{formatCurrency(stats.pl)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[11px] mb-0.5">Total Invested</p>
                    <p className="text-sm font-bold">{formatCurrency(stats.invested)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400 text-[11px] mb-0.5">Net Value</p>
                    <p className="text-[#00b060] text-sm font-bold">{formatCurrency(stats.currentValue)}</p>
                  </div>
                </div>
              </div>
              <div className="relative h-6 flex items-center w-full -mx-7 px-7 my-5 z-10">
                <div className="absolute -left-4 w-8 h-8 bg-white rounded-full"></div>
                <div className="w-full border-t border-dashed border-gray-600"></div>
                <div className="absolute -right-4 w-8 h-8 bg-white rounded-full"></div>
              </div>
              <div className="flex justify-between items-end pt-1 relative z-10">
                <div className="w-16 h-16 bg-white p-1 rounded-lg grid grid-cols-4 gap-[1px]">
                  {[...Array(16)].map((_, i) => (<div key={i} className={Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}></div>))}
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-[10px] uppercase tracking-widest">Generated On</p>
                  <p className="text-white text-sm font-bold tracking-widest mt-1">{timestamp.split(' ')[0]}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100">
          <h4 className="font-bold text-sm mb-3 text-black">Data Period</h4>
          <div className="flex flex-wrap gap-2">
            {timeframes.map(tf => (
              <button key={tf} onClick={() => setTimeframe(tf)}
                className={`px-3 py-1.5 text-xs rounded border ${timeframe === tf ? 'border-black text-black font-bold bg-gray-50' : 'text-gray-500'}`}>
                {tf}
              </button>
            ))}
          </div>
        </div>
        
        {successMsg && <div className="px-6 pb-2"><p className="text-xs text-success bg-success/10 p-2.5 rounded-lg text-center font-medium">{successMsg}</p></div>}
        
        <div className="px-6 pb-6 pt-2">
          <button onClick={handleShare} disabled={isSharing} className="w-full bg-black text-white py-4 rounded-xl flex items-center justify-center gap-2 font-bold hover:bg-gray-800 disabled:opacity-70">
            {isSharing ? <span className="material-symbols-outlined text-[20px] animate-spin">refresh</span> : <span className="material-symbols-outlined text-[20px]">share</span>}
            {isSharing ? 'Generating...' : 'Share Now'}
          </button>
        </div>
      </div>
    </div>
  );
}