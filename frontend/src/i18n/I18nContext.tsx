import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { translations, type Lang } from './translations';

const STORAGE_KEY = 'perto.lang';

interface I18nState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nState | undefined>(undefined);

function detectInitialLang(): Lang {
  const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
  if (stored === 'pt' || stored === 'en' || stored === 'es') return stored;
  const nav = navigator.language.toLowerCase();
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('en')) return 'en';
  return 'pt';
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectInitialLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next === 'pt' ? 'pt-BR' : next;
  }, []);

  const t = useCallback(
    (key: string) => {
      return translations[lang][key] ?? translations.pt[key] ?? key;
    },
    [lang],
  );

  const value = useMemo<I18nState>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n(): I18nState {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
