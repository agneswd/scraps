import { useMutation } from '@tanstack/react-query';
import { identifyItemFromPhoto } from '@/modules/ai/gemini-api';
import { useHousehold } from '@/shared/hooks/use-household';

export function useAiIdentify(target: 'leftover' | 'pantry') {
  const { householdId } = useHousehold();

  return useMutation({
    mutationFn: async (photo: Blob) => {
      if (!householdId) {
        throw new Error('missing-household-context');
      }

      return identifyItemFromPhoto(householdId, photo, target);
    },
  });
}
