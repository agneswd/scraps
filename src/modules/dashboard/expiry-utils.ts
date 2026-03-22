import {
  Beef,
  Carrot,
  CookingPot,
  Drumstick,
  Fish,
  Milk,
  Sliders,
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
  // Based on cooked leftover refrigerator shelf life research (generous realistic values)
  seafood: 3,    // Cooked fish/shellfish: 3–4 days
  poultry: 4,    // Cooked chicken/turkey: 3–4 days
  meat: 4,       // Cooked red meat: 3–5 days
  dairy: 5,      // Dairy-based dishes/cream sauces: 4–5 days
  prepared: 5,   // Soups, stews, casseroles: 3–5 days
  veg: 5,        // Cooked vegetables: 4–5 days
  grains: 6,     // Cooked rice, pasta, grains: 5–7 days
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
  other: Sliders,
};

export function calculateDefaultExpiryDate(
  category: LeftoverCategory,
  now = new Date(),
  customDays?: number,
) {
  const days = category === 'other' && customDays != null
    ? customDays
    : CATEGORY_SHELF_LIFE_DAYS[category];
  const expiryDate = new Date(now);
  expiryDate.setDate(expiryDate.getDate() + days);
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

    const expiredDays = Math.ceil(expiredHours / 24);

    return translate(
      expiredDays === 1 ? 'dashboard.expiredDaysAgo' : 'dashboard.expiredDaysAgo_plural',
      { count: expiredDays },
    );
  }

  const hoursRemaining = Math.ceil(timeRemaining / (60 * 60 * 1000));

  if (hoursRemaining <= 24) {
    return translate('dashboard.hoursLeft', { count: hoursRemaining });
  }

  const daysRemaining = Math.ceil(hoursRemaining / 24);

  return translate(
    daysRemaining === 1 ? 'dashboard.daysLeft' : 'dashboard.daysLeft_plural',
    { count: daysRemaining },
  );
}

export function countExpiringSoon(expiryDates: string[], now = new Date()) {
  return expiryDates.filter((expiryDate) => calculateTimeRemaining(expiryDate, now) <= 24 * 60 * 60 * 1000).length;
}
