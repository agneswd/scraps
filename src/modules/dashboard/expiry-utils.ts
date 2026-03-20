import {
  Beef,
  Carrot,
  CookingPot,
  Drumstick,
  Fish,
  Milk,
  Package,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

export type LeftoverCategory =
  | 'meat'
  | 'poultry'
  | 'seafood'
  | 'veg'
  | 'dairy'
  | 'grains'
  | 'prepared'
  | 'other';

export type LeftoverStatus = 'active' | 'consumed' | 'wasted';

export type ExpiryTone = 'fresh' | 'warning' | 'expired';

export const CATEGORY_SHELF_LIFE_DAYS: Record<LeftoverCategory, number> = {
  seafood: 2,
  meat: 3,
  poultry: 3,
  dairy: 4,
  prepared: 4,
  grains: 5,
  veg: 5,
  other: 5,
};

export const CATEGORY_ICONS: Record<LeftoverCategory, LucideIcon> = {
  seafood: Fish,
  meat: Beef,
  poultry: Drumstick,
  dairy: Milk,
  prepared: CookingPot,
  grains: Wheat,
  veg: Carrot,
  other: Package,
};

export function calculateDefaultExpiryDate(category: LeftoverCategory, now = new Date()) {
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + CATEGORY_SHELF_LIFE_DAYS[category]);
  return expiryDate.toISOString();
}

export function calculateTimeRemaining(expiryDate: string, now = new Date()) {
  return new Date(expiryDate).getTime() - now.getTime();
}

export function getExpiryTone(expiryDate: string, now = new Date()): ExpiryTone {
  const timeRemaining = calculateTimeRemaining(expiryDate, now);

  if (timeRemaining <= 0) {
    return 'expired';
  }

  if (timeRemaining <= 48 * 60 * 60 * 1000) {
    return 'warning';
  }

  return 'fresh';
}

export function getExpiryToneClasses(expiryDate: string, now = new Date()) {
  const tone = getExpiryTone(expiryDate, now);

  switch (tone) {
    case 'expired':
      return 'bg-red-100 text-red-900 dark:bg-red-900 dark:text-red-100';
    case 'warning':
      return 'bg-amber-100 text-amber-900 dark:bg-amber-900 dark:text-amber-100';
    default:
      return 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100';
  }
}

export function formatTimeRemaining(
  expiryDate: string,
  translate: (key: string, options?: Record<string, unknown>) => string,
  now = new Date(),
) {
  const timeRemaining = calculateTimeRemaining(expiryDate, now);

  if (timeRemaining <= 0) {
    const expiredHours = Math.max(1, Math.ceil(Math.abs(timeRemaining) / (60 * 60 * 1000)));

    if (expiredHours < 24) {
      return translate('dashboard.expiredHoursAgo', { count: expiredHours });
    }

    return translate('dashboard.expiredDaysAgo', {
      count: Math.ceil(expiredHours / 24),
    });
  }

  const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

  if (hoursRemaining <= 24) {
    return translate('dashboard.hoursLeft', { count: hoursRemaining });
  }

  return translate('dashboard.daysLeft', {
    count: Math.ceil(hoursRemaining / 24),
  });
}

export function countExpiringSoon(expiryDates: string[], now = new Date()) {
  return expiryDates.filter((expiryDate) => calculateTimeRemaining(expiryDate, now) <= 24 * 60 * 60 * 1000).length;
}
