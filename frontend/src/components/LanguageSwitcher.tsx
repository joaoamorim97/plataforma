import { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/I18nContext';
import { LANGS } from '@/i18n/translations';

export function LanguageSwitcher() {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-lg transition hover:bg-slate-100"
        aria-label="Idioma / Language"
        title={current.label}
      >
        <span>{current.flag}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-44 overflow-hidden rounded-xl border border-slate-100 bg-white py-1 shadow-card-hover animate-fade-in">
          {LANGS.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-sm transition hover:bg-slate-50 ${
                l.code === lang ? 'font-semibold text-brand-700' : 'text-slate-600'
              }`}
            >
              <span className="text-lg">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
