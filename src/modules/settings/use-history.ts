import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/modules/auth/use-auth';
import { listHistoryEntries, restoreHistoryEntry, type HistoryEntry } from '@/modules/settings/data/history-api';

export function useHistory() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['history'],
    queryFn: listHistoryEntries,
    enabled: isAuthenticated,
  });

  const restoreMutation = useMutation({
    mutationFn: (entry: HistoryEntry) => restoreHistoryEntry(entry),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['history'] });
      void queryClient.invalidateQueries({ queryKey: ['leftovers'] });
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
      void queryClient.invalidateQueries({ queryKey: ['pantry_items'] });
      void queryClient.invalidateQueries({ queryKey: ['recipes'] });
      void queryClient.invalidateQueries({ queryKey: ['shopping-list'] });
    },
  });

  return {
    history: historyQuery.data ?? [],
    isLoading: historyQuery.isLoading,
    restore: (entry: HistoryEntry) => restoreMutation.mutate(entry),
    restoringId: restoreMutation.variables?.id ?? null,
  };
}
