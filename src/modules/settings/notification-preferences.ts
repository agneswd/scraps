import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';

export type PushNotificationPreferences = {
  notifications_enabled: boolean;
  notify_expiring_leftovers: boolean;
  notify_meat: boolean;
  notify_poultry: boolean;
  notify_seafood: boolean;
  notify_veg: boolean;
  notify_dairy: boolean;
  notify_grains: boolean;
  notify_prepared: boolean;
  notify_other: boolean;
};

export type PushCategoryPreferenceKey = Exclude<
  keyof PushNotificationPreferences,
  'notifications_enabled' | 'notify_expiring_leftovers'
>;

export const DEFAULT_PUSH_NOTIFICATION_PREFERENCES: PushNotificationPreferences = {
  notifications_enabled: true,
  notify_expiring_leftovers: true,
  notify_meat: true,
  notify_poultry: true,
  notify_seafood: true,
  notify_veg: true,
  notify_dairy: true,
  notify_grains: true,
  notify_prepared: true,
  notify_other: true,
};

export const CATEGORY_NOTIFICATION_FIELDS: Array<{
  category: LeftoverCategory;
  preferenceKey: PushCategoryPreferenceKey;
}> = [
  { category: 'meat', preferenceKey: 'notify_meat' },
  { category: 'poultry', preferenceKey: 'notify_poultry' },
  { category: 'seafood', preferenceKey: 'notify_seafood' },
  { category: 'veg', preferenceKey: 'notify_veg' },
  { category: 'dairy', preferenceKey: 'notify_dairy' },
  { category: 'grains', preferenceKey: 'notify_grains' },
  { category: 'prepared', preferenceKey: 'notify_prepared' },
  { category: 'other', preferenceKey: 'notify_other' },
];