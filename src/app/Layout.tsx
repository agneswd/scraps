import { BarChart3, Bell, BellOff, LogOut, Soup } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/use-auth';
import { usePush } from '@/shared/hooks/use-push';
import { NotificationPrompt } from '@/shared/ui/NotificationPrompt';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-500 text-white shadow-card'
      : 'bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900',
  ].join(' ');

export function Layout() {
  const { t } = useTranslation();
  const { logout, user, userEmail } = useAuth();
  const push = usePush();

  const notificationStateLabel = push.isSubscribed
    ? t('notifications.enabled')
    : push.needsIosStandalone
      ? t('notifications.installRequired')
      : push.isBrowserSupported
        ? t('notifications.disabled')
        : t('notifications.unavailable');

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

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-[28px] border border-white/50 bg-white/75 p-5 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/75 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-3xl tracking-tight text-slate-950 dark:text-white">
            {t('common.appName')}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{userEmail}</p>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <nav className="grid grid-cols-2 gap-2 rounded-full bg-brand-50/80 p-1 dark:bg-slate-900/80">
              <NavLink to="/" end className={navLinkClassName}>
                <Soup className="h-4 w-4" />
                <span>{t('dashboard.title')}</span>
              </NavLink>
              <NavLink to="/stats" className={navLinkClassName}>
                <BarChart3 className="h-4 w-4" />
                <span>{t('stats.title')}</span>
              </NavLink>
            </nav>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleNotificationToggle}
                disabled={push.isLoading || !push.isSupported}
                aria-pressed={push.isSubscribed}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                {push.isSubscribed ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                <span>{t('notifications.label')}</span>
                <span className="rounded-full bg-brand-50 px-2 py-1 text-xs font-semibold text-brand-700 dark:bg-slate-900 dark:text-brand-200">
                  {notificationStateLabel}
                </span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
              >
                <LogOut className="h-4 w-4" />
                <span>{t('common.logout')}</span>
              </button>
            </div>
          </div>

          {(push.error || push.needsIosStandalone) && (
            <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">
              {push.error ?? t('notifications.iosHint')}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 py-6">
        <Outlet />
      </main>

      <NotificationPrompt
        userId={typeof user?.id === 'string' ? user.id : null}
        isBrowserSupported={push.isBrowserSupported}
        isBusy={push.isLoading}
        isSubscribed={push.isSubscribed}
        isSupported={push.isSupported}
        needsIosStandalone={push.needsIosStandalone}
        error={push.error}
        permission={push.permission}
        onEnable={push.subscribe}
      />
    </div>
  );
}
