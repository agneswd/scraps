import { useTranslation } from 'react-i18next';
import { usePreferences } from '@/app/providers/PreferencesProvider';
import { SUPPORTED_LANGUAGES } from '@/shared/i18n/languages';

export function LanguagePicker() {
  const { i18n: i18nInstance } = useTranslation();
  const { setLanguage } = usePreferences();
  const currentLang = i18nInstance.language;

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {SUPPORTED_LANGUAGES.map((lang) => {
        const isActive = currentLang === lang.code || currentLang.startsWith(`${lang.code}-`);
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => void setLanguage(lang.code)}
            className={[
              'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-all',
              isActive
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <span className="font-medium">{lang.nativeLabel}</span>
            <span className={['text-xs', isActive ? 'text-white/60 dark:text-slate-900/50' : 'text-slate-400 dark:text-slate-500'].join(' ')}>
              {lang.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
