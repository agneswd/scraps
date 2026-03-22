import { Bell, ChevronRight, Globe, History, Palette, UserRound } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type SettingsHomePageProps = {
  onOpenHistory: () => void;
  onOpenTheme: () => void;
  onOpenLanguage: () => void;
  onOpenNotifications: () => void;
  onOpenAccount: () => void;
};

const ITEMS = [
  {
    key: 'history',
    icon: History,
    titleKey: 'settings.history',
    bodyKey: 'settings.historyBody',
  },
  {
    key: 'theme',
    icon: Palette,
    titleKey: 'settings.theme',
    bodyKey: 'settings.themeBody',
  },
  {
    key: 'language',
    icon: Globe,
    titleKey: 'settings.language',
    bodyKey: 'settings.languageBody',
  },
  {
    key: 'notifications',
    icon: Bell,
    titleKey: 'notifications.label',
    bodyKey: 'settings.notificationsBody',
  },
  {
    key: 'account',
    icon: UserRound,
    titleKey: 'settings.accountLabel',
    bodyKey: 'settings.accountBody',
  },
] as const;

export function SettingsHomePage({
  onOpenHistory,
  onOpenTheme,
  onOpenLanguage,
  onOpenNotifications,
  onOpenAccount,
}: SettingsHomePageProps) {
  const { t } = useTranslation();

  const handlers = {
    history: onOpenHistory,
    theme: onOpenTheme,
    language: onOpenLanguage,
    notifications: onOpenNotifications,
    account: onOpenAccount,
  } as const;

  return (
    <div className="space-y-3">
      {ITEMS.map((item) => {
        const Icon = item.icon;

        return (
          <button
            key={item.key}
            type="button"
            onClick={handlers[item.key]}
            className="flex w-full items-center gap-4 rounded-3xl bg-slate-50 px-4 py-4 text-left transition-all hover:bg-slate-100 active:scale-[0.99] dark:bg-slate-800/70 dark:hover:bg-slate-800"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-soft dark:bg-slate-900 dark:text-slate-400">
              <Icon className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{t(item.titleKey)}</p>
              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t(item.bodyKey)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" strokeWidth={2} />
          </button>
        );
      })}
    </div>
  );
}