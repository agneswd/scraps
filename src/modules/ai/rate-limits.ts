export const GEMINI_DAILY_LIMIT = 100;
export const SPOONACULAR_DAILY_LIMIT = 20;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getStorageKey(kind: 'gemini' | 'spoonacular', householdId: string) {
  return `scraps.ai.${kind}.${householdId}.${getTodayKey()}`;
}

export function getDailyUsage(kind: 'gemini' | 'spoonacular', householdId: string) {
  if (typeof window === 'undefined') {
    return 0;
  }

  const value = window.localStorage.getItem(getStorageKey(kind, householdId));
  return value ? Number(value) || 0 : 0;
}

export function incrementDailyUsage(kind: 'gemini' | 'spoonacular', householdId: string) {
  if (typeof window === 'undefined') {
    return;
  }

  const next = getDailyUsage(kind, householdId) + 1;
  window.localStorage.setItem(getStorageKey(kind, householdId), String(next));
}

export function isDailyLimitReached(kind: 'gemini' | 'spoonacular', householdId: string) {
  const limit = kind === 'gemini' ? GEMINI_DAILY_LIMIT : SPOONACULAR_DAILY_LIMIT;
  return getDailyUsage(kind, householdId) >= limit;
}
