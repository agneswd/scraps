import { Bell, BellOff, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/use-auth';
import { usePush } from '@/shared/hooks/use-push';

export function SettingsActions() {
  const { t } = useTranslation();
  const { logout } = useAuth();
  const push = usePush();

  const handleNotificationToggle = () => {
    if (push.isLoading || !push.isSupported) {
      return;
    }

    if (push.isSubscribed) {
      void push.unsubscribe();
      return;
    }

    void push.subscribe();
  };

  const notificationBody = push.needsIosStandalone
    ? t('notifications.iosHint')
    : push.isSubscribed
      ? t('notifications.enabled')
      : push.isSupported
        ? t('notifications.promptBody')
        : t('notifications.unavailable');

  return (
    <div className="mt-5 space-y-3 border-t border-slate-100 pt-5 dark:border-slate-800">
      <section className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('notifications.label')}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{notificationBody}</p>
            {push.error ? (
              <p className="mt-2 text-xs text-red-500 dark:text-red-400">{push.error}</p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleNotificationToggle}
            disabled={push.isLoading || !push.isSupported}
            className={[
              'inline-flex h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-medium transition-all disabled:opacity-40',
              push.isSubscribed
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800',
            ].join(' ')}
          >
            {push.isSubscribed ? (
              <Bell className="h-4 w-4" strokeWidth={2} />
            ) : (
              <BellOff className="h-4 w-4" strokeWidth={2} />
            )}
            {push.isSubscribed ? t('notifications.enabled') : t('notifications.enable')}
          </button>
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        {t('common.logout')}
      </button>
    </div>
  );
}