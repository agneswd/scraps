import { useMutation } from '@tanstack/react-query';
import {
  parseRecipeFromPhoto,
  parseRecipeFromText,
  parseRecipeFromUrl,
} from '@/modules/ai/gemini-api';
import { useHousehold } from '@/shared/hooks/use-household';

type ParseRecipeInput =
  | { type: 'url'; value: string }
  | { type: 'text'; value: string }
  | { type: 'photo'; value: Blob };

export function useAiRecipeParse() {
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (input: ParseRecipeInput) => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      if (input.type === 'url') {
        return parseRecipeFromUrl(householdId, input.value);
      }

      if (input.type === 'text') {
        return parseRecipeFromText(householdId, input.value);
      }

      return parseRecipeFromPhoto(householdId, input.value);
    },
  });
}
