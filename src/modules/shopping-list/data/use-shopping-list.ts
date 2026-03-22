import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useHousehold } from '@/shared/hooks/use-household';
import { archiveAndDeleteShoppingItem, archiveAndDeleteShoppingItems } from '@/modules/settings/data/history-api';
import {
  createShoppingListItem,
  createShoppingListItems,
  listShoppingListItems,
  updateShoppingListItem,
  type ShoppingListItemInput,
  type ShoppingListItemRecord,
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
    // Partial failures still commit some items server-side — always refresh the
    // list so the UI reflects the true state rather than showing stale/empty data.
    onError: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useToggleShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) =>
      updateShoppingListItem(id, { checked }),
    onMutate: async ({ id, checked }) => {
      await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_KEY });
      const previous = queryClient.getQueryData(SHOPPING_LIST_KEY);
      queryClient.setQueryData<ShoppingListItemRecord[]>(SHOPPING_LIST_KEY, (old) =>
        old?.map((item) => (item.id === id ? { ...item, checked } : item)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(SHOPPING_LIST_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
    },
  });
}

export function useDeleteShoppingListItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveAndDeleteShoppingItem,
    onMutate: async (item: ShoppingListItemRecord) => {
      await queryClient.cancelQueries({ queryKey: SHOPPING_LIST_KEY });
      const previous = queryClient.getQueryData(SHOPPING_LIST_KEY);
      queryClient.setQueryData<ShoppingListItemRecord[]>(SHOPPING_LIST_KEY, (old) =>
        old?.filter((current) => current.id !== item.id),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(SHOPPING_LIST_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}

export function useClearCheckedShoppingListItems() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const items = queryClient.getQueryData<ShoppingListItemRecord[]>(SHOPPING_LIST_KEY) ?? [];
      const checkedItems = items.filter((item) => item.checked);

      if (checkedItems.length === 0) {
        return;
      }

      await archiveAndDeleteShoppingItems(checkedItems);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SHOPPING_LIST_KEY });
      void queryClient.invalidateQueries({ queryKey: ['history'] });
    },
  });
}
