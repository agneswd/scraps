import { useEffect, useMemo, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';

const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

type NotificationPromptProps = {
  userId: string | null;
  isBrowserSupported: boolean;
  isBusy: boolean;
  isSubscribed: boolean;
  isSupported: boolean;
  needsIosStandalone: boolean;
  error: string | null;
  permission: NotificationPermission | 'unsupported';
  onEnable: () => Promise<boolean>;
};

function getDismissKey(userId: string | null) {
  return `scraps.push_prompt_dismissed_at.${userId ?? 'guest'}`;
}

export function NotificationPrompt({
  userId,
  isBrowserSupported,
  isBusy,
  isSubscribed,
  isSupported,
  needsIosStandalone,
  error,
  permission,
  onEnable,
}: NotificationPromptProps) {
  const { t } = useTranslation();
  const [dismissedAt, setDismissedAt] = useState<number | null>(null);

  const dismissKey = useMemo(() => getDismissKey(userId), [userId]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedValue = window.localStorage.getItem(dismissKey);
    setDismissedAt(storedValue ? Number(storedValue) : null);
  }, [dismissKey]);

  const dismissPrompt = () => {
    const nextDismissedAt = Date.now();

    if (typeof window !== 'undefined') {
      window.localStorage.setItem(dismissKey, String(nextDismissedAt));
    }

    setDismissedAt(nextDismissedAt);
  };

  const wasDismissedRecently =
    typeof dismissedAt === 'number' && Date.now() - dismissedAt < DISMISS_WINDOW_MS;

  const shouldShow =
    Boolean(userId) &&
    !isSubscribed &&
    permission !== 'denied' &&
    !wasDismissedRecently &&
    (isSupported || needsIosStandalone || isBrowserSupported);

  if (!shouldShow) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
      <section
        role="dialog"
        aria-modal="false"
        aria-labelledby="notification-prompt-title"
        className="pointer-events-auto w-full max-w-lg rounded-[28px] border border-white/50 bg-white/95 p-5 shadow-card backdrop-blur dark:border-white/10 dark:bg-slate-950/95"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-700 dark:bg-slate-900 dark:text-brand-200">
              <BellRing className="h-5 w-5" />
            </div>

            <div>
              <h2
                id="notification-prompt-title"
                className="font-display text-2xl tracking-tight text-slate-950 dark:text-white"
              >
                {t('notifications.promptTitle')}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {needsIosStandalone ? t('notifications.iosHint') : t('notifications.promptBody')}
              </p>
              {error && <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
            </div>
          </div>

          <button
            type="button"
            onClick={dismissPrompt}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-900"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={dismissPrompt} className="sm:min-w-32">
            {t('notifications.notNow')}
          </Button>

          {!needsIosStandalone && (
            <Button onClick={() => void onEnable()} disabled={isBusy} className="sm:min-w-40">
              {isBusy ? t('notifications.enabling') : t('notifications.enable')}
            </Button>
          )}
        </div>
      </section>
    </div>
  );
}