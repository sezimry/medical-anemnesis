import { createContext, useState, useContext, useCallback } from 'react';
import ru from '../locales/ru.json';
import kg from '../locales/kg.json';

const LOCALES = { ru, kg };

export const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(
    () => localStorage.getItem('locale') || 'ru'
  );

  const changeLocale = useCallback((lang) => {
    if (LOCALES[lang]) {
      setLocale(lang);
      localStorage.setItem('locale', lang);
    }
  }, []);

  // t('nav.dashboard') → строка из JSON
  const t = useCallback((key) => {
    const keys = key.split('.');
    let value = LOCALES[locale];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    return value ?? key;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, changeLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
