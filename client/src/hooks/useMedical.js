import { useState, useEffect, useCallback } from 'react';
import api from '../api/index.js';

// Хук управляет диагнозами и аллергиями
export function useMedical() {
  const [diagnoses,  setDiagnoses]  = useState([]);
  const [allergies,  setAllergies]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [diagRes, allergyRes] = await Promise.all([
        api.get('/diagnoses'),
        api.get('/allergies'),
      ]);
      setDiagnoses(diagRes.data);
      setAllergies(allergyRes.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // --- Диагнозы ---
  const createDiagnosis = useCallback(async (fields) => {
    const { data } = await api.post('/diagnoses', fields);
    setDiagnoses(prev => [data, ...prev]);
    return data;
  }, []);

  const updateDiagnosis = useCallback(async (id, fields) => {
    const { data } = await api.put(`/diagnoses/${id}`, fields);
    setDiagnoses(prev => prev.map(d => d.id === id ? data : d));
    return data;
  }, []);

  const removeDiagnosis = useCallback(async (id) => {
    await api.delete(`/diagnoses/${id}`);
    setDiagnoses(prev => prev.filter(d => d.id !== id));
  }, []);

  // --- Аллергии ---
  const createAllergy = useCallback(async (fields) => {
    const { data } = await api.post('/allergies', fields);
    setAllergies(prev => [data, ...prev]);
    return data;
  }, []);

  const updateAllergy = useCallback(async (id, fields) => {
    const { data } = await api.put(`/allergies/${id}`, fields);
    setAllergies(prev => prev.map(a => a.id === id ? data : a));
    return data;
  }, []);

  const removeAllergy = useCallback(async (id) => {
    await api.delete(`/allergies/${id}`);
    setAllergies(prev => prev.filter(a => a.id !== id));
  }, []);

  return {
    diagnoses, allergies, loading, error,
    createDiagnosis, updateDiagnosis, removeDiagnosis,
    createAllergy,   updateAllergy,   removeAllergy,
    reload: load,
  };
}
