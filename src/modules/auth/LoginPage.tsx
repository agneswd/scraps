import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/modules/auth/use-auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { clearError, error, isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      await login(email.trim(), password);
    } catch {
      return;
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      <div className="w-full max-w-md rounded-[32px] border border-white/60 bg-white/80 p-8 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/80">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-600 dark:text-brand-200">
          {t('auth.kicker')}
        </p>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-slate-950 dark:text-white">
          {t('common.appName')}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {t('auth.subtitle')}
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('auth.emailLabel')}
            </span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                if (error) {
                  clearError();
                }

                setEmail(event.target.value);
              }}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/20"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('auth.passwordLabel')}
            </span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                if (error) {
                  clearError();
                }

                setPassword(event.target.value);
              }}
              className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-200/40 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:ring-brand-500/20"
              placeholder={t('auth.passwordPlaceholder')}
              required
            />
          </label>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/60 dark:text-red-100">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.loginPending') : t('auth.loginButton')}
          </Button>
        </form>

        <div className="mt-6 rounded-3xl border border-dashed border-brand-300 bg-brand-50/80 p-5 text-sm text-brand-900 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-50">
          <p className="font-semibold">{t('auth.scaffoldTitle')}</p>
          <p className="mt-2">{t('auth.scaffoldSummary')}</p>
        </div>
      </div>
    </div>
  );
}
