import { useAuth } from '@/modules/auth/use-auth';

function getSingleRelationValue(value: unknown): string | null {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }
  return typeof value === 'string' ? value : null;
}

export function useHousehold() {
  const { user } = useAuth();
  const householdId = getSingleRelationValue(user?.household_id);
  const userId = typeof user?.id === 'string' ? user.id : null;

  return { householdId, userId };
}
