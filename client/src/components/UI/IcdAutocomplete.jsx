import { useState, useRef, useEffect } from 'react';
import { searchICD10 } from '../../utils/icd10.js';
import styles from './IcdAutocomplete.module.css';

/**
 * Поле ввода кода МКБ-10 с выпадающим автодополнением.
 * Props:
 *   value        — текущий код (строка)
 *   onChange(code, title) — вызывается при выборе
 *   label        — подпись поля
 */
export default function IcdAutocomplete({ value, onChange, label }) {
  const [query,       setQuery]       = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [open,        setOpen]        = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(-1);
  const wrapRef = useRef(null);

  // Закрываем при клике вне компонента
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  function handleInput(e) {
    const q = e.target.value;
    setQuery(q);
    const results = searchICD10(q);
    setSuggestions(results);
    setOpen(results.length > 0);
    setActiveIdx(-1);
    // Если поле очищено — сбрасываем значение
    if (!q) onChange('', '');
  }

  function handleSelect(item) {
    setQuery(item.code);
    setOpen(false);
    onChange(item.code, item.title);
  }

  function handleKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIdx]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  return (
    <div className={styles.wrapper} ref={wrapRef}>
      {label && <label className={styles.label}>{label}</label>}

      <div className={styles.inputWrap}>
        <input
          type="text"
          className={styles.input}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => query && setSuggestions(searchICD10(query)) && setOpen(true)}
          placeholder="J45, астма..."
          autoComplete="off"
        />
        {query && (
          <button
            className={styles.clearBtn}
            onClick={() => { setQuery(''); setSuggestions([]); setOpen(false); onChange('', ''); }}
            type="button"
            tabIndex={-1}
          >✕</button>
        )}
      </div>

      {open && (
        <ul className={styles.dropdown} role="listbox">
          {suggestions.map((item, i) => (
            <li
              key={item.code}
              className={[styles.item, i === activeIdx ? styles.active : ''].join(' ')}
              onMouseDown={() => handleSelect(item)}
              role="option"
              aria-selected={i === activeIdx}
            >
              <span className={styles.code}>{item.code}</span>
              <span className={styles.title}>{item.title}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
