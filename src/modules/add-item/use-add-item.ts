import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ClientResponseError } from 'pocketbase';
import { useAuth } from '@/modules/auth/use-auth';
import type { LeftoverCategory } from '@/modules/dashboard/expiry-utils';
import { pocketbase } from '@/shared/api/pocketbase';

type CreateLeftoverInput = {
  itemName: string;
  category: LeftoverCategory;
  expiryDate: string;
  notes: string;
  photo: Blob | null;
};

function getSingleRelationValue(value: unknown) {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : null;
  }

  return typeof value === 'string' ? value : null;
}

export function useAddItem() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const createMutation = useMutation({
    mutationFn: async ({ itemName, category, expiryDate, notes, photo }: CreateLeftoverInput) => {
      const householdId = getSingleRelationValue(user?.household_id);

      if (!user?.id || !householdId) {
        throw new Error('Missing authenticated household context.');
      }

      const formData = new FormData();
      formData.set('household_id', householdId);
      formData.set('added_by', user.id);
      formData.set('item_name', itemName);
      formData.set('category', category);
      formData.set('expiry_date', expiryDate);
      formData.set('status', 'active');

      if (notes) {
        formData.set('notes', notes);
      }

      if (photo) {
        formData.set('photo', new File([photo], `${itemName.toLowerCase().replace(/\s+/g, '-')}.webp`, { type: 'image/webp' }));
      }

      return pocketbase.collection('leftovers').create(formData);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
    },
  });

  return {
    createLeftover: async (input: CreateLeftoverInput) => {
      try {
        await createMutation.mutateAsync(input);
      } catch (caughtError) {
        if (caughtError instanceof ClientResponseError) {
          throw new Error(caughtError.response?.message || caughtError.message || 'Unable to save leftover.');
        }

        throw caughtError;
      }
    },
    isPending: createMutation.isPending,
  };
}

