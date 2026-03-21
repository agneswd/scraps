import { useMutation } from '@tanstack/react-query';
import { generateRecipeFromPantry } from '@/modules/ai/gemini-api';
import { useHousehold } from '@/shared/hooks/use-household';

export function useAiRecipeGenerate() {
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (pantryItems: string[]) => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      return generateRecipeFromPantry(householdId, pantryItems);
    },
  });
}
