import { Bell, BellOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui/Button';
import { usePush } from '@/shared/hooks/use-push';
import {
  CATEGORY_NOTIFICATION_FIELDS,
  type PushCategoryPreferenceKey,
} from '@/modules/settings/notification-preferences';

function PreferenceToggle(props: {
  title: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const { title, description, checked, disabled = false, onToggle } = props;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className="flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3 text-left transition-all disabled:opacity-40 dark:bg-slate-800/70"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900 dark:text-white">{title}</p>
        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{description}</p>
      </div>
      <span
        className={[
          'relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors',
          checked ? 'bg-slate-900 dark:bg-white' : 'bg-slate-300 dark:bg-slate-700',
        ].join(' ')}
      >
        <span
          className={[
            'absolute top-1 h-5 w-5 rounded-full bg-white transition-all dark:bg-slate-900',
            checked ? 'left-6' : 'left-1',
          ].join(' ')}
        />
      </span>
    </button>
  );
}

export function NotificationSettingsPage() {
  const { t } = useTranslation();
  const push = usePush();

  const notificationsEnabled = push.preferences.notifications_enabled;
  const expiringEnabled = push.preferences.notify_expiring_leftovers;
  const canEditPreferences = push.isSubscribed && !push.isLoading;

  const handleSubscriptionToggle = () => {
    if (push.isLoading) {
      return;
    }

    if (push.isSubscribed) {
      void push.unsubscribe();
      return;
    }

    void push.subscribe();
  };

  const handlePreferenceToggle = (key: keyof typeof push.preferences) => {
    if (!canEditPreferences) {
      return;
    }

    void push.updatePreferences({ [key]: !push.preferences[key] });
  };

  const notificationBody = push.needsIosStandalone
    ? t('notifications.iosHint')
    : push.isSubscribed
      ? t('notifications.enabled')
      : push.isSupported
        ? t('notifications.promptBody')
        : t('notifications.unavailable');

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-50 p-4 dark:bg-slate-800/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {t('notifications.label')}
            </p>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{notificationBody}</p>
            {push.error ? <p className="mt-2 text-xs text-red-500 dark:text-red-400">{push.error}</p> : null}
          </div>
          <Button
            className="min-h-10 shrink-0 px-4 text-xs"
            variant={push.isSubscribed ? 'secondary' : 'primary'}
            onClick={handleSubscriptionToggle}
            disabled={push.isLoading || (!push.isSupported && !push.isSubscribed)}
          >
            {push.isSubscribed ? <Bell className="h-4 w-4" strokeWidth={2} /> : <BellOff className="h-4 w-4" strokeWidth={2} />}
            {push.isSubscribed ? t('notifications.disable', 'Disable') : t('notifications.enable')}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {t('notifications.typesTitle', 'Notification types')}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t('notifications.typesBody', 'Choose which fridge reminders this device can receive.')}
          </p>
        </div>

        <PreferenceToggle
          title={t('notifications.masterToggleTitle', 'All notifications')}
          description={t('notifications.masterToggleBody', 'Turn all push notifications for this device on or off.')}
          checked={notificationsEnabled}
          disabled={!canEditPreferences}
          onToggle={() => handlePreferenceToggle('notifications_enabled')}
        />

        <PreferenceToggle
          title={t('notifications.expiringToggleTitle', 'Expiring leftovers')}
          description={t('notifications.expiringToggleBody', 'Send reminders when active leftovers are within 24 hours of expiring.')}
          checked={expiringEnabled}
          disabled={!canEditPreferences || !notificationsEnabled}
          onToggle={() => handlePreferenceToggle('notify_expiring_leftovers')}
        />
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {t('notifications.categoryTitle', 'Leftover categories')}
          </p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            {t('notifications.categoryBody', 'Filter expiry reminders by leftover category on this device.')}
          </p>
        </div>

        {CATEGORY_NOTIFICATION_FIELDS.map(({ category, preferenceKey }) => (
          <PreferenceToggle
            key={preferenceKey}
            title={t(`categories.${category}`)}
            description={t('notifications.categoryToggleBody', 'Allow reminders for this category.')}
            checked={push.preferences[preferenceKey]}
            disabled={!canEditPreferences || !notificationsEnabled || !expiringEnabled}
            onToggle={() => handlePreferenceToggle(preferenceKey as PushCategoryPreferenceKey)}
          />
        ))}
      </section>
    </div>
  );
}