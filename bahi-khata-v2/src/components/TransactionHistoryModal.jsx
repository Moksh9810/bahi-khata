import { formatCurrency } from '../utils/formatters';

export default function TransactionHistoryModal({ item, type, onClose }) {
  // Agar manual averaging use ki gayi hai, toh history hogi, warna empty array
  const transactions = item.transactions || [];
  const isMF = type === 'mf';
  const qtyLabel = isMF ? 'Units' : 'Qty';

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-surface w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] border border-outline-variant/30">
        
        {/* Header */}
        <div className="p-6 border-b border-outline-variant/50 flex justify-between items-center bg-surface-container">
          <div>
            <h2 className="font-headline-md text-on-surface font-bold">Transaction Ledger</h2>
            <p className="text-sm text-on-surface-variant mt-1">{item.name || item.symbol}</p>
          </div>
          <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-on-surface/10 hover:text-on-surface rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        
        {/* Body (Transaction List) */}
        <div className="overflow-y-auto p-6 custom-scrollbar flex-1 bg-background">
          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-3">history_toggle_off</span>
              <p className="text-on-surface-variant font-medium">No transaction history found.</p>
              <p className="text-xs text-on-surface-variant/60 mt-2">Any new buys or sells you add for this asset will be recorded here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transactions.map((txn, idx) => (
                <div key={txn.id || idx} className="flex justify-between items-center p-4 border border-outline-variant/40 rounded-xl bg-surface-container/20 hover:bg-surface-container/50 transition-colors">
                  
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${txn.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                      <span className="material-symbols-outlined font-bold">
                        {txn.type === 'BUY' ? 'add_shopping_cart' : 'sell'}
                      </span>
                    </div>
                    <div>
                      <p className={`font-bold ${txn.type === 'BUY' ? 'text-success' : 'text-error'}`}>{txn.type}</p>
                      <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                        {new Date(txn.date).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-bold text-on-surface">
                      {txn.quantity} {qtyLabel} @ {formatCurrency(txn.price)}
                    </p>
                    <p className="text-xs text-on-surface-variant mt-1 font-medium bg-on-surface/5 inline-block px-2 py-0.5 rounded">
                      Total: {formatCurrency(txn.quantity * txn.price)}
                    </p>
                  </div>
                  
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}