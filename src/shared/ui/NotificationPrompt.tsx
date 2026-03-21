import { useEffect, useMemo, useState } from 'react';
import { BellRing, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    if (typeof window === 'undefined') return;
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

  return (
    <AnimatePresence>
      {shouldShow ? (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="pointer-events-none safe-bottom fixed inset-x-0 bottom-20 z-30 flex justify-center px-5"
        >
          <section
            role="dialog"
            aria-modal="false"
            aria-labelledby="notification-prompt-title"
            className="pointer-events-auto w-full max-w-sm rounded-2xl bg-white p-4 shadow-elevated dark:bg-slate-800"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                <BellRing className="h-5 w-5" strokeWidth={1.5} />
              </div>

              <div className="min-w-0 flex-1">
                <h2
                  id="notification-prompt-title"
                  className="text-sm font-medium text-slate-900 dark:text-white"
                >
                  {t('notifications.promptTitle')}
                </h2>
                <p className="mt-0.5 text-xs text-slate-400 dark:text-slate-500">
                  {needsIosStandalone ? t('notifications.iosHint') : t('notifications.promptBody')}
                </p>
                {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
              </div>

              <button
                type="button"
                onClick={dismissPrompt}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-slate-100 dark:text-slate-600 dark:hover:bg-slate-700"
                aria-label={t('common.close')}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
              </button>
            </div>

            {!needsIosStandalone ? (
              <div className="mt-3 flex gap-2">
                <Button variant="ghost" onClick={dismissPrompt} className="flex-1 !min-h-9 !text-xs">
                  {t('notifications.notNow')}
                </Button>
                <Button onClick={() => void onEnable()} disabled={isBusy} className="flex-1 !min-h-9 !text-xs">
                  {isBusy ? t('notifications.enabling') : t('notifications.enable')}
                </Button>
              </div>
            ) : null}
          </section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}