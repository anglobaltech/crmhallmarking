// Generic CRUD hook for all module pages
import { useState, useEffect, useCallback } from 'react';
import { toast } from '../components/Toast.jsx';

/**
 * useModuleData — generic hook for paginated list + CRUD
 * @param {object} api — module API object with getAll, getStats, create, update, delete
 * @param {object} defaultParams — extra default query params
 */
export function useModuleData(api, defaultParams = {}) {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [params, setParams] = useState({ search: '', ...defaultParams });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const calls = [api.getAll(params)];
      if (api.getStats) calls.push(api.getStats());
      const results = await Promise.all(calls);
      setItems(results[0].data || []);
      setTotal(results[0].total || 0);
      if (results[1]) setStats(results[1]);
    } catch (err) {
      toast(`Failed to load: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  }, [api, params]);

  useEffect(() => { loadData(); }, [loadData]);

  const updateParam = (key, value) =>
    setParams(p => ({ ...p, [key]: value }));

  const createItem = async (data) => {
    await api.create(data);
    toast('Record created successfully');
    loadData();
  };

  const updateItem = async (id, data) => {
    await api.update(id, data);
    toast('Record updated successfully');
    loadData();
  };

  const deleteItem = async (id, label = 'Record') => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return false;
    await api.delete(id);
    toast('Record deleted');
    loadData();
    return true;
  };

  return { items, stats, loading, total, params, updateParam, createItem, updateItem, deleteItem, reload: loadData };
}
