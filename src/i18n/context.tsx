import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import translations, { type Locale, type TranslationKey } from './translations';
import { STORAGE_KEYS } from '../game/constants';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  energyName: (id: string) => string;
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.locale);
    if (saved === 'en' || saved === 'pt') return saved;
    return navigator.language.startsWith('en') ? 'en' : 'pt';
  });

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem(STORAGE_KEYS.locale, l);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = translations[locale][key] || translations['pt'][key] || key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        text = text.replace(`{${k}}`, String(v));
      }
    }
    return text;
  }, [locale]);

  const energyName = useCallback((id: string): string => {
    const key = `energy.${id}` as TranslationKey;
    return translations[locale][key] || id;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, energyName }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
