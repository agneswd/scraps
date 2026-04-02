import { FormEvent, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useAuth } from '@/modules/auth/use-auth';

export function LoginPage() {
  const { t } = useTranslation();
  const { clearError, error, isAuthenticated, isLoading, login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-[100dvh] items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
        className="w-full max-w-sm"
      >
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {t('common.appName')}
          </h1>
          <p className="mt-2 text-sm text-slate-400 dark:text-slate-500">
            {t('auth.subtitle')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('auth.emailLabel')}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                if (error) clearError();
                setEmail(event.target.value);
              }}
              className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-[0.9375rem] text-slate-900 outline-none transition-all duration-200 ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
              placeholder={t('auth.emailPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('auth.passwordLabel')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  if (error) clearError();
                  setPassword(event.target.value);
                }}
                className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-4 pr-11 text-[0.9375rem] text-slate-900 outline-none transition-all duration-200 ease-spring placeholder:text-slate-300 focus:border-slate-400 focus:ring-4 focus:ring-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-600 dark:focus:border-slate-500 dark:focus:ring-slate-800"
                placeholder={t('auth.passwordPlaceholder')}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? t('auth.hidePassword', 'Hide password') : t('auth.showPassword', 'Show password')}
                className="absolute right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:text-slate-500 dark:hover:bg-slate-700 dark:hover:text-slate-300"
              >
                {showPassword
                  ? <EyeOff className="h-4 w-4" strokeWidth={2} />
                  : <Eye className="h-4 w-4" strokeWidth={2} />}
              </button>
            </div>
          </div>

          {error ? (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/50 dark:text-red-400"
            >
              {error}
            </motion.p>
          ) : null}

          <Button type="submit" className="!mt-6 w-full" disabled={isLoading}>
            {isLoading ? t('auth.loginPending') : t('auth.loginButton')}
          </Button>
        </form>
      </motion.div>
    </div>
  );
}
