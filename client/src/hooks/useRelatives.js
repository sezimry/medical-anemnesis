import { useState, useEffect, useCallback } from 'react';
import api from '../api/index.js';

// Хук управляет полным CRUD родственников
// Возвращает список + функции create/update/remove + состояния loading/error
export function useRelatives() {
  const [relatives, setRelatives] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/relatives');
      setRelatives(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = useCallback(async (fields) => {
    const { data } = await api.post('/relatives', fields);
    setRelatives(prev => [...prev, data]);
    return data;
  }, []);

  const update = useCallback(async (id, fields) => {
    const { data } = await api.put(`/relatives/${id}`, fields);
    setRelatives(prev => prev.map(r => r.id === id ? data : r));
    return data;
  }, []);

  const remove = useCallback(async (id) => {
    await api.delete(`/relatives/${id}`);
    setRelatives(prev => prev.filter(r => r.id !== id));
  }, []);

  return { relatives, loading, error, create, update, remove, reload: load };
}
