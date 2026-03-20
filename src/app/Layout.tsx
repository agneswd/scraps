import { BarChart3, LogOut, Soup } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/use-auth';

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    'flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-semibold transition',
    isActive
      ? 'bg-brand-500 text-white shadow-card'
      : 'bg-white/80 text-slate-700 hover:bg-white dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-900',
  ].join(' ');

export function Layout() {
  const { t } = useTranslation();
  const { logout, userEmail } = useAuth();

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 rounded-[28px] border border-white/50 bg-white/75 p-5 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/75 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-3xl tracking-tight text-slate-950 dark:text-white">
            {t('common.appName')}
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{userEmail}</p>
        </div>

        <div className="flex items-center gap-3">
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

          <button
            type="button"
            onClick={logout}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-900"
          >
            <LogOut className="h-4 w-4" />
            <span>{t('common.logout')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 py-6">
        <Outlet />
      </main>
    </div>
  );
}
