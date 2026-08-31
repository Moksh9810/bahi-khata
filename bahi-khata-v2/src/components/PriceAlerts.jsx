import { useState, useEffect } from 'react';
import { priceAlertService } from '../services/supabase';
import { formatCurrency } from '../utils/formatters';
import AssetSearch from './AssetSearch';

export default function PriceAlerts({ user }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'stock', direction: 'above' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.id) loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await priceAlertService.getPriceAlerts(user.id);
      setAlerts(data || []);
    } catch (err) {
      console.error("Failed to load alerts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!formData.asset_id || !formData.target_price) {
      setError('Please select an asset and set a target price.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const newAlert = await priceAlertService.addPriceAlert(user.id, {
        type: formData.type,
        asset_id: formData.asset_id,
        asset_name: formData.asset_name,
        target_price: parseFloat(formData.target_price),
        direction: formData.direction,
        is_active: true
      });
      setAlerts(prev => [...prev, newAlert]);
      setShowModal(false);
      setFormData({ type: 'stock', direction: 'above' });
    } catch (err) {
      setError(err.message || 'Failed to set alert');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await priceAlertService.deletePriceAlert(id);
      setAlerts(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error("Failed to delete alert", err);
    }
  };

  const handleAssetPicked = (asset) => {
    let nameValue = asset.name;
    if (formData.type === 'stock') nameValue = String(asset.id).replace(/\.(NS|BO)$/, '');
    else if (formData.type === 'crypto') nameValue = asset.sub || asset.name;

    setFormData(prev => ({
      ...prev,
      asset_id: asset.id,
      asset_name: nameValue,
      current_price: asset.price
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">Price Alerts</h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">Get notified when assets hit your target price</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-on-primary font-bold hover:bg-blue-700 transition-all">
          <span className="material-symbols-outlined">add_alert</span> Add Alert
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>
      ) : alerts.length === 0 ? (
        <div className="card p-12 text-center">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/50 mb-4">notifications_off</span>
          <p className="text-on-surface-variant">No active price alerts. Add one to track your targets.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {alerts.map(alert => (
            <div key={alert.id} className="card p-5 flex flex-col gap-4 border-l-4 border-l-primary">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded">{alert.type}</span>
                  <h3 className="font-headline-lg-mobile text-on-surface mt-2">{alert.asset_name}</h3>
                </div>
                <button onClick={() => handleDelete(alert.id)} className="text-on-surface-variant hover:text-error transition-colors"><span className="material-symbols-outlined">delete</span></button>
              </div>
              <div className="flex items-center gap-2">
                <span className={`material-symbols-outlined ${alert.direction === 'above' ? 'text-success' : 'text-error'}`}>
                  {alert.direction === 'above' ? 'trending_up' : 'trending_down'}
                </span>
                <p className="text-on-surface-variant text-sm">
                  Alert when price goes <strong className="text-on-surface">{alert.direction}</strong>
                </p>
              </div>
              <div className="mt-auto pt-4 border-t border-outline-variant/50">
                <p className="text-sm text-on-surface-variant">Target Price</p>
                <p className="font-data-lg text-2xl text-on-surface">{formatCurrency(alert.target_price)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl p-8 w-full max-w-md">
            <h2 className="font-headline-lg text-headline-lg text-on-surface mb-6">Create Alert</h2>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              
              <select
                value={formData.type}
                onChange={(e) => setFormData({ type: e.target.value, direction: 'above' })}
                className="w-full card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
              >
                <option value="stock" className="bg-surface">Stock</option>
                <option value="mf" className="bg-surface">Mutual Fund</option>
                <option value="crypto" className="bg-surface">Crypto</option>
              </select>

              <AssetSearch type={formData.type} onSelect={handleAssetPicked} placeholder={`Search ${formData.type}...`} />
              
              {formData.current_price && (
                <p className="text-sm text-on-surface-variant">Current Price: <span className="font-bold">{formatCurrency(formData.current_price)}</span></p>
              )}

              <div className="flex gap-2">
                <select
                  value={formData.direction}
                  onChange={(e) => setFormData(prev => ({ ...prev, direction: e.target.value }))}
                  className="w-1/3 card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary bg-transparent"
                >
                  <option value="above" className="bg-surface">Above</option>
                  <option value="below" className="bg-surface">Below</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Target Price (₹)"
                  value={formData.target_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, target_price: e.target.value }))}
                  className="w-2/3 card px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {error && <div className="text-error text-sm p-3 rounded-lg bg-error/10">{error}</div>}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 btn-primary py-3">Save Alert</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-lg border border-outline-variant text-on-surface hover:bg-surface-container transition-all">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}