import { ChevronLeft } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { HistoryLog } from '@/modules/settings/HistoryLog';
import { LanguagePicker } from '@/modules/settings/LanguagePicker';
import { ThemePicker } from '@/modules/settings/ThemePicker';
import { AccountSettingsPage } from '@/modules/settings/pages/AccountSettingsPage';
import { NotificationSettingsPage } from '@/modules/settings/pages/NotificationSettingsPage';
import { SettingsHomePage } from '@/modules/settings/pages/SettingsHomePage';
import { Modal } from '@/shared/ui/Modal';

type SettingsPage = 'home' | 'history' | 'theme' | 'language' | 'notifications' | 'account';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [page, setPage] = useState<SettingsPage>('home');

  useEffect(() => {
    if (isOpen) {
      setPage('home');
    }
  }, [isOpen]);

  const pageTitle = useMemo(() => {
    switch (page) {
      case 'history':
        return t('settings.history');
      case 'theme':
        return t('settings.theme');
      case 'language':
        return t('settings.language');
      case 'notifications':
        return t('notifications.label');
      case 'account':
        return t('settings.accountLabel', 'Account');
      default:
        return t('settings.title');
    }
  }, [page, t]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={pageTitle} fullScreen>
      <div className="mx-auto flex h-full w-full max-w-2xl flex-col gap-5 px-1 pb-4">
        {page !== 'home' ? (
          <button
            type="button"
            onClick={() => setPage('home')}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-medium text-slate-600 transition-all hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            <ChevronLeft className="h-4 w-4" strokeWidth={2} />
            {t('common.back')}
          </button>
        ) : null}

        {page === 'home' ? (
          <SettingsHomePage
            onOpenHistory={() => setPage('history')}
            onOpenTheme={() => setPage('theme')}
            onOpenLanguage={() => setPage('language')}
            onOpenNotifications={() => setPage('notifications')}
            onOpenAccount={() => setPage('account')}
          />
        ) : null}

        {page === 'history' ? <HistoryLog /> : null}

        {page === 'theme' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.themeBody')}</p>
            <ThemePicker />
          </div>
        ) : null}

        {page === 'language' ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('settings.languageBody')}</p>
            <LanguagePicker />
          </div>
        ) : null}

        {page === 'notifications' ? <NotificationSettingsPage /> : null}
        {page === 'account' ? <AccountSettingsPage /> : null}
      </div>
    </Modal>
  );
}
