import { useTranslation } from 'react-i18next';
import { usePreferences, type ThemePreference } from '@/app/providers/PreferencesProvider';

const OPTIONS: Array<{ id: ThemePreference; labelKey: string; dot?: string }> = [
  { id: 'system', labelKey: 'settings.themeSystem' },
  { id: 'light', labelKey: 'settings.themeLight' },
  { id: 'dark', labelKey: 'settings.themeDark' },
  { id: 'healthy', labelKey: 'settings.themeHealthy', dot: '#16a34a' },
];

export function ThemePicker() {
  const { t } = useTranslation();
  const { theme, setTheme } = usePreferences();

  return (
    <div className="grid grid-cols-1 gap-1.5">
      {OPTIONS.map((option) => {
        const isActive = option.id === theme;

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => setTheme(option.id)}
            className={[
              'flex items-center justify-between rounded-xl px-3.5 py-2.5 text-left text-sm transition-all',
              isActive
                ? option.id === 'healthy'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <span className="font-medium">{t(option.labelKey)}</span>
            <span
              className={['h-2.5 w-2.5 rounded-full transition-colors', !option.dot && (isActive ? 'bg-white/70 dark:bg-slate-900/70' : 'bg-slate-300 dark:bg-slate-600')].filter(Boolean).join(' ')}
              style={option.dot ? { backgroundColor: isActive ? 'rgba(255,255,255,0.7)' : option.dot } : undefined}
            />
          </button>
        );
      })}
    </div>
  );
}