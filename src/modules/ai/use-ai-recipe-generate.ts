import { useMutation } from '@tanstack/react-query';
import { generateRecipeFromPantry } from '@/modules/ai/gemini-api';
import { useHousehold } from '@/shared/hooks/use-household';

type GenerateRecipeInput = {
  pantryItems: string[];
  prompt?: string;
};

export function useAiRecipeGenerate() {
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async ({ pantryItems, prompt }: GenerateRecipeInput) => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      return generateRecipeFromPantry(householdId, pantryItems, prompt);
    },
  });
}
