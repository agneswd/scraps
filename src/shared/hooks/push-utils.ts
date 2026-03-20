import { ClientResponseError } from 'pocketbase';
import { pocketbase } from '@/shared/api/pocketbase';

const PUSH_COLLECTION = 'push_subscriptions';

export function getRelationId(value: unknown) {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }

  if (Array.isArray(value) && typeof value[0] === 'string' && value[0].length > 0) {
    return value[0];
  }

  return null;
}

export function isBrowserPushCapable(vapidPublicKey: string) {
  return (
    typeof window !== 'undefined' &&
    window.isSecureContext &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    vapidPublicKey.length > 0
  );
}

export function isAppleMobileDevice() {
  if (typeof navigator === 'undefined') {
    return false;
  }

  const userAgent = navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

export function isStandaloneMode() {
  if (typeof window === 'undefined') {
    return false;
  }

  const standaloneNavigator = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia('(display-mode: standalone)').matches || standaloneNavigator.standalone === true;
}

function escapeFilterValue(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof ClientResponseError) {
    return error.response?.message || error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

export function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const normalized = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(normalized);

  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

export async function ensureServiceWorkerRegistration() {
  const registration = await navigator.serviceWorker.getRegistration();

  if (registration) {
    return registration;
  }

  return navigator.serviceWorker.register('/sw.js');
}

async function findPushRecordId(endpoint: string) {
  try {
    const record = await pocketbase
      .collection(PUSH_COLLECTION)
      .getFirstListItem(`endpoint = '${escapeFilterValue(endpoint)}'`);

    return record.id;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function persistPushSubscription(options: {
  endpoint: string;
  p256dh: string;
  authKey: string;
  userId: string;
  householdId: string;
}) {
  const existingRecordId = await findPushRecordId(options.endpoint);

  if (existingRecordId) {
    return;
  }

  await pocketbase.collection(PUSH_COLLECTION).create({
    user_id: options.userId,
    household_id: options.householdId,
    endpoint: options.endpoint,
    p256dh: options.p256dh,
    auth_key: options.authKey,
  });
}

export async function removePushSubscriptionRecord(endpoint: string | null) {
  if (!endpoint) {
    return;
  }

  const recordId = await findPushRecordId(endpoint);

  if (recordId) {
    await pocketbase.collection(PUSH_COLLECTION).delete(recordId);
  }
}