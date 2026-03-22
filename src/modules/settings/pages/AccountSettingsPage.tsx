import { LogOut, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/modules/auth/use-auth';

export function AccountSettingsPage() {
  const { t } = useTranslation();
  const { logout, userEmail } = useAuth();

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-soft dark:bg-slate-900 dark:text-slate-400">
            <Mail className="h-5 w-5" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              {t('settings.accountLabel', 'Account')}
            </p>
            <p className="mt-2 truncate text-sm font-medium text-slate-900 dark:text-white">{userEmail}</p>
          </div>
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center justify-center gap-2 rounded-3xl bg-red-50 px-4 py-3.5 text-sm font-medium text-red-600 transition hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/60"
      >
        <LogOut className="h-4 w-4" strokeWidth={2} />
        {t('common.logout')}
      </button>
    </div>
  );
}