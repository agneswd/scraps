import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/modules/auth/use-auth';
import { DEFAULT_PUSH_NOTIFICATION_PREFERENCES, type PushNotificationPreferences } from '@/modules/settings/notification-preferences';
import {
  ensureServiceWorkerRegistration,
  getErrorMessage,
  getPushPreferences,
  getRelationId,
  isAppleMobileDevice,
  isBrowserPushCapable,
  isStandaloneMode,
  persistPushSubscription,
  removePushSubscriptionRecord,
  updatePushSubscriptionPreferences,
  urlBase64ToUint8Array,
} from '@/shared/hooks/push-utils';

const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim() ?? '';

type PushPermissionState = NotificationPermission | 'unsupported';

export function usePush() {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<PushPermissionState>('unsupported');
  const [error, setError] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const [preferences, setPreferences] = useState<PushNotificationPreferences>(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);

  const userId = typeof user?.id === 'string' ? user.id : null;
  const householdId = getRelationId(user?.household_id);

  const isBrowserSupported = useMemo(() => isBrowserPushCapable(vapidPublicKey), []);
  const needsIosStandalone = useMemo(
    () => isBrowserSupported && isAppleMobileDevice() && !isStandaloneMode(),
    [isBrowserSupported],
  );
  const isSupported = isBrowserSupported && !needsIosStandalone;

  const refresh = useCallback(async () => {
    if (!userId || !householdId) {
      setIsSubscribed(false);
      setEndpoint(null);
      setError(null);
      setPermission(isBrowserSupported ? Notification.permission : 'unsupported');
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      return;
    }

    if (!isBrowserSupported) {
      setIsSubscribed(false);
      setEndpoint(null);
      setError(null);
      setPermission('unsupported');
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      return;
    }

    setPermission(Notification.permission);

    if (needsIosStandalone) {
      setIsSubscribed(false);
      setEndpoint(null);
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      return;
    }

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (!subscription) {
        setIsSubscribed(false);
        setEndpoint(null);
        return;
      }

      const subscriptionKeys = subscription.toJSON().keys;
      const p256dh = subscriptionKeys?.p256dh;
      const authKey = subscriptionKeys?.auth;

      if (!p256dh || !authKey) {
        throw new Error('The browser push subscription is missing encryption keys.');
      }

      const record = await persistPushSubscription({
        endpoint: subscription.endpoint,
        p256dh,
        authKey,
        userId,
        householdId,
      });

      const prefs = getPushPreferences(record);

      // Back-fill timezone if the stored record has none (existing subscriptions
      // created before this field existed). Fire-and-forget — UI doesn't wait for it.
      if (!prefs.notify_timezone) {
        const detectedTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (detectedTz) {
          prefs.notify_timezone = detectedTz;
          void updatePushSubscriptionPreferences(subscription.endpoint, prefs);
        }
      }

      setIsSubscribed(true);
      setEndpoint(subscription.endpoint);
      setPreferences(prefs);
      setError(null);
    } catch (caughtError) {
      setIsSubscribed(false);
      setEndpoint(null);
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      setError(getErrorMessage(caughtError, 'Push notifications could not be initialized.'));
    }
  }, [householdId, isBrowserSupported, needsIosStandalone, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isBrowserSupported) {
      return;
    }

    const handleFocus = () => {
      void refresh();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isBrowserSupported, refresh]);

  const subscribe = useCallback(async () => {
    if (!userId || !householdId) {
      setError('You need to be signed in before enabling notifications.');
      return false;
    }

    if (!isSupported) {
      setError(
        needsIosStandalone
          ? 'Install Scraps to your Home Screen before enabling notifications.'
          : 'Push notifications are not available in this browser.',
      );
      return false;
    }

    setIsLoading(true);
    setError(null);

    let createdSubscription = false;
    let activeSubscription: PushSubscription | null = null;

    try {
      const nextPermission =
        Notification.permission === 'granted'
          ? 'granted'
          : await Notification.requestPermission();

      setPermission(nextPermission);

      if (nextPermission !== 'granted') {
        setIsSubscribed(false);
        setEndpoint(null);
        setError('Notification permission was not granted.');
        return false;
      }

      const registration = await ensureServiceWorkerRegistration();
      const existingSubscription = await registration.pushManager.getSubscription();
      activeSubscription = existingSubscription;

      if (!activeSubscription) {
        activeSubscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        });
        createdSubscription = true;
      }

      const subscriptionKeys = activeSubscription.toJSON().keys;
      const p256dh = subscriptionKeys?.p256dh;
      const authKey = subscriptionKeys?.auth;

      if (!p256dh || !authKey) {
        throw new Error('The browser push subscription is missing encryption keys.');
      }

      const record = await persistPushSubscription({
        endpoint: activeSubscription.endpoint,
        p256dh,
        authKey,
        userId,
        householdId,
      });

      setIsSubscribed(true);
      setEndpoint(activeSubscription.endpoint);
      setPreferences(getPushPreferences(record));
      setError(null);
      return true;
    } catch (caughtError) {
      if (createdSubscription && activeSubscription) {
        await activeSubscription.unsubscribe().catch(() => undefined);
      }

      setIsSubscribed(false);
      setEndpoint(null);
  setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      setError(getErrorMessage(caughtError, 'Notifications could not be enabled.'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [householdId, isSupported, needsIosStandalone, userId]);

  const unsubscribe = useCallback(async () => {
    if (!isBrowserSupported) {
      setIsSubscribed(false);
      setEndpoint(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    let nextEndpoint = endpoint;

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        nextEndpoint = subscription.endpoint;
        await subscription.unsubscribe();
      }

      await removePushSubscriptionRecord(nextEndpoint);
      setIsSubscribed(false);
      setEndpoint(null);
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      setPermission(Notification.permission);
    } catch (caughtError) {
      setIsSubscribed(false);
      setEndpoint(null);
      setPreferences(DEFAULT_PUSH_NOTIFICATION_PREFERENCES);
      setError(getErrorMessage(caughtError, 'Notifications could not be disabled cleanly.'));
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, isBrowserSupported]);

  const updatePreferences = useCallback(async (patch: Partial<PushNotificationPreferences>) => {
    if (!endpoint) {
      setError('Enable notifications for this device before changing notification preferences.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    const nextPreferences = {
      ...preferences,
      ...patch,
    } satisfies PushNotificationPreferences;

    try {
      const updatedRecord = await updatePushSubscriptionPreferences(endpoint, nextPreferences);
      setPreferences(getPushPreferences(updatedRecord));
      return true;
    } catch (caughtError) {
      setError(getErrorMessage(caughtError, 'Notification preferences could not be updated.'));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [endpoint, preferences]);

  return {
    error,
    isBrowserSupported,
    isLoading,
    isSubscribed,
    isSupported,
    needsIosStandalone,
    preferences,
    permission,
    refresh,
    subscribe,
    unsubscribe,
    updatePreferences,
  };
}