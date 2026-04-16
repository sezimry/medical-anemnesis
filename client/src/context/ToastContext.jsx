import { createContext, useContext, useState, useCallback, useRef } from 'react';
import styles from '../components/UI/Toast.module.css';

const ToastContext = createContext(null);

let idCounter = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // type: 'success' | 'error' | 'info' | 'warning'
  const show = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++idCounter;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => remove(id), duration);
    return id;
  }, [remove]);

  const success = useCallback((msg) => show(msg, 'success'), [show]);
  const error   = useCallback((msg) => show(msg, 'error', 5000), [show]);
  const info    = useCallback((msg) => show(msg, 'info'), [show]);
  const warning = useCallback((msg) => show(msg, 'warning'), [show]);

  return (
    <ToastContext.Provider value={{ show, success, error, info, warning }}>
      {children}
      {/* Портал уведомлений — поверх всего */}
      <div className={styles.container} aria-live="polite">
        {toasts.map(t => (
          <Toast key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

// ─── Один тост ───────────────────────────────────────────────────────────────
const ICONS = { success: '✓', error: '✕', warning: '⚠', info: 'ℹ' };

function Toast({ toast, onClose }) {
  return (
    <div className={[styles.toast, styles[toast.type]].join(' ')}>
      <span className={styles.icon}>{ICONS[toast.type]}</span>
      <span className={styles.message}>{toast.message}</span>
      <button className={styles.close} onClick={onClose} aria-label="Закрыть">✕</button>
    </div>
  );
}
