import { useState } from 'react';
import { formatCurrency, formatPercent } from '../utils/formatters';
import { formSchemas, assetTypeLabels, assetTypeIcons } from '../utils/formSchemas';
import AssetSearch from './AssetSearch';
import ImportHoldings from './ImportHoldings';
import { groupHoldingsForDisplay } from '../utils/calculations';
import { holdingsService } from '../services/supabase';
import { usePortfolioStore } from '../store/portfolioStore';

const SEARCHABLE = {
  stocks: { source: 'stock', nameField: 'symbol', priceField: 'current_price' },
  mf: { source: 'mf', nameField: 'scheme', priceField: 'current_nav' },
  crypto: { source: 'crypto', nameField: 'symbol', priceField: 'current_price' }
};

export default function Portfolio({ type, holdings, onAdd, onRemove, onImport }) {
  const [showModal, setShowModal] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null);

  // Use Zustand store directly for updates to avoid missing props from parent
  const updateHoldingInStore = usePortfolioStore(state => state.updateHolding);

  const labels = assetTypeLabels;
  const displayHoldings = groupHoldingsForDisplay(holdings, type);

  const validateForm = () => {
    const schema = formSchemas[type];
    const newErrors = {};

    schema.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      if (editingId) {
        // Handle Edit Update
        const updated = await holdingsService.updateHolding(editingId, formData);
        updateHoldingInStore(type, editingId, updated);
      } else {
        // Handle New Add
        await onAdd(type, formData);
      }
      
      closeModal();
    } catch (error) {
      console.error('Error saving holding:', error);
      setErrors({ submit: error.message || 'Failed to save holding' });
    }
  };

  const handleEdit = (holding) => {
    setFormData(holding);
    setEditingId(holding.id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setFormData({});
    setErrors({});
    setEditingId(null);
  };

  const handleAssetPicked = (asset) => {
    const cfg = SEARCHABLE[type];
    if (!cfg) return;

    let nameValue;
    if (cfg.source === 'stock') nameValue = String(asset.id).replace(/\.(NS|BO)$/, '');
    else if (cfg.source === 'crypto') nameValue = asset.sub || asset.name;
    else nameValue = asset.name;

    setFormData(prev => ({
      ...prev,
      [cfg.nameField]: nameValue,
      quote_id: asset.id,
      ...(asset.price != null ? { [cfg.priceField]: asset.price } : {})
    }));

    setErrors(prev => ({ ...prev, [cfg.nameField]: undefined }));
  };

  const handleInputChange = (e) => {
    const { name, value, type: inputType } = e.target;
    const parsedValue = inputType === 'number' ? (value ? parseFloat(value) : '') : value;

    setFormData(prev => ({
      ...prev,
      [name]: parsedValue
    }));

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            {labels[type]}s
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Manage your {labels[type].toLowerCase()}s
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-primary border border-outline-variant hover:bg-primary/10 transition-all"
            title="Bring in many holdings at once from a broker file"
          >
            <span className="material-symbols-outlined">upload_file</span>
            Import
          </button>
          <button
            onClick={() => { setEditingId(null); setShowModal(true); }}
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg bg-primary text-on-primary font-label-sm font-bold hover:bg-blue-700 transition-all"
          >
            <span className="material-symbols-outlined">add</span>
            Add {labels[type]}
          </button>
        </div>
      </div>

      {showImport && (
        <ImportHoldings
          type={type}
          onImport={onImport}
          onClose={() => setShowImport(false)}
        />
      )}

      {/* Holdings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {displayHoldings.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <p className="text-on-surface-variant">No {labels[type].toLowerCase()}s added yet</p>
          </div>
        ) : (
          displayHoldings.map((h) => (
            <div key={h.id || h.name} className="card p-5 flex flex-col gap-4">
              <div>
                <h3 className="font-headline-lg-mobile text-headline-lg-mobile text-on-surface">
                  {h.symbol || h.scheme || h.name}
                </h3>
              </div>
              <div className="py-3 border-y border-outline-variant space-y-2">
                {type === 'stocks' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Qty: <span className="font-data-lg">{h.quantity}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Avg Buy Price: <span className="font-data-lg">{formatCurrency(h.buy_price)}</span>
                    </p>
                    {h.current_price && (
                      <p className="text-on-surface-variant text-sm">
                        Current: <span className="font-data-lg">{formatCurrency(h.current_price)}</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'mf' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Total Units: <span className="font-data-lg">{Number(h.units || 0).toFixed(3)}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Avg Buy NAV: <span className="font-data-lg">{formatCurrency(h.buy_nav)}</span>
                    </p>
                    {h.current_nav && (
                      <p className="text-on-surface-variant text-sm">
                        Current NAV: <span className="font-data-lg">{formatCurrency(h.current_nav)}</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'bonds' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Face Value: <span className="font-data-lg">{formatCurrency(h.quantity)}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Buy Price: <span className="font-data-lg">{formatCurrency(h.buy_price)}</span>
                    </p>
                    {h.interest_rate && (
                      <p className="text-on-surface-variant text-sm">
                        Interest: <span className="font-data-lg">{h.interest_rate}% ({h.payout_frequency})</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'loans' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Amount: <span className="font-data-lg">{formatCurrency(h.quantity)}</span>
                    </p>
                    {h.interest_rate && (
                      <p className="text-on-surface-variant text-sm">
                        Rate: <span className="font-data-lg">{h.interest_rate}%</span>
                      </p>
                    )}
                    {h.payout_amount && (
                      <p className="text-on-surface-variant text-sm">
                        Payout: <span className="font-data-lg">{formatCurrency(h.payout_amount)} ({h.payout_frequency})</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'crypto' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Amount: <span className="font-data-lg">{Number(h.quantity || 0).toFixed(8)}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Avg Buy Price: <span className="font-data-lg">{formatCurrency(h.buy_price)}</span>
                    </p>
                    {h.current_price && (
                      <p className="text-on-surface-variant text-sm">
                        Current: <span className="font-data-lg">{formatCurrency(h.current_price)}</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'gold' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Qty: <span className="font-data-lg">{h.quantity}g</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Buy: <span className="font-data-lg">{formatCurrency(h.buy_price)}/g</span>
                    </p>
                    {h.current_price && (
                      <p className="text-on-surface-variant text-sm">
                        Current: <span className="font-data-lg">{formatCurrency(h.current_price)}/g</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'properties' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Purchase: <span className="font-data-lg">{formatCurrency(h.quantity)}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Current Value: <span className="font-data-lg">{formatCurrency(h.buy_price)}</span>
                    </p>
                    {h.rental_income && (
                      <p className="text-on-surface-variant text-sm">
                        Monthly Rent: <span className="font-data-lg">{formatCurrency(h.rental_income)}</span>
                      </p>
                    )}
                  </>
                )}

                {type === 'fds' && (
                  <>
                    <p className="text-on-surface-variant text-sm">
                      Amount: <span className="font-data-lg">{formatCurrency(h.quantity)}</span>
                    </p>
                    <p className="text-on-surface-variant text-sm">
                      Rate: <span className="font-data-lg">{h.buy_price}%</span>
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-1 mt-auto">
                <button
                  onClick={() => handleEdit(h)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors"
                >
                  <span className="material-symbols-outlined">edit</span>
                </button>
                <button
                  onClick={() => onRemove(h.id, type)}
                  className="p-2 text-on-surface-variant hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">
              {editingId ? 'Edit' : 'Add'} {labels[type]}
            </h2>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              {formSchemas[type].map(field => (
                <div key={field.name}>
                  {SEARCHABLE[type] && SEARCHABLE[type].nameField === field.name ? (
                    <AssetSearch
                      type={SEARCHABLE[type].source}
                      value={formData[field.name] || ''}
                      placeholder={field.placeholder}
                      onSelect={handleAssetPicked}
                    />
                  ) : field.type === 'select' ? (
                    <select
                      name={field.name}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      className={`w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 bg-transparent ${
                        errors[field.name] ? 'ring-2 ring-error' : 'focus:ring-primary'
                      }`}
                      required={field.required}
                    >
                      <option value="" disabled>Select {field.label}</option>
                      {field.options.map(opt => (
                        <option key={opt} value={opt} className="bg-surface text-on-surface">{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      name={field.name}
                      placeholder={field.placeholder}
                      value={formData[field.name] || ''}
                      onChange={handleInputChange}
                      step={field.step}
                      className={`w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 ${
                        errors[field.name] ? 'focus:ring-error ring-2 ring-error' : 'focus:ring-primary'
                      }`}
                      required={field.required}
                    />
                  )}
                  {errors[field.name] && (
                    <p className="text-error text-xs mt-1">{errors[field.name]}</p>
                  )}
                </div>
              ))}

              {errors.submit && (
                <div className="text-error text-sm p-3 rounded-lg bg-error/10">
                  {errors.submit}
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit" className="flex-1 btn-primary w-full py-3">
                  {editingId ? 'Update' : 'Save'}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}