import { useTranslation } from 'react-i18next';
import { usePreferences, type ThemePreference } from '@/app/providers/PreferencesProvider';

const OPTIONS: Array<{ id: ThemePreference; labelKey: string; dot: string; activeDot: string }> = [
  { id: 'system', labelKey: 'settings.themeSystem', dot: '#94a3b8', activeDot: 'rgba(255,255,255,0.7)' },
  { id: 'light', labelKey: 'settings.themeLight', dot: '#e2e8f0', activeDot: 'rgba(255,255,255,0.7)' },
  { id: 'dark', labelKey: 'settings.themeDark', dot: '#0f172a', activeDot: 'rgba(255,255,255,0.7)' },
  { id: 'healthy', labelKey: 'settings.themeHealthy', dot: '#22c55e', activeDot: 'rgba(10,31,14,0.5)' },
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
                  ? 'bg-[#22c55e] text-[#0a1f0e]'
                  : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700',
            ].join(' ')}
          >
            <span className="font-medium">{t(option.labelKey)}</span>
            <span
              className="h-2.5 w-2.5 rounded-full transition-colors"
              style={{ backgroundColor: isActive ? option.activeDot : option.dot }}
            />
          </button>
        );
      })}
    </div>
  );
}