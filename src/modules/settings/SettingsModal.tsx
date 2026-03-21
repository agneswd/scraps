import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsActions } from '@/modules/settings/SettingsActions';
import { HistoryLog } from '@/modules/settings/HistoryLog';
import { LanguagePicker } from '@/modules/settings/LanguagePicker';
import { ThemePicker } from '@/modules/settings/ThemePicker';
import { Modal } from '@/shared/ui/Modal';

type Tab = 'history' | 'theme' | 'language';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function SettingsModal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('history');

  useEffect(() => {
    if (isOpen) {
      setTab('history');
    }
  }, [isOpen]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'history', label: t('settings.history') },
    { id: 'theme', label: t('settings.theme') },
    { id: 'language', label: t('settings.language') },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('settings.title')}>
      {/* Tab bar */}
      <div className="relative mb-5 flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-1 rounded-lg bg-white shadow-soft transition-all duration-200 ease-spring dark:bg-slate-700"
          style={{
            width: `calc((100% - 0.5rem) / ${tabs.length})`,
            left: `calc(0.25rem + ${tabs.findIndex((t) => t.id === tab)} * (100% - 0.5rem) / ${tabs.length})`,
          }}
        />
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            aria-pressed={tab === t.id}
            className={[
              'relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors duration-200',
              tab === t.id
                ? 'text-slate-900 dark:text-white'
                : 'text-slate-400 hover:text-slate-600 dark:text-slate-500',
            ].join(' ')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'history' ? <HistoryLog /> : null}
      {tab === 'theme' ? <ThemePicker /> : null}
      {tab === 'language' ? <LanguagePicker /> : null}

      <SettingsActions />
    </Modal>
  );
}
