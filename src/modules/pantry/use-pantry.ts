import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/shared/hooks/use-household';
import type { PantryCategory, PantryStatus } from '@/modules/pantry/pantry-categories';
import {
  createPantryItem,
  deletePantryItem,
  listPantryItems,
  updatePantryItem,
  incrementPantryQuantity,
  type PantryItemRecord,
} from '@/modules/pantry/pantry-api';

const PANTRY_KEY = ['pantry_items'] as const;

export function usePantryItems(statusFilter?: PantryStatus) {
  return useQuery({
    queryKey: [...PANTRY_KEY, statusFilter ?? 'all'],
    queryFn: () => listPantryItems(statusFilter),
  });
}

export function useCreatePantryItem() {
  const queryClient = useQueryClient();
  const { householdId, userId } = useHousehold();

  return useMutation({
    mutationFn: async (input: {
      name: string;
      category: PantryCategory;
      quantity: number;
      unit?: string;
      barcode?: string;
      expiry_date?: string;
      photo?: Blob | null;
    }) => {
      if (!householdId || !userId) throw new Error('Missing household context.');

      return createPantryItem({
        household_id: householdId,
        added_by: userId,
        name: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        barcode: input.barcode,
        expiry_date: input.expiry_date,
        photo: input.photo,
        status: 'in_stock',
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_KEY });
    },
  });
}

export function useUpdatePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...fields }: { id: string } & Parameters<typeof updatePantryItem>[1]) =>
      updatePantryItem(id, fields),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_KEY });
    },
  });
}

export function useDeletePantryItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePantryItem(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_KEY });
    },
  });
}

export function useIncrementQuantity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currentQuantity }: { id: string; currentQuantity: number }) =>
      incrementPantryQuantity(id, currentQuantity),
    onMutate: async ({ id, currentQuantity }) => {
      await queryClient.cancelQueries({ queryKey: PANTRY_KEY });

      const previous = queryClient.getQueriesData<PantryItemRecord[]>({ queryKey: PANTRY_KEY });

      queryClient.setQueriesData<PantryItemRecord[]>({ queryKey: PANTRY_KEY }, (old) =>
        old?.map((item) =>
          item.id === id ? { ...item, quantity: currentQuantity + 1 } : item,
        ),
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          queryClient.setQueryData(key, data);
        }
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: PANTRY_KEY });
    },
  });
}
