import { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { calculateAssetCurrentValue, calculateAssetPL } from '../utils/calculations';
import TransactionHistoryModal from './TransactionHistoryModal';

export default function Portfolio({ type, holdings, stats, onAdd, onImport, onRemove, onUpdate }) {
  const [showHistoryModal, setShowHistoryModal] = useState(null);

  // Asset configuration dictionary
  const config = {
    stocks: { title: 'Stocks', icon: 'show_chart', showAveraging: true },
    mf: { title: 'Mutual Funds', icon: 'account_balance', showAveraging: true },
    crypto: { title: 'Crypto', icon: 'currency_bitcoin', showAveraging: true },
    gold: { title: 'Gold', icon: 'diamond', showAveraging: true },
    bonds: { title: 'Bonds', icon: 'payments', showAveraging: false },
    loans: { title: 'Loans', icon: 'real_estate_agent', showAveraging: false },
    properties: { title: 'Properties', icon: 'apartment', showAveraging: false },
    fds: { title: 'Fixed Deposits', icon: 'savings', showAveraging: false }
  };

  const currentConfig = config[type] || config.stocks;

  return (
    <div className="space-y-6">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/30 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-primary/10 text-primary rounded-xl">
            <span className="material-symbols-outlined text-2xl">{currentConfig.icon}</span>
          </div>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">{currentConfig.title}</h2>
            <p className="text-on-surface-variant text-sm mt-1">{holdings?.length || 0} Assets tracked</p>
          </div>
        </div>

        <div className="flex gap-3">
          {onImport && ['stocks', 'mf'].includes(type) && (
            <button 
              onClick={() => onImport(type)}
              className="px-4 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-all font-bold text-sm flex items-center gap-2"
            >
              <span className="material-symbols-outlined">upload_file</span>
              Import File
            </button>
          )}
          <button 
            onClick={() => onAdd(type)}
            className="btn-primary py-2 px-5 flex items-center gap-2"
          >
            <span className="material-symbols-outlined">add</span>
            Add Manual
          </button>
        </div>
      </div>

      {/* HOLDINGS LIST */}
      {!holdings || holdings.length === 0 ? (
        <div className="card p-12 text-center border-dashed border-2 border-outline-variant">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/40 mb-4">{currentConfig.icon}</span>
          <h3 className="text-xl font-bold text-on-surface mb-2">No {currentConfig.title} Yet</h3>
          <p className="text-on-surface-variant mb-6">Add your first asset manually or import from a statement.</p>
          <button onClick={() => onAdd(type)} className="btn-primary py-2 px-6">Add Now</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {holdings.map((item, index) => {
            
            // Universal calculations based on asset type
            const invested = (item.quantity || item.units || 1) * (item.buy_price || item.buy_nav || item.invested_amount || 0);
            const current = calculateAssetCurrentValue(item, type);
            const { pl, pct } = calculateAssetPL(invested, current);
            const isPositive = pl >= 0;

            return (
              <div key={item.id || index} className="card p-5 hover:ring-2 hover:ring-primary/40 transition-all flex flex-col justify-between">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">{item.name || item.symbol}</h3>
                    <p className="text-xs text-on-surface-variant uppercase tracking-widest mt-1">
                      {type === 'mf' ? `${item.units} UNITS` : `${item.quantity || 1} QTY`}
                    </p>
                  </div>
                  
                  {/* Action Buttons (History, Edit, Delete) */}
                  <div className="flex items-center gap-1 bg-surface-container rounded-lg p-1">
                    
                    {/* ONLY SHOW HISTORY BUTTON FOR ASSETS THAT SUPPORT AVERAGING */}
                    {currentConfig.showAveraging && (
                      <button 
                        onClick={() => setShowHistoryModal(item)}
                        className="p-1.5 text-primary hover:bg-primary/20 rounded-md transition-colors"
                        title="View Ledger / History"
                      >
                        <span className="material-symbols-outlined text-sm">history</span>
                      </button>
                    )}

                    <button 
                      onClick={() => onUpdate(type, item)}
                      className="p-1.5 text-on-surface-variant hover:text-on-surface hover:bg-on-surface/10 rounded-md transition-colors"
                      title="Edit"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>

                    <button 
                      onClick={() => onRemove(type, item.id)}
                      className="p-1.5 text-error hover:bg-error/10 rounded-md transition-colors"
                      title="Delete"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-2 p-3 bg-surface-container/30 rounded-xl border border-outline-variant/30">
                  <div>
                    <p className="text-[11px] text-on-surface-variant uppercase">Avg Buy Price</p>
                    <p className="font-bold text-on-surface text-sm mt-0.5">{formatCurrency(item.buy_price || item.buy_nav || invested)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-on-surface-variant uppercase">Current Price</p>
                    <p className="font-bold text-on-surface text-sm mt-0.5">{formatCurrency(item.current_price || item.current_nav || current)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-on-surface-variant uppercase">Invested Value</p>
                    <p className="font-bold text-on-surface mt-0.5">{formatCurrency(invested)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-on-surface-variant uppercase">Current Value</p>
                    <p className={`font-bold mt-0.5 ${isPositive ? 'text-success' : 'text-error'}`}>
                      {formatCurrency(current)}
                    </p>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* RENDER HISTORY MODAL IF ACTIVE */}
      {showHistoryModal && (
        <TransactionHistoryModal 
          item={showHistoryModal} 
          type={type} 
          onClose={() => setShowHistoryModal(null)} 
        />
      )}

    </div>
  );
}