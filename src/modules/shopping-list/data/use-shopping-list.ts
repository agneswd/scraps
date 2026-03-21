import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/shared/hooks/use-household';
import {
  clearCheckedShoppingListItems,
  createShoppingListItem,
  createShoppingListItems,
  deleteShoppingListItem,
  listShoppingListItems,
  updateShoppingListItem,
  type ShoppingListItemInput,
} from '@/modules/shopping-list/data/shopping-list-api';

const SHOPPING_LIST_KEY = ['shopping-list'] as const;

export function useShoppingList() {
  return useQuery({
    queryKey: SHOPPING_LIST_KEY,
    queryFn: listShoppingListItems,
  });
}

export function useCreateShoppingListItem() {
  const queryClient = useQueryClient();
  const { householdId, userId } = useHousehold();

  return useMutation({
    mutationFn: async (input: Omit<ShoppingListItemInput, 'household_id' | 'added_by'>) => {
      if (!householdId || !userId) {
        throw new Error('Missing household context.');
      }

      return createShoppingListItem({
        household_id: householdId,
        added_by: userId,
        ...input,
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useCreateShoppingListItems() {
  const queryClient = useQueryClient();
  const { householdId, userId } = useHousehold();

  return useMutation({
    mutationFn: async (items: Omit<ShoppingListItemInput, 'household_id' | 'added_by'>[]) => {
      if (!householdId || !userId) {
        throw new Error('Missing household context.');
      }

      return createShoppingListItems(
        items.map((item) => ({
          household_id: householdId,
          added_by: userId,
          ...item,
        })),
      );
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useToggleShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      updateShoppingListItem(id, { checked }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteShoppingListItem,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useClearCheckedShoppingListItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearCheckedShoppingListItems,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}
