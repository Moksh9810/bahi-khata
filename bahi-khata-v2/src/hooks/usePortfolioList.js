import { useCallback, useEffect, useState } from 'react';
import { portfolioService } from '../services/supabase';

const STORAGE_KEY = 'mywealth-active-portfolio';

// The user's portfolios, and which one is being looked at.
//
// The free-plan limit of one is enforced by a database policy, not here. This
// hook only knows enough to show a sensible message when the database says no.
export function usePortfolioList(userId) {
  const [portfolios, setPortfolios] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!userId) {
      setPortfolios([]);
      setActiveId(null);
      setLoaded(false);
      return;
    }

    try {
      const list = await portfolioService.list(userId);
      setPortfolios(list);

      // Remember the last one used, but never point at a portfolio that has
      // since been deleted or belongs to a different account.
      let remembered = null;
      try { remembered = localStorage.getItem(STORAGE_KEY); } catch { /* private mode */ }

      const valid = list.some(p => p.id === remembered) ? remembered : null;
      const fallback = list.find(p => p.is_default)?.id || list[0]?.id || null;
      setActiveId(valid || fallback);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoaded(true);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const select = useCallback(id => {
    setActiveId(id);
    try { localStorage.setItem(STORAGE_KEY, id); } catch { /* ignore */ }
  }, []);

  const create = useCallback(async name => {
    setError('');
    const made = await portfolioService.create(userId, name.trim() || 'New portfolio');
    await load();
    if (made?.id) select(made.id);
    return made;
  }, [userId, load, select]);

  const rename = useCallback(async (id, name) => {
    await portfolioService.rename(id, name.trim());
    await load();
  }, [load]);

  const remove = useCallback(async id => {
    await portfolioService.remove(id);
    try { if (localStorage.getItem(STORAGE_KEY) === id) localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    await load();
  }, [load]);

  return {
    portfolios,
    activeId,
    active: portfolios.find(p => p.id === activeId) || null,
    loaded,
    error,
    select,
    create,
    rename,
    remove,
    reload: load
  };
}
